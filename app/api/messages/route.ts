import { NextResponse } from "next/server";
import { getSeedMessages } from "@/lib/data";

export async function GET() {
  return NextResponse.json({ messages: getSeedMessages() });
}
