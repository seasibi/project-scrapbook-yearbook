import { NextResponse } from "next/server";
import { getGallery } from "@/lib/data";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const category = searchParams.get("category");
  const items = getGallery();
  const filtered =
    category && category !== "all"
      ? items.filter((g) => g.category === category)
      : items;
  return NextResponse.json({ gallery: filtered });
}
