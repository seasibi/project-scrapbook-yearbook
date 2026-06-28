"use client";

import { useCallback, useEffect, useRef, useState, type DragEvent, type PointerEvent } from "react";
import { useAuth } from "@/components/AuthContext";
import RansomImageText from "@/components/RansomImageText";
import {
  STICKERS,
  STICKER_CATEGORIES,
  stickerById,
  type PlacedSticker,
  type StickerCategory,
} from "@/types";

const POLL_INTERVAL = 15_000;
const MAX_UPLOAD_PX = 140;
const MAX_UPLOAD_BYTES = 180_000;

type TrayTab = StickerCategory | "text" | "upload";

interface ActiveDrag {
  id: number;
  startPx: number;
  startPy: number;
  origXPct: number;
  origYPct: number;
  xPct: number;
  yPct: number;
  rotation: number;
  scale: number;
  section: string;
}

interface ActiveResize {
  id: number;
  startPy: number;
  origScale: number;
  xPct: number;
  yPct: number;
  rotation: number;
  scale: number;
}

const SECTIONS = ["home", "yearbook", "portraits", "gallery", "dedications"];

function detectSection(clientX: number, clientY: number): string {
  for (const id of SECTIONS) {
    const el = document.getElementById(id);
    if (!el) continue;
    const r = el.getBoundingClientRect();
    if (clientY >= r.top && clientY <= r.bottom && clientX >= r.left && clientX <= r.right) {
      return id;
    }
  }
  return "page";
}

function toSectionPct(
  clientX: number,
  clientY: number,
  sectionId: string,
  layerEl: HTMLDivElement
): { xPct: number; yPct: number } {
  if (sectionId === "page") {
    const lr = layerEl.getBoundingClientRect();
    return {
      xPct: ((clientX - lr.left) / lr.width) * 100,
      yPct: ((clientY - lr.top) / lr.width) * 100,
    };
  }
  const el = document.getElementById(sectionId);
  if (!el) {
    const lr = layerEl.getBoundingClientRect();
    return {
      xPct: ((clientX - lr.left) / lr.width) * 100,
      yPct: ((clientY - lr.top) / lr.width) * 100,
    };
  }
  const r = el.getBoundingClientRect();
  return {
    xPct: ((clientX - r.left) / r.width) * 100,
    yPct: ((clientY - r.top) / r.width) * 100,
  };
}

function stickerPosition(
  sticker: PlacedSticker,
  layerEl: HTMLDivElement
): { left: string; top: string } | null {
  if (sticker.section === "page" || !sticker.section) {
    const lr = layerEl.getBoundingClientRect();
    return {
      left: `${(sticker.xPct / 100) * lr.width}px`,
      top: `${(sticker.yPct / 100) * lr.width}px`,
    };
  }
  const sectionEl = document.getElementById(sticker.section);
  if (!sectionEl) {
    const lr = layerEl.getBoundingClientRect();
    return {
      left: `${(sticker.xPct / 100) * lr.width}px`,
      top: `${(sticker.yPct / 100) * lr.width}px`,
    };
  }
  const lr = layerEl.getBoundingClientRect();
  const sr = sectionEl.getBoundingClientRect();
  const x = sr.left - lr.left + (sticker.xPct / 100) * sr.width;
  const y = sr.top - lr.top + (sticker.yPct / 100) * sr.width;
  return { left: `${x}px`, top: `${y}px` };
}

// ── compress image via canvas ─────────────────────────────────────────────
function compressImage(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(url);
      const scale = Math.min(1, MAX_UPLOAD_PX / Math.max(img.width, img.height));
      const w = Math.max(1, Math.round(img.width * scale));
      const h = Math.max(1, Math.round(img.height * scale));
      const canvas = document.createElement("canvas");
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext("2d");
      if (!ctx) { reject(new Error("canvas unavailable")); return; }
      ctx.drawImage(img, 0, 0, w, h);
      let dataUrl = canvas.toDataURL("image/png");
      if (dataUrl.length > MAX_UPLOAD_BYTES) {
        dataUrl = canvas.toDataURL("image/jpeg", 0.8);
      }
      if (dataUrl.length > MAX_UPLOAD_BYTES) {
        reject(new Error("Image still too large after compression."));
        return;
      }
      resolve(dataUrl);
    };
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error("Failed to load image.")); };
    img.src = url;
  });
}

export default function StickerLayer() {
  const { user } = useAuth();
  const [placed, setPlaced] = useState<PlacedSticker[]>([]);
  const [trayOpen, setTrayOpen] = useState(false);
  const [category, setCategory] = useState<TrayTab>("floral");
  const [dragging, setDragging] = useState(false);
  const [justLanded, setJustLanded] = useState<number | null>(null);
  const layerRef = useRef<HTMLDivElement>(null);

  const [textDraft, setTextDraft] = useState("");
  const [textFont, setTextFont] = useState<"pixel" | "ransom">("pixel");
  const [placingText, setPlacingText] = useState(false);

  const [uploadPreview, setUploadPreview] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState("");
  const [placingUpload, setPlacingUpload] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const activeDragRef = useRef<ActiveDrag | null>(null);
  const activeResizeRef = useRef<ActiveResize | null>(null);
  const [movingId, setMovingId] = useState<number | null>(null);

  // close tray on Escape
  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape" && trayOpen) setTrayOpen(false);
    }
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [trayOpen]);

  // force re-render on scroll/resize so section-relative positions update
  const [, setTick] = useState(0);
  useEffect(() => {
    let raf = 0;
    const bump = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => setTick((t) => t + 1));
    };
    window.addEventListener("scroll", bump, { passive: true });
    window.addEventListener("resize", bump);
    return () => {
      window.removeEventListener("scroll", bump);
      window.removeEventListener("resize", bump);
      cancelAnimationFrame(raf);
    };
  }, []);

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/stickers");
      const data = await res.json();
      setPlaced(data.stickers ?? []);
    } catch {
      // keep showing what we have
    }
  }, []);

  useEffect(() => {
    const t = window.setTimeout(load, 0);
    const timer = setInterval(load, POLL_INTERVAL);
    return () => { window.clearTimeout(t); clearInterval(timer); };
  }, [load]);

  // ── tray drag-drop (SVG stickers) ──────────────────────────────────
  function onTrayDragStart(e: DragEvent, stickerId: string) {
    e.dataTransfer.setData("text/sticker-id", stickerId);
    e.dataTransfer.effectAllowed = "copy";
    setDragging(true);
  }

  async function onDrop(e: DragEvent) {
    e.preventDefault();
    setDragging(false);
    const stickerId = e.dataTransfer.getData("text/sticker-id");
    if (!stickerId || !layerRef.current || !user) return;

    const section = detectSection(e.clientX, e.clientY);
    const { xPct, yPct } = toSectionPct(e.clientX, e.clientY, section, layerRef.current);
    const rotation = Math.round((Math.random() * 28 - 14) * 10) / 10;
    const scale = Math.round((0.85 + Math.random() * 0.4) * 100) / 100;

    try {
      const res = await fetch("/api/stickers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ stickerId, xPct, yPct, rotation, scale, section }),
      });
      const data = await res.json();
      if (res.ok && data.sticker) {
        setPlaced((prev) => [...prev, data.sticker]);
        setJustLanded(data.sticker.id);
        setTimeout(() => setJustLanded(null), 600);
      }
    } catch {}
  }

  // ── text sticker placement ──────────────────────────────────────────
  async function placeTextSticker() {
    if (!textDraft.trim() || !user || placingText) return;
    setPlacingText(true);
    try {
      const cx = window.innerWidth / 2;
      const cy = window.innerHeight / 2;
      const section = detectSection(cx, cy);
      const { xPct, yPct } = toSectionPct(
        cx + (Math.random() * 100 - 50),
        cy + (Math.random() * 60 - 30),
        section,
        layerRef.current!
      );
      const rotation = Math.round((Math.random() * 20 - 10) * 10) / 10;
      const res = await fetch("/api/stickers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          stickerId: "text",
          textContent: textDraft.trim().slice(0, 30),
          textFont,
          xPct, yPct, rotation, scale: 1, section,
        }),
      });
      const data = await res.json();
      if (res.ok && data.sticker) {
        setPlaced((prev) => [...prev, data.sticker]);
        setJustLanded(data.sticker.id);
        setTimeout(() => setJustLanded(null), 600);
        setTextDraft("");
      }
    } catch {}
    setPlacingText(false);
  }

  // ── upload sticker ──────────────────────────────────────────────────
  async function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    setUploadError("");
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setUploadError("Please pick an image file.");
      return;
    }
    try {
      const dataUrl = await compressImage(file);
      setUploadPreview(dataUrl);
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : "Could not process image.");
    }
  }

  async function placeUploadSticker() {
    if (!uploadPreview || !user || placingUpload) return;
    setPlacingUpload(true);
    try {
      const cx = window.innerWidth / 2;
      const cy = window.innerHeight / 2;
      const section = detectSection(cx, cy);
      const { xPct, yPct } = toSectionPct(
        cx + (Math.random() * 100 - 50),
        cy + (Math.random() * 60 - 30),
        section,
        layerRef.current!
      );
      const rotation = Math.round((Math.random() * 20 - 10) * 10) / 10;
      const res = await fetch("/api/stickers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          stickerId: "upload",
          textContent: uploadPreview,
          xPct, yPct, rotation, scale: 1, section,
        }),
      });
      const data = await res.json();
      if (res.ok && data.sticker) {
        setPlaced((prev) => [...prev, data.sticker]);
        setJustLanded(data.sticker.id);
        setTimeout(() => setJustLanded(null), 600);
        setUploadPreview(null);
      } else {
        setUploadError(data.error ?? "Failed to place sticker.");
      }
    } catch {
      setUploadError("Network error — try again.");
    }
    setPlacingUpload(false);
  }

  // ── remove sticker ──────────────────────────────────────────────────
  async function remove(sticker: PlacedSticker) {
    if (!user || sticker.placedBy !== user.username) return;
    setPlaced((prev) => prev.filter((s) => s.id !== sticker.id));
    await fetch(`/api/stickers?id=${sticker.id}`, { method: "DELETE" });
  }

  // ── move sticker (pointer capture on the sticker element) ───────────
  function startMove(e: PointerEvent<HTMLDivElement>, sticker: PlacedSticker) {
    if (e.button !== 0) return;
    e.preventDefault();
    e.stopPropagation();
    e.currentTarget.setPointerCapture(e.pointerId);
    activeDragRef.current = {
      id: sticker.id,
      startPx: e.clientX, startPy: e.clientY,
      origXPct: sticker.xPct, origYPct: sticker.yPct,
      xPct: sticker.xPct, yPct: sticker.yPct,
      rotation: sticker.rotation, scale: sticker.scale,
      section: sticker.section,
    };
    setMovingId(sticker.id);
  }

  function onStickerPointerMove(e: PointerEvent<HTMLDivElement>, sticker: PlacedSticker) {
    const drag = activeDragRef.current;
    if (!drag || drag.id !== sticker.id || !layerRef.current) return;

    // compute delta in the section's coordinate space
    const sectionEl = drag.section !== "page" ? document.getElementById(drag.section) : null;
    const refRect = sectionEl ? sectionEl.getBoundingClientRect() : layerRef.current.getBoundingClientRect();

    const newX = Math.max(1, Math.min(99, drag.origXPct + ((e.clientX - drag.startPx) / refRect.width) * 100));
    const newY = drag.origYPct + ((e.clientY - drag.startPy) / refRect.width) * 100;
    drag.xPct = newX;
    drag.yPct = newY;
    setPlaced((prev) => prev.map((s) => (s.id === sticker.id ? { ...s, xPct: newX, yPct: newY } : s)));
  }

  async function onStickerPointerUp(e: PointerEvent<HTMLDivElement>, sticker: PlacedSticker) {
    const drag = activeDragRef.current;
    if (!drag || drag.id !== sticker.id) return;
    activeDragRef.current = null;
    setMovingId(null);
    const moved = Math.abs(drag.xPct - drag.origXPct) > 0.1 || Math.abs(drag.yPct - drag.origYPct) > 0.1;
    if (!moved) return;
    await fetch("/api/stickers", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: drag.id, xPct: drag.xPct, yPct: drag.yPct, rotation: drag.rotation, scale: drag.scale }),
    });
  }

  // ── resize sticker ───────────
  function startResize(e: PointerEvent<HTMLSpanElement>, sticker: PlacedSticker) {
    e.preventDefault();
    e.stopPropagation();
    e.currentTarget.setPointerCapture(e.pointerId);
    activeResizeRef.current = {
      id: sticker.id,
      startPy: e.clientY, origScale: sticker.scale,
      xPct: sticker.xPct, yPct: sticker.yPct,
      rotation: sticker.rotation, scale: sticker.scale,
    };
  }

  function onResizePointerMove(e: PointerEvent<HTMLSpanElement>, sticker: PlacedSticker) {
    const r = activeResizeRef.current;
    if (!r || r.id !== sticker.id) return;
    const newScale = Math.max(0.3, Math.min(3, r.origScale - (e.clientY - r.startPy) * 0.012));
    r.scale = newScale;
    setPlaced((prev) => prev.map((s) => (s.id === sticker.id ? { ...s, scale: newScale } : s)));
  }

  async function onResizePointerUp(sticker: PlacedSticker) {
    const r = activeResizeRef.current;
    if (!r || r.id !== sticker.id) return;
    activeResizeRef.current = null;
    await fetch("/api/stickers", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: r.id, xPct: r.xPct, yPct: r.yPct, rotation: r.rotation, scale: r.scale }),
    });
  }

  const trayStickers = STICKERS.filter((s) => s.category === (category as StickerCategory));

  return (
    <>
      {/* full-page overlay holding every placed sticker */}
      <div
        ref={layerRef}
        className={`sticker-layer ${dragging ? "droppable" : ""} ${movingId !== null ? "is-moving" : ""}`}
        onDragOver={(e) => { if (dragging) e.preventDefault(); }}
        onDrop={onDrop}
        aria-hidden="true"
      >
        {placed.map((sticker) => {
          const isText = sticker.stickerId === "text";
          const isUpload = sticker.stickerId === "upload";
          const def = (isText || isUpload) ? null : stickerById(sticker.stickerId);
          if (!isText && !isUpload && !def) return null;
          const mine = user?.username === sticker.placedBy;
          const isMovingThis = movingId === sticker.id;

          const pos = layerRef.current ? stickerPosition(sticker, layerRef.current) : null;
          if (!pos) return null;

          return (
            <div
              key={sticker.id}
              className={`placed-sticker ${mine ? "mine" : ""} ${isText ? "is-text" : ""} ${
                isUpload ? "is-upload" : ""
              } ${justLanded === sticker.id ? "landing" : ""} ${isMovingThis ? "is-dragging" : ""}`}
              style={{
                left: pos.left,
                top: pos.top,
                transform: `translate(-50%, -50%) rotate(${sticker.rotation}deg) scale(${sticker.scale})`,
              }}
              data-tip={mine ? "you · drag to move" : sticker.placedBy}
              onPointerDown={mine ? (e) => startMove(e, sticker) : undefined}
              onPointerMove={mine ? (e) => onStickerPointerMove(e, sticker) : undefined}
              onPointerUp={mine ? (e) => onStickerPointerUp(e, sticker) : undefined}
            >
              {isText ? (
                sticker.textFont === "ransom" ? (
                  <span className="sticker-text-ransom">
                    <RansomImageText text={sticker.textContent ?? ""} intro={false} />
                  </span>
                ) : (
                  <span className="sticker-text-pixel">{sticker.textContent}</span>
                )
              ) : isUpload ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={sticker.textContent}
                  alt=""
                  className="sticker-upload-img"
                  draggable={false}
                />
              ) : (
                <span dangerouslySetInnerHTML={{ __html: def!.svg }} />
              )}
              {mine && (
                <>
                  <span
                    className="sticker-x"
                    onPointerDown={(e) => e.stopPropagation()}
                    onClick={() => remove(sticker)}
                    title="remove"
                  >
                    &#x2715;
                  </span>
                  <span
                    className="sticker-resize"
                    onPointerDown={(e) => startResize(e, sticker)}
                    onPointerMove={(e) => onResizePointerMove(e, sticker)}
                    onPointerUp={() => onResizePointerUp(sticker)}
                    title="drag to resize"
                  />
                </>
              )}
            </div>
          );
        })}
      </div>

      {/* FAB + tray */}
      <div className="sticker-fab-zone">
        {user ? (
          <>
            {trayOpen && (
              <div className="sticker-tray" onDragLeave={() => undefined}>
                <div className="tray-tabs">
                  {STICKER_CATEGORIES.map((cat) => (
                    <button
                      key={cat.id}
                      type="button"
                      className={`tray-tab pixel-font ${category === cat.id ? "active" : ""}`}
                      onClick={() => setCategory(cat.id)}
                    >
                      {cat.label}
                    </button>
                  ))}
                  <button
                    type="button"
                    className={`tray-tab pixel-font ${category === "text" ? "active" : ""}`}
                    onClick={() => setCategory("text")}
                  >
                    &#x270F;&#xFE0F; text
                  </button>
                  <button
                    type="button"
                    className={`tray-tab pixel-font ${category === "upload" ? "active" : ""}`}
                    onClick={() => setCategory("upload")}
                  >
                    &#x1F4F7; upload
                  </button>
                </div>

                {category === "text" ? (
                  <div className="tray-text-form">
                    <input
                      className="tray-text-input pixel-font"
                      value={textDraft}
                      onChange={(e) => setTextDraft(e.target.value.slice(0, 30))}
                      placeholder="type a word or phrase&#x2026;"
                      maxLength={30}
                    />
                    <div className="tray-font-choice pixel-font">
                      <label>
                        <input type="radio" name="text-font" value="pixel"
                          checked={textFont === "pixel"} onChange={() => setTextFont("pixel")} />
                        {" "}ff providence
                      </label>
                      <label>
                        <input type="radio" name="text-font" value="ransom"
                          checked={textFont === "ransom"} onChange={() => setTextFont("ransom")} />
                        {" "}scrapbook letters
                      </label>
                    </div>
                    <button type="button" className="primary-button pixel-font"
                      onClick={placeTextSticker} disabled={!textDraft.trim() || placingText}>
                      {placingText ? "placing…" : "place it"}
                    </button>
                    <p className="tray-hint pixel-font">drag to reposition after placing</p>
                  </div>

                ) : category === "upload" ? (
                  <div className="tray-text-form">
                    {uploadPreview ? (
                      <div className="upload-preview-wrap">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={uploadPreview} alt="preview" className="upload-preview-img" />
                        <button
                          type="button"
                          className="link-button pixel-font upload-clear"
                          onClick={() => { setUploadPreview(null); setUploadError(""); }}
                        >
                          &#x2715; clear
                        </button>
                      </div>
                    ) : (
                      <>
                        <button
                          type="button"
                          className="primary-button pixel-font"
                          onClick={() => fileInputRef.current?.click()}
                        >
                          &#x1F4C2; choose image
                        </button>
                        <input
                          ref={fileInputRef}
                          type="file"
                          accept="image/*"
                          className="upload-file-input"
                          onChange={handleFileSelect}
                        />
                        <p className="tray-hint pixel-font">
                          PNG, JPG, GIF, WebP &#x2014; auto-resized to sticker size
                        </p>
                      </>
                    )}
                    {uploadError && <p className="form-error pixel-font">{uploadError}</p>}
                    {uploadPreview && (
                      <button
                        type="button"
                        className="primary-button pixel-font"
                        onClick={placeUploadSticker}
                        disabled={placingUpload}
                      >
                        {placingUpload ? "placing…" : "place it"}
                      </button>
                    )}
                    {uploadPreview && (
                      <p className="tray-hint pixel-font">drag to reposition after placing</p>
                    )}
                  </div>

                ) : (
                  <>
                    <div className="tray-grid">
                      {trayStickers.map((sticker) => (
                        <div
                          key={sticker.id}
                          className="tray-sticker"
                          draggable
                          onDragStart={(e) => onTrayDragStart(e, sticker.id)}
                          onDragEnd={() => setDragging(false)}
                          title={sticker.name}
                          dangerouslySetInnerHTML={{ __html: sticker.svg }}
                        />
                      ))}
                    </div>
                    <p className="tray-hint pixel-font">drag a sticker anywhere on the page</p>
                  </>
                )}
              </div>
            )}
            <button
              type="button"
              className="sticker-fab pixel-font"
              onClick={() => setTrayOpen((open) => !open)}
              aria-expanded={trayOpen}
            >
              &#x1F338; stickers
            </button>
          </>
        ) : (
          <button
            type="button"
            className="sticker-ghost-hint pixel-font"
            onClick={() => {
              const panel = document.getElementById("dedications-panel");
              (panel ?? document.getElementById("dedications"))?.scrollIntoView({
                behavior: "smooth",
                block: "center",
              });
            }}
          >
            sign in to place stickers &#x1F338;
          </button>
        )}
      </div>
    </>
  );
}
