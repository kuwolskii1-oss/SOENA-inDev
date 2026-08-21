/**
 * SOENA's memory.
 *
 * Everything SOENA knows about a person lives here, in the browser's own
 * storage — never on a server. The person can read all of it, change any of
 * it, and erase it entirely. Memory that cannot be inspected or refused is
 * surveillance; memory that can be is companionship.
 */
import { emit } from './bus';

export interface PronounSet {
  /** e.g. "they" */ subject: string;
  /** e.g. "them" */ object: string;
  /** e.g. "their" */ possessive: string;
  /** e.g. "theirs" */ possessiveStandalone: string;
  /** e.g. "themself" */ reflexive: string;
  /** Whether verbs conjugate plurally ("they are" vs "she is"). */
  plural: boolean;
  /** Short display label, e.g. "they/them". */
  label: string;
}

export const PRONOUN_PRESETS: PronounSet[] = [
  { label: 'she/her', subject: 'she', object: 'her', possessive: 'her', possessiveStandalone: 'hers', reflexive: 'herself', plural: false },
  { label: 'he/him', subject: 'he', object: 'him', possessive: 'his', possessiveStandalone: 'his', reflexive: 'himself', plural: false },
  { label: 'they/them', subject: 'they', object: 'them', possessive: 'their', possessiveStandalone: 'theirs', reflexive: 'themself', plural: true },
  { label: 'ze/zir', subject: 'ze', object: 'zir', possessive: 'zir', possessiveStandalone: 'zirs', reflexive: 'zirself', plural: false },
  { label: 'xe/xem', subject: 'xe', object: 'xem', possessive: 'xyr', possessiveStandalone: 'xyrs', reflexive: 'xemself', plural: false },
];

export type Tone = 'gentle' | 'plain' | 'poetic';

export interface Profile {
  version: 1;
  name: string;
  pronouns: PronounSet | null; // null = "just use my name"
  orientation: string; // id from data/orientations, or 'seeking'
  intentions: string[]; // ids from INTENTIONS
  tone: Tone;
  /** Free-form things the person asked SOENA to remember. */
  keepsakes: string[];
  voiceOn: boolean;
  /** Which body SOENA wears: 'orb' | 'she' | 'he'. Older profiles lack it. */
  form?: string;
  createdAt: number;
  lastVisit: number;
  visits: number;
  lastAvenue: string | null;
}

export const INTENTIONS = [
  { id: 'peace', label: 'peace of mind' },
  { id: 'meaning', label: 'meaning & purpose' },
  { id: 'grief', label: 'grief & loss' },
  { id: 'connection', label: 'connection with others' },
  { id: 'awe', label: 'awe & wonder' },
  { id: 'discipline', label: 'practice & discipline' },
  { id: 'forgiveness', label: 'forgiveness — given or received' },
  { id: 'doubt', label: 'honest doubt' },
] as const;

const KEY = 'soena.profile.v1';

let cached: Profile | null | undefined;

export function loadProfile(): Profile | null {
  if (cached !== undefined) return cached;
  try {
    const raw = localStorage.getItem(KEY);
    cached = raw ? (JSON.parse(raw) as Profile) : null;
  } catch {
    cached = null;
  }
  return cached;
}

export function saveProfile(p: Profile): void {
  cached = p;
  try {
    localStorage.setItem(KEY, JSON.stringify(p));
  } catch {
    /* storage may be unavailable (private mode); SOENA simply forgets */
  }
  emit('profile:change', {});
}

export function eraseAllMemory(): void {
  cached = null;
  try {
    // Everything SOENA holds, gone in one gesture: profile, journal,
    // lore, the conversation, and the rapport it had built.
    for (const key of ['soena.profile.v1', 'soena.journal.v1', 'soena.lore.v1', 'soena.chat.v1', 'soena.rapport.v1']) {
      localStorage.removeItem(key);
    }
  } catch {
    /* nothing to erase */
  }
  emit('profile:change', {});
}

export function createProfile(partial: Omit<Profile, 'version' | 'createdAt' | 'lastVisit' | 'visits' | 'lastAvenue'>): Profile {
  const now = Date.now();
  const p: Profile = { version: 1, createdAt: now, lastVisit: now, visits: 1, lastAvenue: null, ...partial };
  saveProfile(p);
  return p;
}

/** Record a returning visit; returns days since the previous one. */
export function touchVisit(): number {
  const p = loadProfile();
  if (!p) return 0;
  const days = Math.floor((Date.now() - p.lastVisit) / 86400000);
  p.visits += 1;
  p.lastVisit = Date.now();
  saveProfile(p);
  return days;
}

export function rememberAvenue(id: string): void {
  const p = loadProfile();
  if (!p) return;
  p.lastAvenue = id;
  saveProfile(p);
}

/* ------------------------------------------------------------------ */
/* Pronoun-aware templating                                            */
/* ------------------------------------------------------------------ */

/**
 * Fill a template with the person's name and pronouns, conjugating verbs.
 *
 * Tokens: {name} {they} {them} {their} {theirs} {themself}
 * Verbs:  {are} -> is/are · {have} -> has/have · {do} -> does/do · {were} -> was/were
 * Capitalized tokens ({They}, {Their}…) capitalize the output.
 * With no pronouns chosen ("just my name"), pronoun tokens fall back to the
 * name and verbs conjugate in the singular.
 */
export function fill(template: string, p?: Profile | null): string {
  const profile = p === undefined ? loadProfile() : p;
  const name = profile?.name?.trim() || 'traveller';
  const pr = profile?.pronouns ?? null;

  const map: Record<string, string> = pr
    ? {
        name,
        they: pr.subject,
        them: pr.object,
        their: pr.possessive,
        theirs: pr.possessiveStandalone,
        themself: pr.reflexive,
        are: pr.plural ? 'are' : 'is',
        have: pr.plural ? 'have' : 'has',
        do: pr.plural ? 'do' : 'does',
        were: pr.plural ? 'were' : 'was',
      }
    : {
        name,
        they: name,
        them: name,
        their: `${name}’s`,
        theirs: `${name}’s`,
        themself: name,
        are: 'is',
        have: 'has',
        do: 'does',
        were: 'was',
      };

  return template.replace(/\{([A-Za-z]+)\}/g, (whole, token: string) => {
    const lower = token.toLowerCase();
    const value = map[lower];
    if (value === undefined) return whole;
    return token[0] === token[0].toUpperCase()
      ? value.charAt(0).toUpperCase() + value.slice(1)
      : value;
  });
}
