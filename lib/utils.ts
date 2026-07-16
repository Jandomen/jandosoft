import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

let audioCtx: AudioContext | null = null;
function getAudioCtx() {
  if (!audioCtx) audioCtx = new AudioContext();
  if (audioCtx.state === "suspended") audioCtx.resume();
  return audioCtx;
}

export function isSoundEnabled(): boolean {
  if (typeof window === "undefined") return true;
  return localStorage.getItem("jandosoft_sound") !== "off";
}

export function setSoundEnabled(enabled: boolean) {
  if (typeof window === "undefined") return;
  localStorage.setItem("jandosoft_sound", enabled ? "on" : "off");
}

export function playNotificationSound(type: "success" | "error" | "info" = "info") {
  if (!isSoundEnabled()) return;
  try {
    const ctx = getAudioCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);

    if (type === "success") {
      osc.frequency.setValueAtTime(880, ctx.currentTime);
      osc.frequency.setValueAtTime(1100, ctx.currentTime + 0.08);
      gain.gain.setValueAtTime(0.15, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.25);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.25);
    } else if (type === "error") {
      osc.type = "square";
      osc.frequency.setValueAtTime(300, ctx.currentTime);
      osc.frequency.setValueAtTime(200, ctx.currentTime + 0.12);
      gain.gain.setValueAtTime(0.1, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.3);
    } else {
      osc.frequency.setValueAtTime(660, ctx.currentTime);
      gain.gain.setValueAtTime(0.12, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.2);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.2);
    }
  } catch {}
}

export interface IKbEntry {
  id?: number | string;
  title?: string;
  question?: string;
  content: string;
  category?: string;
}

export function searchKnowledgeBase(query: string, entries: IKbEntry[], limit = 5): IKbEntry[] {
  if (!entries || entries.length === 0) return [];
  if (entries.length <= limit) return entries;

  const cleanWords = query
    .toLowerCase()
    .replace(/[^\w\s]/g, "")
    .split(/\s+/)
    .filter(w => w.length > 2);

  if (cleanWords.length === 0) {
    return entries.slice(0, limit);
  }

  const scored = entries.map(entry => {
    let score = 0;
    const title = (entry.title || "").toLowerCase();
    const question = (entry.question || "").toLowerCase();
    const content = (entry.content || "").toLowerCase();
    const category = (entry.category || "").toLowerCase();

    for (const word of cleanWords) {
      if (question.includes(word)) score += 5;
      if (title.includes(word)) score += 3;
      if (category.includes(word)) score += 2;
      if (content.includes(word)) score += 1;
    }
    return { entry, score };
  });

  const matches = scored
    .filter(s => s.score > 0)
    .sort((a, b) => b.score - a.score)
    .map(s => s.entry);

  if (matches.length === 0) {
    return entries.slice(0, limit);
  }

  return matches.slice(0, limit);
}

