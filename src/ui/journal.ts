/**
 * Testimony journal — expressive writing kept entirely in localStorage.
 */
export interface JournalEntry {
  id: string;
  avenue: string;
  text: string;
  at: number;
}

const KEY = 'soena.journal.v1';

export function loadJournal(): JournalEntry[] {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as JournalEntry[]) : [];
  } catch {
    return [];
  }
}

export function addEntry(avenue: string, text: string): JournalEntry {
  const entry: JournalEntry = {
    id: Math.random().toString(36).slice(2, 10),
    avenue,
    text: text.trim(),
    at: Date.now(),
  };
  const all = loadJournal();
  all.unshift(entry);
  try {
    localStorage.setItem(KEY, JSON.stringify(all.slice(0, 500)));
  } catch {
    /* storage full or unavailable — entry lives only for this session */
  }
  return entry;
}

export function deleteEntry(id: string): void {
  const all = loadJournal().filter((e) => e.id !== id);
  try {
    localStorage.setItem(KEY, JSON.stringify(all));
  } catch {
    /* ignore */
  }
}

export function formatDate(ts: number): string {
  return new Date(ts).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}
