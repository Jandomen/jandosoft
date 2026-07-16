"use client";

import React, { useState, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, ChevronLeft, ChevronRight } from "lucide-react";

interface GalleryItem {
  id: number;
  imageUrl?: string;
  url?: string;
  title?: string;
  desc?: string;
  alt?: string;
  altText?: string;
  category?: string;
  featured?: boolean;
  date?: string;
}

interface Props {
  items: GalleryItem[];
  sectionLabel: string;
  primary: string;
}

export default function GallerySection({ items, sectionLabel, primary }: Props) {
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  const openLightbox = (index: number) => setLightboxIndex(index);
  const closeLightbox = () => setLightboxIndex(null);

  const goNext = useCallback(() => {
    if (lightboxIndex === null) return;
    setLightboxIndex((lightboxIndex + 1) % items.length);
  }, [lightboxIndex, items.length]);

  const goPrev = useCallback(() => {
    if (lightboxIndex === null) return;
    setLightboxIndex((lightboxIndex - 1 + items.length) % items.length);
  }, [lightboxIndex, items.length]);

  useEffect(() => {
    if (lightboxIndex === null) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeLightbox();
      if (e.key === "ArrowRight") goNext();
      if (e.key === "ArrowLeft") goPrev();
    };
    document.addEventListener("keydown", handler);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handler);
      document.body.style.overflow = "";
    };
  }, [lightboxIndex, goNext, goPrev]);

  const src = (item: GalleryItem) => item.imageUrl || item.url || "";
  const altText = (item: GalleryItem) => item.alt || item.altText || item.title || "";

  const current = lightboxIndex !== null ? items[lightboxIndex] : null;

  return (
    <>
      <section className="max-w-6xl mx-auto px-4 sm:px-6 pb-12 md:pb-20">
        <div className="flex flex-col items-center mb-10 md:mb-14">
          <span
            className="inline-block px-4 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-widest text-white mb-4"
            style={{ background: primary }}
          >
            {sectionLabel}
          </span>
          <h2 className="text-2xl md:text-4xl font-black text-zinc-900 dark:text-white text-center tracking-tight">
            {sectionLabel}
          </h2>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4">
          {items.slice(0, 8).map((item: GalleryItem, i: number) => (
            <button
              key={item.id}
              onClick={() => openLightbox(i)}
              className="group relative aspect-square rounded-xl overflow-hidden bg-zinc-100 dark:bg-zinc-800 shadow-sm hover:shadow-md transition-all cursor-pointer"
            >
              <img
                src={src(item)}
                alt={altText(item)}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                loading="lazy"
              />
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
            </button>
          ))}
        </div>
      </section>

      <AnimatePresence>
        {lightboxIndex !== null && current && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-[9999] flex items-center justify-center"
            onClick={closeLightbox}
          >
            <div className="absolute inset-0 bg-black/90 backdrop-blur-sm" />

            <button
              onClick={(e) => { e.stopPropagation(); closeLightbox(); }}
              className="absolute top-4 right-4 z-10 w-10 h-10 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 text-white transition-all"
            >
              <X className="w-5 h-5" />
            </button>

            {items.length > 1 && (
              <>
                <button
                  onClick={(e) => { e.stopPropagation(); goPrev(); }}
                  className="absolute left-2 sm:left-6 z-10 w-10 h-10 sm:w-12 sm:h-12 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 text-white transition-all"
                >
                  <ChevronLeft className="w-5 h-5 sm:w-6 sm:h-6" />
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); goNext(); }}
                  className="absolute right-2 sm:right-6 z-10 w-10 h-10 sm:w-12 sm:h-12 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 text-white transition-all"
                >
                  <ChevronRight className="w-5 h-5 sm:w-6 sm:h-6" />
                </button>
              </>
            )}

            <motion.div
              key={lightboxIndex}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.2 }}
              className="relative z-10 flex items-center justify-center w-full h-full p-4 sm:p-10 md:p-16"
              onClick={(e) => e.stopPropagation()}
            >
              <img
                src={src(current)}
                alt={altText(current)}
                className="max-w-full max-h-full object-contain rounded-lg shadow-2xl select-none"
                draggable={false}
              />
            </motion.div>

            {items.length > 1 && (
              <div className="absolute bottom-4 z-10 flex items-center gap-2">
                {items.map((_, i) => (
                  <button
                    key={i}
                    onClick={(e) => { e.stopPropagation(); setLightboxIndex(i); }}
                    className={`w-2 h-2 rounded-full transition-all ${
                      i === lightboxIndex ? "bg-white scale-125" : "bg-white/40 hover:bg-white/60"
                    }`}
                  />
                ))}
              </div>
            )}

            {items.length > 1 && (
              <div className="absolute top-4 left-4 z-10 text-white/70 text-sm font-medium">
                {lightboxIndex + 1} / {items.length}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
