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

export const PALETTES: Palette[] = [
  {
    id: 'garden',
    label: 'Garden',
    note: 'Off-white ground, forest ink, living green. The default world.',
    swatches: ['#fbfff9', '#c7f454', '#adf5bc', '#377b42', '#196966', '#04231c'],
  },
  {
    id: 'tide',
    label: 'Tide',
    note: 'Sand and teal — deep water under a warm sky.',
    swatches: ['#f3e594', '#f6d285', '#66ac91', '#19827c', '#086d6d', '#011f27'],
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
