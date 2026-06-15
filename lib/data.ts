import fs from "fs";
import path from "path";
import students from "@/data/students.json";
import gallery from "@/data/gallery.json";
import messages from "@/data/messages.json";
import type { Student, GalleryItem, Dedication } from "@/types";

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
