import fs from "fs";
import path from "path";
import exifr from "exifr";
import students from "@/data/students.json";
import gallery from "@/data/gallery.json";
import messages from "@/data/messages.json";
import type { Student, GalleryItem, GalleryPhoto, Dedication } from "@/types";

export function getStudents(): Student[] {
  return students as Student[];
}

export function getGallery(): GalleryItem[] {
  return gallery as GalleryItem[];
}

export function getSeedMessages(): Dedication[] {
  return messages as Dedication[];
}

/**
 * Canva page exports dropped into public/yearbook-pages/ (1.png, 2.png, …),
 * sorted numerically. Empty array = no exports yet; the flipbook falls back
 * to its generated student spreads. Server-only (reads the filesystem).
 */
export function getYearbookPages(): string[] {
  const dir = path.join(process.cwd(), "public", "yearbook-pages");
  let files: string[];
  try {
    files = fs.readdirSync(dir);
  } catch {
    return [];
  }
  return files
    .filter((f) => /\.(png|jpe?g|webp)$/i.test(f))
    .sort((a, b) =>
      a.localeCompare(b, undefined, { numeric: true, sensitivity: "base" })
    )
    .map((f) => `/yearbook-pages/${f}`);
}

/**
 * Pulls a capture timestamp (ms epoch) out of a filename. Handles the common
 * phone/camera patterns: 20240311_100654, IMG_20240311_100654, 2024-03-11,
 * VID_20240311, etc. Returns null when no plausible date is embedded.
 */
function dateFromFilename(name: string): number | null {
  // YYYY MM DD, optionally followed by HH MM SS (any/no separators)
  const m = name.match(
    /(20\d{2})[-_.]?(\d{2})[-_.]?(\d{2})(?:[-_.T]?(\d{2})[-_.]?(\d{2})[-_.]?(\d{2}))?/
  );
  if (!m) return null;
  const [, y, mo, d, hh = "12", mm = "00", ss = "00"] = m;
  const year = +y,
    month = +mo,
    day = +d;
  if (month < 1 || month > 12 || day < 1 || day > 31) return null;
  const t = new Date(year, month - 1, day, +hh, +mm, +ss).getTime();
  return Number.isNaN(t) ? null : t;
}

/**
 * Photos dropped into public/gallery/, each tagged with a capture time and
 * sorted oldest → recent. Server-only (reads the filesystem). The time is
 * resolved in priority order: filename timestamp → EXIF DateTimeOriginal →
 * file mtime (the last flagged `dated: false` so the UI knows it's a guess).
 */
export async function getGalleryPhotos(): Promise<GalleryPhoto[]> {
  const dir = path.join(process.cwd(), "public", "gallery");
  let files: string[];
  try {
    files = fs.readdirSync(dir);
  } catch {
    return [];
  }

  const imgs = files.filter((f) => /\.(png|jpe?g|webp|avif)$/i.test(f));

  const photos = await Promise.all(
    imgs.map(async (f): Promise<GalleryPhoto> => {
      const full = path.join(dir, f);
      const src = `/gallery/${f}`;

      // 1. a timestamp baked into the filename is the most reliable
      const fromName = dateFromFilename(f);
      if (fromName !== null) return { src, time: fromName, dated: true };

      // 2. EXIF capture date for photos with no dated filename. Read the
      // bytes ourselves and hand exifr a Buffer — under Turbopack, exifr's
      // own internal fs/zlib access silently fails for most files (it falls
      // back to nothing rather than throwing), so passing a path directly
      // was making almost every EXIF lookup miss.
      try {
        const buf = fs.readFileSync(full);
        const ex = await exifr.parse(buf, {
          pick: ["DateTimeOriginal", "CreateDate"],
        });
        const d: Date | undefined = ex?.DateTimeOriginal ?? ex?.CreateDate;
        if (d instanceof Date && !Number.isNaN(d.getTime())) {
          return { src, time: d.getTime(), dated: true };
        }
      } catch {
        /* no readable EXIF — fall through */
      }

      // 3. last resort: file modified time (approximate)
      let mtime = 0;
      try {
        mtime = fs.statSync(full).mtimeMs;
      } catch {
        /* leave at 0 */
      }
      return { src, time: mtime, dated: false };
    })
  );

  return photos.sort((a, b) => a.time - b.time);
}

/** Case/whitespace-insensitive comparison used to validate registrations. */
export function normalizeName(name: string): string {
  return name.trim().toLowerCase().replace(/\s+/g, " ");
}

export function findStudentByName(name: string): Student | undefined {
  const target = normalizeName(name);
  return getStudents().find((s) => normalizeName(s.fullName) === target);
}

export function searchStudents(query: string): Student[] {
  const q = query.trim().toLowerCase();
  if (!q) return getStudents();
  return getStudents().filter(
    (s) =>
      s.fullName.toLowerCase().includes(q) ||
      s.nickname.toLowerCase().includes(q) ||
      s.instagram.toLowerCase().includes(q)
  );
}
