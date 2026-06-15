import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { verifyPassword, signToken, sessionCookie } from "@/lib/auth";

export async function POST(request: Request) {
  let body: { username?: string; password?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const username = (body.username ?? "").trim().toLowerCase();
  const password = body.password ?? "";

  if (!username || !password) {
    return NextResponse.json(
      { error: "Username and password are required." },
      { status: 400 }
    );
  }

  const client = await db();
  const result = await client.execute({
    sql: "SELECT id, full_name, username, password FROM users WHERE username = ?",
    args: [username],
  });

  const row = result.rows[0];
  if (!row || !verifyPassword(password, String(row.password))) {
    return NextResponse.json(
      { error: "Wrong username or password." },
      { status: 401 }
    );
  }

  const user = {
    id: Number(row.id),
    username: String(row.username),
    fullName: String(row.full_name),
  };

  const response = NextResponse.json({ user });
  response.headers.set("Set-Cookie", sessionCookie(signToken(user)));
  return response;
}
