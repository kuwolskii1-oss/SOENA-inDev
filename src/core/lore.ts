/**
 * Lore — the episodic layer of SOENA's memory.
 *
 * Profile (core/profile.ts) holds who you are; lore holds what has
 * happened: things you told SOENA to remember, moments it witnessed
 * (first steps into an avenue, testimonies kept), and conversation
 * threads it can pick back up. Like everything SOENA knows, lore lives
 * only in this browser and is erased with the rest of its memory.
 */
export type LoreKind = 'told' | 'moment' | 'thread';

export interface LoreEntry {
  id: string;
  kind: LoreKind;
  text: string;
  at: number;
  /** Optional topic tags used for recall (e.g. 'grief', 'meaning'). */
  tags: string[];
}

const KEY = 'soena.lore.v1';
const MAX = 200;

let cache: LoreEntry[] | null = null;

export function loadLore(): LoreEntry[] {
  if (cache) return cache;
  try {
    const raw = localStorage.getItem(KEY);
    cache = raw ? (JSON.parse(raw) as LoreEntry[]) : [];
  } catch {
    cache = [];
  }
  return cache;
}

function persist(): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(loadLore().slice(0, MAX)));
  } catch {
    /* private mode: lore lives only for this session */
  }
}

export function addLore(kind: LoreKind, text: string, tags: string[] = []): LoreEntry {
  const entry: LoreEntry = {
    id: Math.random().toString(36).slice(2, 10),
    kind,
    text: text.trim().slice(0, 400),
    at: Date.now(),
    tags,
  };
  const all = loadLore();
  all.unshift(entry);
  persist();
  return entry;
}

/** Record a moment only once (e.g. "first walked the avenue of grief"). */
export function addMomentOnce(markerTag: string, text: string): void {
  const all = loadLore();
  if (all.some((e) => e.tags.includes(markerTag))) return;
  addLore('moment', text, [markerTag]);
}

export function removeLore(id: string): void {
  cache = loadLore().filter((e) => e.id !== id);
  persist();
}

export function clearLore(): void {
  cache = [];
  try {
    localStorage.removeItem(KEY);
  } catch {
    /* nothing to clear */
  }
}

/** Most recent entries the person explicitly asked SOENA to keep. */
export function toldLore(limit = 6): LoreEntry[] {
  return loadLore().filter((e) => e.kind === 'told').slice(0, limit);
}

/** Find lore relevant to a set of topic tags or free text. */
export function recallLore(tags: string[], text = '', limit = 3): LoreEntry[] {
  const words = text
    .toLowerCase()
    .split(/[^a-z0-9']+/)
    .filter((w) => w.length > 3);
  const scored = loadLore()
    .map((e) => {
      let score = 0;
      for (const t of tags) if (e.tags.includes(t)) score += 3;
      const lower = e.text.toLowerCase();
      for (const w of words) if (lower.includes(w)) score += 1;
      // Gentle recency bias
      score += Math.max(0, 1 - (Date.now() - e.at) / (30 * 86400000));
      return { e, score };
    })
    .filter((x) => x.score >= 2)
    .sort((a, b) => b.score - a.score);
  return scored.slice(0, limit).map((x) => x.e);
}

/** The latest open conversation thread, if any. */
export function lastThread(): LoreEntry | null {
  return loadLore().find((e) => e.kind === 'thread') ?? null;
}

export function setThread(text: string, tags: string[]): void {
  // Threads replace each other: only the latest is "open".
  cache = loadLore().filter((e) => e.kind !== 'thread');
  persist();
  addLore('thread', text, tags);
}
