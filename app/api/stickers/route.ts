import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSessionUser } from "@/lib/auth";
import { stickerById, type PlacedSticker } from "@/types";

const MAX_STICKERS = 200;

function rowToSticker(row: Record<string, unknown>): PlacedSticker {
  return {
    id: Number(row.id),
    stickerId: String(row.sticker_id),
    xPct: Number(row.x_pct),
    yPct: Number(row.y_pct),
    rotation: Number(row.rotation),
    scale: Number(row.scale),
    section: String(row.section),
    placedBy: String(row.placed_by),
    textContent: row.text_content != null ? String(row.text_content) : undefined,
    textFont: row.text_font === "ransom" ? "ransom" : "pixel",
    createdAt: String(row.created_at),
  };
}

export async function GET() {
  const client = await db();
  const result = await client.execute(
    "SELECT id, sticker_id, x_pct, y_pct, rotation, scale, section, placed_by, text_content, text_font, created_at FROM stickers ORDER BY id ASC"
  );
  const stickers = result.rows.map((r) => rowToSticker(r as Record<string, unknown>));
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
    textContent?: string;
    textFont?: string;
  };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const isText = body.stickerId === "text";
  const isUpload = body.stickerId === "upload";

  if (!isText && !isUpload) {
    const def = body.stickerId ? stickerById(body.stickerId) : undefined;
    if (!def) {
      return NextResponse.json({ error: "Unknown sticker." }, { status: 400 });
    }
  }

  const xPct = Number(body.xPct);
  const yPct = Number(body.yPct);
  if (!Number.isFinite(xPct) || !Number.isFinite(yPct) || xPct < 0 || xPct > 100 || yPct < 0 || yPct > 100) {
    return NextResponse.json({ error: "Position out of bounds." }, { status: 400 });
  }

  const rotation = Math.max(-30, Math.min(30, Number(body.rotation) || 0));
  const scale = Math.max(0.3, Math.min(3, Number(body.scale) || 1));
  const section = typeof body.section === "string" ? body.section.slice(0, 40) : "page";

  const client = await db();

  const countResult = await client.execute("SELECT COUNT(*) AS n FROM stickers");
  if (Number(countResult.rows[0].n) >= MAX_STICKERS) {
    return NextResponse.json(
      { error: "The page is full — no more room for stickers!" },
      { status: 409 }
    );
  }

  if (isText) {
    const textContent = typeof body.textContent === "string" ? body.textContent.trim().slice(0, 30) : "";
    if (!textContent) {
      return NextResponse.json({ error: "Text cannot be empty." }, { status: 400 });
    }
    const textFont = body.textFont === "ransom" ? "ransom" : "pixel";

    const result = await client.execute({
      sql: "INSERT INTO stickers (sticker_id, x_pct, y_pct, rotation, scale, section, placed_by, text_content, text_font) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
      args: ["text", xPct, yPct, rotation, scale, section, user.username, textContent, textFont],
    });

    const sticker: PlacedSticker = {
      id: Number(result.lastInsertRowid),
      stickerId: "text",
      xPct, yPct, rotation, scale, section,
      placedBy: user.username,
      textContent,
      textFont,
      createdAt: new Date().toISOString(),
    };
    return NextResponse.json({ sticker }, { status: 201 });
  }

  if (isUpload) {
    const raw = typeof body.textContent === "string" ? body.textContent : "";
    if (!raw || !/^data:image\/(png|jpeg|gif|webp);base64,/.test(raw)) {
      return NextResponse.json({ error: "Invalid image data." }, { status: 400 });
    }
    if (raw.length > 200_000) {
      return NextResponse.json({ error: "Image too large — please use a smaller file." }, { status: 413 });
    }

    const result = await client.execute({
      sql: "INSERT INTO stickers (sticker_id, x_pct, y_pct, rotation, scale, section, placed_by, text_content) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
      args: ["upload", xPct, yPct, rotation, scale, section, user.username, raw],
    });

    const sticker: PlacedSticker = {
      id: Number(result.lastInsertRowid),
      stickerId: "upload",
      xPct, yPct, rotation, scale, section,
      placedBy: user.username,
      textContent: raw,
      createdAt: new Date().toISOString(),
    };
    return NextResponse.json({ sticker }, { status: 201 });
  }

  const def = stickerById(body.stickerId!)!;
  const result = await client.execute({
    sql: "INSERT INTO stickers (sticker_id, x_pct, y_pct, rotation, scale, section, placed_by) VALUES (?, ?, ?, ?, ?, ?, ?)",
    args: [def.id, xPct, yPct, rotation, scale, section, user.username],
  });

  const sticker: PlacedSticker = {
    id: Number(result.lastInsertRowid),
    stickerId: def.id,
    xPct, yPct, rotation, scale, section,
    placedBy: user.username,
    createdAt: new Date().toISOString(),
  };
  return NextResponse.json({ sticker }, { status: 201 });
}

export async function PATCH(request: Request) {
  const user = getSessionUser(request);
  if (!user) {
    return NextResponse.json({ error: "Sign in first." }, { status: 401 });
  }

  let body: { id?: number; xPct?: number; yPct?: number; rotation?: number; scale?: number };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid body." }, { status: 400 });
  }

  const id = Number(body.id);
  if (!Number.isInteger(id) || id <= 0) {
    return NextResponse.json({ error: "Missing sticker id." }, { status: 400 });
  }

  const xPct = Number(body.xPct);
  const yPct = Number(body.yPct);
  if (!Number.isFinite(xPct) || !Number.isFinite(yPct) || xPct < 0 || xPct > 100 || yPct < 0 || yPct > 100) {
    return NextResponse.json({ error: "Position out of bounds." }, { status: 400 });
  }

  const rotation = Math.max(-30, Math.min(30, Number(body.rotation) || 0));
  const scale = Math.max(0.3, Math.min(3, Number(body.scale) || 1));

  const client = await db();
  const result = await client.execute({
    sql: "UPDATE stickers SET x_pct = ?, y_pct = ?, rotation = ?, scale = ? WHERE id = ? AND placed_by = ?",
    args: [xPct, yPct, rotation, scale, id, user.username],
  });

  if (result.rowsAffected === 0) {
    return NextResponse.json({ error: "Not found or not yours." }, { status: 403 });
  }

  return NextResponse.json({ ok: true });
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
