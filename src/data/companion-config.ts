/**
 * Which body SOENA wears.
 *
 * The tide-glass pair are 2D layered sprites cut from the supplied
 * references (fusion matte: local gradient key for crisp edges and glow,
 * gated by the ML silhouette; the plinth kept by a darker-than-background
 * classifier). Two layers each — body and a feathered head — so the head
 * can nod with the visitor's cursor while the figure keeps its seat on
 * the page's bottom-left corner. If a sprite fails to load, the
 * procedural light-orb takes over: the page never breaks over a body.
 */
export type CompanionFormId = 'orb' | 'she' | 'he';

export interface FigureHead {
  /** Head-layer box, as fractions of the body sprite's box. */
  x: number;
  y: number;
  w: number;
  h: number;
  /** Neck pivot the head rotates around, as fractions of the sprite box. */
  pivotX: number;
  pivotY: number;
}

export interface CompanionForm {
  id: CompanionFormId;
  label: string;
  /** Body sprite under the site root (present on figure forms only). */
  sprite?: string;
  /** Feathered head layer that rotates over the body. */
  headSprite?: string;
  head?: FigureHead;
  /** Natural sprite aspect (width / height), for layout before decode. */
  aspect?: number;
}

export const COMPANION_FORMS: CompanionForm[] = [
  {
    id: 'she',
    label: 'her — the tide-glass listener',
    sprite: './figures/soena-she.webp',
    headSprite: './figures/soena-she-head.webp',
    // Sprite 860x857; head crop 207x201 at 206,0; neck pivot ~(330,178).
    head: { x: 206 / 860, y: 0, w: 207 / 860, h: 201 / 857, pivotX: 330 / 860, pivotY: 178 / 857 },
    aspect: 860 / 857,
  },
  {
    id: 'he',
    label: 'him — the tide-glass listener',
    sprite: './figures/soena-he.webp',
    headSprite: './figures/soena-he-head.webp',
    // Sprite 517x811; head crop 211x203 at 16,0; neck pivot ~(140,175).
    head: { x: 16 / 517, y: 0, w: 211 / 517, h: 203 / 811, pivotX: 140 / 517, pivotY: 175 / 811 },
    aspect: 517 / 811,
  },
  { id: 'orb', label: 'a living light' },
];

/** Unknown or retired form ids resolve to her — the door's face. */
export function formById(id: string | undefined): CompanionForm {
  return COMPANION_FORMS.find((f) => f.id === id) ?? COMPANION_FORMS[0];
}
