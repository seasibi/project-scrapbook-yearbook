export interface Student {
  id: number;
  fullName: string;
  firstName: string;
  lastName: string;
  middleName: string;
  nickname: string;
  quote: string;
  motto: string;
  birthday: string;
  instagram: string;
  color: string;
}

export interface GalleryItem {
  id: number;
  title: string;
  category: GalleryCategory;
  year: string;
  tone: string;
}

export type GalleryCategory =
  | "events"
  | "sports"
  | "socials"
  | "academic"
  | "milestones";

export const GALLERY_CATEGORIES: GalleryCategory[] = [
  "events",
  "sports",
  "socials",
  "academic",
  "milestones",
];

export interface Dedication {
  id: string;
  fromName: string;
  fromNick: string;
  toName: string;
  message: string;
  createdAt: string;
}

export interface SessionUser {
  id: number;
  username: string;
  fullName: string;
}

export type StickerCategory = "floral" | "ribbon" | "paper" | "ephemera";

export interface StickerDef {
  id: string;
  name: string;
  category: StickerCategory;
  /** Full inline SVG markup, rendered via dangerouslySetInnerHTML. */
  svg: string;
}

export interface PlacedSticker {
  id: number;
  stickerId: string;
  xPct: number;
  yPct: number;
  rotation: number;
  scale: number;
  section: string;
  placedBy: string;
  textContent?: string;
  textFont?: "pixel" | "ransom";
  createdAt: string;
}

const v = `xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" width="48" height="48"`;

export const STICKERS: StickerDef[] = [
  // ── floral ──────────────────────────────────────────────
  {
    id: "pressed-rose",
    name: "Pressed Rose",
    category: "floral",
    svg: `<svg ${v}><path d="M24 26c0 8-1 14-2 18" stroke="#5a6e3a" stroke-width="2" fill="none" stroke-linecap="round"/><path d="M23 34c-4-1-7-3-8-6m9 2c3 0 6-2 7-5" stroke="#5a6e3a" stroke-width="1.6" fill="none" stroke-linecap="round"/><circle cx="24" cy="16" r="10" fill="#b04a5a"/><path d="M24 8c4 1 7 4 7 8s-3 7-7 8c-4-1-7-4-7-8s3-7 7-8z" fill="#c96f7d"/><circle cx="24" cy="16" r="4" fill="#8a3242"/></svg>`,
  },
  {
    id: "pressed-daisy",
    name: "Pressed Daisy",
    category: "floral",
    svg: `<svg ${v}><g fill="#f3ead6" stroke="#c9bda0" stroke-width="0.8"><ellipse cx="24" cy="10" rx="4.5" ry="8"/><ellipse cx="24" cy="38" rx="4.5" ry="8"/><ellipse cx="10" cy="24" rx="8" ry="4.5"/><ellipse cx="38" cy="24" rx="8" ry="4.5"/><ellipse cx="14" cy="14" rx="4" ry="7" transform="rotate(-45 14 14)"/><ellipse cx="34" cy="14" rx="4" ry="7" transform="rotate(45 34 14)"/><ellipse cx="14" cy="34" rx="4" ry="7" transform="rotate(45 14 34)"/><ellipse cx="34" cy="34" rx="4" ry="7" transform="rotate(-45 34 34)"/></g><circle cx="24" cy="24" r="6" fill="#d9a43b"/></svg>`,
  },
  {
    id: "wildflower",
    name: "Wildflower",
    category: "floral",
    svg: `<svg ${v}><path d="M24 44V20" stroke="#5a6e3a" stroke-width="2" stroke-linecap="round"/><path d="M24 32c-5 0-8-3-9-7m9 11c4 0 7-2 8-6" stroke="#5a6e3a" stroke-width="1.6" fill="none" stroke-linecap="round"/><g fill="#9a6fc9"><circle cx="24" cy="10" r="4"/><circle cx="17" cy="14" r="4"/><circle cx="31" cy="14" r="4"/><circle cx="19" cy="21" r="4"/><circle cx="29" cy="21" r="4"/></g><circle cx="24" cy="16" r="4" fill="#e8c95a"/></svg>`,
  },
  {
    id: "lavender-sprig",
    name: "Lavender Sprig",
    category: "floral",
    svg: `<svg ${v}><path d="M24 46C22 34 22 20 24 8" stroke="#5a6e3a" stroke-width="1.8" fill="none" stroke-linecap="round"/><g fill="#8a7ab8"><ellipse cx="24" cy="8" rx="3" ry="4"/><ellipse cx="20" cy="13" rx="3" ry="4" transform="rotate(-20 20 13)"/><ellipse cx="28" cy="13" rx="3" ry="4" transform="rotate(20 28 13)"/><ellipse cx="19" cy="20" rx="3" ry="4" transform="rotate(-24 19 20)"/><ellipse cx="29" cy="20" rx="3" ry="4" transform="rotate(24 29 20)"/><ellipse cx="20" cy="27" rx="2.6" ry="3.6" transform="rotate(-20 20 27)"/><ellipse cx="28" cy="27" rx="2.6" ry="3.6" transform="rotate(20 28 27)"/></g></svg>`,
  },
  {
    id: "leaf-cluster",
    name: "Leaf Cluster",
    category: "floral",
    svg: `<svg ${v}><path d="M10 40C16 28 24 18 40 10" stroke="#4a6e3a" stroke-width="1.8" fill="none" stroke-linecap="round"/><g fill="#6e8f4a"><path d="M16 32c-6 0-9-3-10-7 5-1 9 1 10 7z"/><path d="M22 25c-5-2-7-6-6-10 5 0 8 4 6 10z"/><path d="M29 18c-3-4-3-9-1-12 4 2 5 7 1 12z"/><path d="M20 34c2-5 6-7 10-6 0 5-4 8-10 6z"/><path d="M27 26c3-4 7-5 11-3-1 4-6 6-11 3z"/></g></svg>`,
  },
  // ── ribbon ──────────────────────────────────────────────
  {
    id: "big-bow",
    name: "Big Bow",
    category: "ribbon",
    svg: `<svg ${v}><path d="M24 24C16 14 8 12 5 16c-3 4 1 12 13 12 2 0 4-1 6-4z" fill="#c96f86" stroke="#a4485e" stroke-width="1.2"/><path d="M24 24c8-10 16-12 19-8 3 4-1 12-13 12-2 0-4-1-6-4z" fill="#c96f86" stroke="#a4485e" stroke-width="1.2"/><path d="M21 27l-5 13 8-5 8 5-5-13z" fill="#b85a73"/><circle cx="24" cy="25" r="4.5" fill="#a4485e"/></svg>`,
  },
  {
    id: "mini-bow",
    name: "Mini Bow",
    category: "ribbon",
    svg: `<svg ${v}><path d="M24 24c-6-6-12-7-14-4-2 3 2 8 10 8 1 0 3-1 4-4z" fill="#e0a4b4"/><path d="M24 24c6-6 12-7 14-4 2 3-2 8-10 8-1 0-3-1-4-4z" fill="#e0a4b4"/><circle cx="24" cy="25" r="3" fill="#c97a8f"/></svg>`,
  },
  {
    id: "ribbon-strip",
    name: "Ribbon Strip",
    category: "ribbon",
    svg: `<svg ${v}><path d="M4 20h40v8H4z" fill="#b85a73"/><path d="M4 20l6 4-6 4zm40 0l-6 4 6 4z" fill="#8f4458"/><path d="M8 24h32" stroke="#e0a4b4" stroke-width="1.4" stroke-dasharray="3 3"/></svg>`,
  },
  {
    id: "washi-stars",
    name: "Washi Stars",
    category: "ribbon",
    svg: `<svg ${v}><rect x="2" y="16" width="44" height="14" rx="1" fill="#d9c89a" opacity="0.85"/><g fill="#8f6f2e"><path d="M10 20l1.2 2.4 2.6.4-1.9 1.9.4 2.6-2.3-1.2-2.3 1.2.4-2.6L6.2 22.8l2.6-.4z"/><path d="M24 20l1.2 2.4 2.6.4-1.9 1.9.4 2.6-2.3-1.2-2.3 1.2.4-2.6-1.9-1.9 2.6-.4z"/><path d="M38 20l1.2 2.4 2.6.4-1.9 1.9.4 2.6-2.3-1.2-2.3 1.2.4-2.6-1.9-1.9 2.6-.4z"/></g></svg>`,
  },
  // ── paper ───────────────────────────────────────────────
  {
    id: "clear-tape",
    name: "Clear Tape",
    category: "paper",
    svg: `<svg ${v}><path d="M6 18l36-4 .8 14L7 32z" fill="#e8e2d2" opacity="0.65"/><path d="M6 18l2-3 1 3.4zm36.8 10l-2 3-1-3.4z" fill="#d4cdb8" opacity="0.7"/></svg>`,
  },
  {
    id: "torn-paper",
    name: "Torn Paper Edge",
    category: "paper",
    svg: `<svg ${v}><path d="M4 14h40v16l-4-2-3 3-4-2-3 3-5-3-4 3-3-3-4 2-3-2-3 3-4-2z" fill="#f3ead6" stroke="#cfc4a8" stroke-width="0.8"/><path d="M9 20h30M9 24h22" stroke="#b8ad94" stroke-width="1" stroke-linecap="round"/></svg>`,
  },
  {
    id: "postage-stamp",
    name: "Postage Stamp",
    category: "paper",
    svg: `<svg ${v}><path d="M6 6h36v36H6z" fill="#f3ead6"/><path d="M6 6h36v36H6z" fill="none" stroke="#b8ad94" stroke-width="2" stroke-dasharray="0.1 5" stroke-linecap="round"/><rect x="11" y="11" width="26" height="20" fill="#7d8fa4"/><path d="M11 27c5-6 9-3 13 0s8 5 13-2v6H11z" fill="#6e8f4a"/><circle cx="32" cy="17" r="3" fill="#f3e8c9"/><text x="24" y="39" text-anchor="middle" font-family="monospace" font-size="6" fill="#7a2230">CLASS 2026</text></svg>`,
  },
  {
    id: "polaroid",
    name: "Polaroid",
    category: "paper",
    svg: `<svg ${v}><rect x="6" y="4" width="36" height="40" fill="#fdfaf2" stroke="#d4cdb8" stroke-width="1"/><rect x="10" y="8" width="28" height="26" fill="#aebfd1"/><path d="M10 30c5-7 10-4 14-1s9 4 14-3v8H10z" fill="#8fa46e"/><circle cx="32" cy="14" r="3" fill="#fdfaf2" opacity="0.9"/></svg>`,
  },
  // ── ephemera ────────────────────────────────────────────
  {
    id: "butterfly",
    name: "Butterfly",
    category: "ephemera",
    svg: `<svg ${v}><path d="M24 14v22" stroke="#3a3226" stroke-width="2" stroke-linecap="round"/><path d="M22 16C14 6 4 8 5 16c1 7 9 10 17 8zm4 0c8-10 18-8 17 0-1 7-9 10-17 8z" fill="#c9892e" stroke="#8f5e1c" stroke-width="1"/><path d="M22 26c-7-1-13 2-12 8 1 5 8 4 12-4zm4 0c7-1 13 2 12 8-1 5-8 4-12-4z" fill="#d9a43b" stroke="#8f5e1c" stroke-width="1"/><path d="M22 14c-2-3-4-5-6-6m10 6c2-3 4-5 6-6" stroke="#3a3226" stroke-width="1.4" fill="none" stroke-linecap="round"/></svg>`,
  },
  {
    id: "sparkle",
    name: "Sparkle",
    category: "ephemera",
    svg: `<svg ${v}><path d="M24 4c2 9 6 14 16 16-10 2-14 7-16 16-2-9-6-14-16-16 10-2 14-7 16-16z" fill="#d9b54a"/><path d="M37 32c.8 3.6 2.4 5.6 6 6.4-3.6.8-5.2 2.8-6 6.4-.8-3.6-2.4-5.6-6-6.4 3.6-.8 5.2-2.8 6-6.4z" fill="#e8cd7a"/></svg>`,
  },
  {
    id: "pressed-heart",
    name: "Pressed Heart",
    category: "ephemera",
    svg: `<svg ${v}><path d="M24 41C12 32 5 24 7 15c1.6-7 11-8 17-1 6-7 15.4-6 17 1 2 9-5 17-17 26z" fill="#b04a5a" stroke="#7a2230" stroke-width="1.4"/><path d="M14 16c2-3 5-4 8-2" stroke="#d98a96" stroke-width="1.6" fill="none" stroke-linecap="round"/></svg>`,
  },
  {
    id: "skeleton-key",
    name: "Skeleton Key",
    category: "ephemera",
    svg: `<svg ${v}><circle cx="14" cy="14" r="8" fill="none" stroke="#6e6452" stroke-width="3"/><path d="M19 19l20 20m-7-1l3-3m-8-2l3-3" stroke="#6e6452" stroke-width="3" stroke-linecap="round"/></svg>`,
  },
  {
    id: "grad-ticket",
    name: "Graduation Ticket",
    category: "ephemera",
    svg: `<svg ${v}><path d="M4 16h40v16H4z" fill="#c9a13b"/><path d="M4 16h40v16H4z" fill="none" stroke="#8f6f1c" stroke-width="1.4"/><circle cx="4" cy="24" r="3" fill="#fdfaf2"/><circle cx="44" cy="24" r="3" fill="#fdfaf2"/><path d="M12 18v12" stroke="#8f6f1c" stroke-width="1" stroke-dasharray="2 2"/><text x="29" y="23" text-anchor="middle" font-family="monospace" font-size="5.5" fill="#4a3a10">ADMIT ONE</text><text x="29" y="29.5" text-anchor="middle" font-family="monospace" font-size="4.6" fill="#4a3a10">JULY 3, 2026</text></svg>`,
  },
  {
    id: "doodle-star",
    name: "Hand-drawn Star",
    category: "ephemera",
    svg: `<svg ${v}><path d="M24 6l4.8 12.6L42 20l-10 8.4 3.4 13L24 33.6 12.6 41.4l3.4-13L6 20l13.2-1.4z" fill="none" stroke="#3a3226" stroke-width="2.2" stroke-linejoin="round"/></svg>`,
  },
];

export const STICKER_CATEGORIES: { id: StickerCategory; label: string }[] = [
  { id: "floral", label: "🌸 floral" },
  { id: "ribbon", label: "🎀 ribbon" },
  { id: "paper", label: "📄 paper" },
  { id: "ephemera", label: "✦ ephemera" },
];

export function stickerById(id: string): StickerDef | undefined {
  return STICKERS.find((s) => s.id === id);
}
