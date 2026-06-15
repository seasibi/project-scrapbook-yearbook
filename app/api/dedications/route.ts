import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSessionUser } from "@/lib/auth";
import { getSeedMessages, findStudentByName } from "@/lib/data";
import type { Dedication } from "@/types";

const MAX_MESSAGE_LENGTH = 500;

export async function GET() {
  const client = await db();
  const result = await client.execute(
    "SELECT id, from_name, from_nick, to_name, message, created_at FROM dedications ORDER BY created_at DESC, id DESC"
  );

  const stored: Dedication[] = result.rows.map((row) => ({
    id: String(row.id),
    fromName: String(row.from_name),
    fromNick: String(row.from_nick),
    toName: String(row.to_name),
    message: String(row.message),
    createdAt: String(row.created_at),
  }));

  const seeds = [...getSeedMessages()].sort((a, b) =>
    b.createdAt.localeCompare(a.createdAt)
  );

  return NextResponse.json({ dedications: [...stored, ...seeds] });
}

export async function POST(request: Request) {
  const user = getSessionUser(request);
  if (!user) {
    return NextResponse.json({ error: "Sign in to write a dedication." }, { status: 401 });
  }

  let body: { toName?: string; message?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const toName = (body.toName ?? "").trim();
  const message = (body.message ?? "").trim();

  if (!toName || !message) {
    return NextResponse.json(
      { error: "Both a recipient and a message are required." },
      { status: 400 }
    );
  }
  if (message.length > MAX_MESSAGE_LENGTH) {
    return NextResponse.json(
      { error: `Messages are limited to ${MAX_MESSAGE_LENGTH} characters.` },
      { status: 400 }
    );
  }

  const student = findStudentByName(user.fullName);
  const fromNick = student?.nickname ?? user.username;

  const client = await db();
  const result = await client.execute({
    sql: "INSERT INTO dedications (from_name, from_nick, to_name, message) VALUES (?, ?, ?, ?)",
    args: [user.fullName, fromNick, toName, message],
  });

  return NextResponse.json(
    {
      dedication: {
        id: String(result.lastInsertRowid),
        fromName: user.fullName,
        fromNick,
        toName,
        message,
        createdAt: new Date().toISOString(),
      },
    },
    { status: 201 }
  );
}
