/**
 * Palettes — the site's colour worlds.
 *
 * A palette is pure CSS: every token lives in `[data-palette='…']`
 * blocks in main.css AND in each page's critical CSS, so switching is a
 * single attribute write on <html> and the first painted frame of the
 * next page load is already in-palette (the inline boot script restores
 * it before paint, exactly like the theme).
 *
 * This module only names them, persists the choice, and offers swatches
 * for the Developer options picker — it never writes colour itself.
 */
export interface Palette {
  id: string;
  label: string;
  note: string;
  /** Swatches for the picker chip, in display order. */
  swatches: string[];
}

const KEY = 'soena.palette.v1';
const FROST_KEY = 'soena.frost.v1';

export const PALETTES: Palette[] = [
  {
    id: 'garden',
    label: 'Garden',
    note: 'Greens carry it — off-white ground, forest ink. Lime is the accent.',
    swatches: ['#fbfff9', '#adf5bc', '#377b42', '#196966', '#04231c', '#c7f454'],
  },
  {
    id: 'tide',
    label: 'Tide',
    note: 'Deep water carries it — teal and navy. Gold is the accent.',
    swatches: ['#e9f1ef', '#66ac91', '#19827c', '#086d6d', '#011f27', '#f6d285'],
  },
];

export function currentPalette(): string {
  return document.documentElement.dataset.palette || 'garden';
}

/** Apply a palette immediately and remember it for the next visit. */
export function applyPalette(id: string): void {
  const known = PALETTES.some((p) => p.id === id) ? id : 'garden';
  const html = document.documentElement;
  // Reuse the theme flip's transition so every surface moves together.
  html.classList.add('theme-shift');
  if (known === 'garden') delete html.dataset.palette;
  else html.dataset.palette = known;
  window.setTimeout(() => html.classList.remove('theme-shift'), 700);
  try {
    if (known === 'garden') localStorage.removeItem(KEY);
    else localStorage.setItem(KEY, known);
  } catch {
    /* private mode: the choice just won't survive the session */
  }
}

/* ------------------------------------------------------------------ */
/* Frosting — how opaque the glass panes over the canopy are.          */
/* ------------------------------------------------------------------ */

export interface FrostLevel {
  id: string; // '1'..'5', stored and written to html[data-frost]
  label: string;
}

/** Five steps of glass, clear to near-opaque. Level 3 is the default
 *  and matches the site's tuned look; the blur/wash each level maps to
 *  lives entirely in CSS (html[data-frost] blocks). */
export const FROST_LEVELS: FrostLevel[] = [
  { id: '1', label: 'Clear' },
  { id: '2', label: 'Sheer' },
  { id: '3', label: 'Frosted' },
  { id: '4', label: 'Misted' },
  { id: '5', label: 'Veiled' },
];

export function currentFrost(): string {
  return document.documentElement.dataset.frost || '3';
}

/** Apply a frost level immediately and remember it for the next visit. */
export function applyFrost(id: string): void {
  const known = FROST_LEVELS.some((l) => l.id === id) ? id : '3';
  document.documentElement.dataset.frost = known;
  try {
    if (known === '3') localStorage.removeItem(FROST_KEY);
    else localStorage.setItem(FROST_KEY, known);
  } catch {
    /* private mode: the choice just won't survive the session */
  }
}
