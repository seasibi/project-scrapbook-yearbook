"use client";

import { useCallback, useEffect, useRef, useState, type DragEvent } from "react";
import { useAuth } from "@/components/AuthContext";
import {
  STICKERS,
  STICKER_CATEGORIES,
  stickerById,
  type PlacedSticker,
  type StickerCategory,
} from "@/types";

const POLL_INTERVAL = 15_000;

export default function StickerLayer() {
  const { user } = useAuth();
  const [placed, setPlaced] = useState<PlacedSticker[]>([]);
  const [trayOpen, setTrayOpen] = useState(false);
  const [category, setCategory] = useState<StickerCategory>("floral");
  const [dragging, setDragging] = useState(false);
  const [justLanded, setJustLanded] = useState<number | null>(null);
  const layerRef = useRef<HTMLDivElement>(null);

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/stickers");
      const data = await res.json();
      setPlaced(data.stickers ?? []);
    } catch {
      // keep showing the stickers we already have
    }
  }, []);

  useEffect(() => {
    // initial load deferred to a task so the effect body stays sync-free
    const t = window.setTimeout(load, 0);
    const timer = setInterval(load, POLL_INTERVAL);
    return () => {
      window.clearTimeout(t);
      clearInterval(timer);
    };
  }, [load]);

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

    const rect = layerRef.current.getBoundingClientRect();
    const xPct = ((e.clientX - rect.left) / rect.width) * 100;
    const yPct = ((e.clientY - rect.top) / rect.height) * 100;
    const rotation = Math.round((Math.random() * 28 - 14) * 10) / 10;
    const scale = Math.round((0.85 + Math.random() * 0.4) * 100) / 100;

    try {
      const res = await fetch("/api/stickers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ stickerId, xPct, yPct, rotation, scale, section: "page" }),
      });
      const data = await res.json();
      if (res.ok && data.sticker) {
        setPlaced((prev) => [...prev, data.sticker]);
        setJustLanded(data.sticker.id);
        setTimeout(() => setJustLanded(null), 600);
      }
    } catch {
      // drop silently failed; the next poll will reconcile
    }
  }

  async function remove(sticker: PlacedSticker) {
    if (!user || sticker.placedBy !== user.username) return;
    setPlaced((prev) => prev.filter((s) => s.id !== sticker.id));
    await fetch(`/api/stickers?id=${sticker.id}`, { method: "DELETE" });
  }

  const trayStickers = STICKERS.filter((s) => s.category === category);

  return (
    <>
      {/* full-page overlay holding every placed sticker */}
      <div
        ref={layerRef}
        className={`sticker-layer ${dragging ? "droppable" : ""}`}
        onDragOver={(e) => {
          if (dragging) e.preventDefault();
        }}
        onDrop={onDrop}
        aria-hidden="true"
      >
        {placed.map((sticker) => {
          const def = stickerById(sticker.stickerId);
          if (!def) return null;
          const mine = user?.username === sticker.placedBy;
          return (
            <div
              key={sticker.id}
              className={`placed-sticker ${mine ? "mine" : ""} ${
                justLanded === sticker.id ? "landing" : ""
              }`}
              style={{
                left: `${sticker.xPct}%`,
                top: `${sticker.yPct}%`,
                transform: `translate(-50%, -50%) rotate(${sticker.rotation}deg) scale(${sticker.scale})`,
              }}
              title={mine ? "double-click to remove" : `placed by ${sticker.placedBy}`}
              onDoubleClick={() => remove(sticker)}
              dangerouslySetInnerHTML={{
                __html: mine
                  ? `${def.svg}<span class="sticker-x">✕</span>`
                  : def.svg,
              }}
            />
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
                </div>
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
              </div>
            )}
            <button
              type="button"
              className="sticker-fab pixel-font"
              onClick={() => setTrayOpen((open) => !open)}
              aria-expanded={trayOpen}
            >
              🌸 stickers
            </button>
          </>
        ) : (
          <span className="sticker-ghost-hint pixel-font">
            sign in to place stickers 🌸
          </span>
        )}
      </div>
    </>
  );
}
