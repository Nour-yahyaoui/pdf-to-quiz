import { useSyncExternalStore } from "react";
import type { Difficulty } from "@/lib/types";

/**
 * No-account history: quiz ids created in THIS browser live in localStorage.
 * Implemented as an external store so components subscribe with
 * useSyncExternalStore (no setState-in-effect).
 */

const STORAGE_KEY = "pdf2quiz:history:v1";
const CHANGE_EVENT = "pdf2quiz:history-changed";
const MAX_ENTRIES = 50;

export interface HistoryEntry {
  id: string;
  pdf_name: string;
  difficulty: Difficulty | null;
  createdAt: string;
  latestScore: number | null;
  latestTotal: number | null;
}

let cache: HistoryEntry[] | null = null;

function parseStorage(): HistoryEntry[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (item): item is HistoryEntry =>
        typeof item === "object" &&
        item !== null &&
        typeof (item as HistoryEntry).id === "string",
    );
  } catch {
    return [];
  }
}

function getSnapshot(): HistoryEntry[] {
  if (cache === null) cache = parseStorage();
  return cache;
}

function getServerSnapshot(): HistoryEntry[] {
  return [];
}

function subscribe(callback: () => void): () => void {
  if (typeof window === "undefined") return () => {};
  window.addEventListener(CHANGE_EVENT, callback);
  window.addEventListener("storage", callback);
  return () => {
    window.removeEventListener(CHANGE_EVENT, callback);
    window.removeEventListener("storage", callback);
  };
}

/** React hook: reactive view of this browser's quiz history. */
export function useQuizHistory(): HistoryEntry[] {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}

function persist(entries: HistoryEntry[]): void {
  cache = entries.slice(0, MAX_ENTRIES);
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(cache));
  } catch {
    // Storage full or blocked — non-fatal, the quiz itself still works.
  }
  window.dispatchEvent(new Event(CHANGE_EVENT));
}

export function addQuizToHistory(
  entry: Omit<HistoryEntry, "latestScore" | "latestTotal">,
): void {
  const entries = getSnapshot().filter((item) => item.id !== entry.id);
  persist([{ ...entry, latestScore: null, latestTotal: null }, ...entries]);
}

export function recordAttempt(
  quizId: string,
  score: number,
  total: number,
  fallback?: Pick<HistoryEntry, "pdf_name" | "difficulty">,
): void {
  const entries = getSnapshot();
  const existing = entries.find((item) => item.id === quizId);

  if (existing) {
    persist(
      entries.map((item) =>
        item.id === quizId
          ? { ...item, latestScore: score, latestTotal: total }
          : item,
      ),
    );
    return;
  }

  // Reached via a shared link without local history — create the entry.
  persist([
    {
      id: quizId,
      pdf_name: fallback?.pdf_name ?? "Shared quiz",
      difficulty: fallback?.difficulty ?? null,
      createdAt: new Date().toISOString(),
      latestScore: score,
      latestTotal: total,
    },
    ...entries,
  ]);
}
