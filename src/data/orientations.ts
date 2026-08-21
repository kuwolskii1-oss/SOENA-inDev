/**
 * The ways a path can lean. SOENA never ranks these; the door is the same
 * width for all of them. Each orientation carries a short essence line the
 * companion uses when framing an avenue for that person.
 */
export interface Orientation {
  id: string;
  label: string;
  essence: string;
}

export const ORIENTATIONS: Orientation[] = [
  {
    id: 'theistic',
    label: 'Theistic',
    essence: 'walking with the Divine — God, gods, the sacred addressed as a Someone',
  },
  {
    id: 'nontheistic',
    label: 'Non-theistic / Atheistic',
    essence: 'a path without gods — wonder, ethics and depth grounded in this world',
  },
  {
    id: 'philosophical',
    label: 'Philosophical',
    essence: 'the examined life — questions held carefully, answers earned slowly',
  },
  {
    id: 'psychological',
    label: 'Psychological',
    essence: 'inner work — the mind met honestly, patterns seen and slowly loosened',
  },
  {
    id: 'emotional',
    label: 'Emotional / Somatic',
    essence: 'the felt path — grief, joy and the body as the site of the sacred',
  },
  {
    id: 'earth',
    label: 'Nature & Earth-based',
    essence: 'kinship with the living world — seasons, ancestors, land and sky',
  },
  {
    id: 'interspiritual',
    label: 'Interspiritual / Blended',
    essence: 'drawing water from more than one well, with respect for each',
  },
  {
    id: 'seeking',
    label: 'Still finding out',
    essence: 'the honest place before names — curiosity is already a practice',
  },
];

export function orientationById(id: string): Orientation {
  return ORIENTATIONS.find((o) => o.id === id) ?? ORIENTATIONS[7];
}
