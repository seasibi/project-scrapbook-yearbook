import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSessionUser } from "@/lib/auth";
import { stickerById, type PlacedSticker } from "@/types";

const MAX_STICKERS = 200;

export async function GET() {
  const client = await db();
  const result = await client.execute(
    "SELECT id, sticker_id, x_pct, y_pct, rotation, scale, section, placed_by, created_at FROM stickers ORDER BY id ASC"
  );

  const stickers: PlacedSticker[] = result.rows.map((row) => ({
    id: Number(row.id),
    stickerId: String(row.sticker_id),
    xPct: Number(row.x_pct),
    yPct: Number(row.y_pct),
    rotation: Number(row.rotation),
    scale: Number(row.scale),
    section: String(row.section),
    placedBy: String(row.placed_by),
    createdAt: String(row.created_at),
  }));

  return NextResponse.json({ stickers });
}

export async function POST(request: Request) {
  const user = getSessionUser(request);
  if (!user) {
    return NextResponse.json({ error: "Sign in to place stickers." }, { status: 401 });
  }

  let body: {
    stickerId?: string;
    xPct?: number;
    yPct?: number;
    rotation?: number;
    scale?: number;
    section?: string;
  };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const def = body.stickerId ? stickerById(body.stickerId) : undefined;
  if (!def) {
    return NextResponse.json({ error: "Unknown sticker." }, { status: 400 });
  }

  const xPct = Number(body.xPct);
  const yPct = Number(body.yPct);
  if (!Number.isFinite(xPct) || !Number.isFinite(yPct) || xPct < 0 || xPct > 100 || yPct < 0 || yPct > 100) {
    return NextResponse.json({ error: "Position out of bounds." }, { status: 400 });
  }

  const rotation = Math.max(-30, Math.min(30, Number(body.rotation) || 0));
  const scale = Math.max(0.5, Math.min(2, Number(body.scale) || 1));
  const section = typeof body.section === "string" ? body.section.slice(0, 40) : "page";

  const client = await db();

  const countResult = await client.execute("SELECT COUNT(*) AS n FROM stickers");
  if (Number(countResult.rows[0].n) >= MAX_STICKERS) {
    return NextResponse.json(
      { error: "The page is full — no more room for stickers!" },
      { status: 409 }
    );
  }

  const result = await client.execute({
    sql: "INSERT INTO stickers (sticker_id, x_pct, y_pct, rotation, scale, section, placed_by) VALUES (?, ?, ?, ?, ?, ?, ?)",
    args: [def.id, xPct, yPct, rotation, scale, section, user.username],
  });

  const sticker: PlacedSticker = {
    id: Number(result.lastInsertRowid),
    stickerId: def.id,
    xPct,
    yPct,
    rotation,
    scale,
    section,
    placedBy: user.username,
    createdAt: new Date().toISOString(),
  };

  return NextResponse.json({ sticker }, { status: 201 });
}

export async function DELETE(request: Request) {
  const user = getSessionUser(request);
  if (!user) {
    return NextResponse.json({ error: "Sign in first." }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const id = Number(searchParams.get("id"));
  if (!Number.isInteger(id)) {
    return NextResponse.json({ error: "Missing sticker id." }, { status: 400 });
  }

  const client = await db();
  const result = await client.execute({
    sql: "DELETE FROM stickers WHERE id = ? AND placed_by = ?",
    args: [id, user.username],
  });

  if (result.rowsAffected === 0) {
    return NextResponse.json(
      { error: "You can only remove your own stickers." },
      { status: 403 }
    );
  }

  return NextResponse.json({ ok: true });
}
