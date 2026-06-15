import { NextResponse } from "next/server";
import { getSessionUser, clearSessionCookie } from "@/lib/auth";

export async function GET(request: Request) {
  const user = getSessionUser(request);
  if (!user) {
    return NextResponse.json({ user: null }, { status: 401 });
  }
  return NextResponse.json({
    user: { username: user.username, fullName: user.fullName },
  });
}

export async function DELETE() {
  const response = NextResponse.json({ ok: true });
  response.headers.set("Set-Cookie", clearSessionCookie());
  return response;
}
