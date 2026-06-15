import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { hashPassword, signToken, sessionCookie } from "@/lib/auth";
import { findStudentByName } from "@/lib/data";

export async function POST(request: Request) {
  let body: { fullName?: string; username?: string; password?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const fullName = (body.fullName ?? "").trim();
  const username = (body.username ?? "").trim().toLowerCase();
  const password = body.password ?? "";

  if (!fullName || !username || !password) {
    return NextResponse.json({ error: "All fields are required." }, { status: 400 });
  }
  if (!/^[a-z0-9._-]{3,24}$/.test(username)) {
    return NextResponse.json(
      { error: "Username must be 3–24 characters (letters, numbers, . _ -)." },
      { status: 400 }
    );
  }
  if (password.length < 6) {
    return NextResponse.json(
      { error: "Password must be at least 6 characters." },
      { status: 400 }
    );
  }

  const student = findStudentByName(fullName);
  if (!student) {
    return NextResponse.json(
      { error: "Name not found in the yearbook." },
      { status: 403 }
    );
  }

  const client = await db();

  const existingUsername = await client.execute({
    sql: "SELECT id FROM users WHERE username = ?",
    args: [username],
  });
  if (existingUsername.rows.length > 0) {
    return NextResponse.json({ error: "That username is taken." }, { status: 409 });
  }

  const existingGraduate = await client.execute({
    sql: "SELECT id FROM users WHERE lower(full_name) = lower(?)",
    args: [student.fullName],
  });
  if (existingGraduate.rows.length > 0) {
    return NextResponse.json(
      { error: "This graduate already has an account." },
      { status: 409 }
    );
  }

  const result = await client.execute({
    sql: "INSERT INTO users (full_name, username, password) VALUES (?, ?, ?)",
    args: [student.fullName, username, hashPassword(password)],
  });

  const user = {
    id: Number(result.lastInsertRowid),
    username,
    fullName: student.fullName,
  };

  const response = NextResponse.json({ user }, { status: 201 });
  response.headers.set("Set-Cookie", sessionCookie(signToken(user)));
  return response;
}
