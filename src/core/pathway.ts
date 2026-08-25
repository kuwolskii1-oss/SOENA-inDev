/**
 * Pathway + journey state — everything lives on the device.
 *
 * Three small stores:
 *   · the pathway answers (the six layers, per path) — so SOENA can
 *     greet the person already knowing their stage, pressures, feelings
 *     and goal instead of making them retell their story;
 *   · the journey progress — which program, which days are done, the
 *     in-app reflections; days unlock sequentially and survive closing
 *     the app;
 *   · a one-shot chat handoff — the tailored greeting the next chat
 *     opening should begin with (context continuity).
 */

export interface PathwayAnswers {
  version: 1;
  at: number;
  pathId: string;
  stage: string;
  specific: string;
  feeling: string;
  impact: string[];
  support: string;
  goal: string;
  /** True when an urgent option (unsafe / still paying) was chosen. */
  urgent: boolean;
}

export interface JourneyState {
  version: 1;
  journeyId: string;
  pathId?: string;
  startedAt: number;
  /** Day indexes (0-based) marked done, in completion order. */
  done: number[];
  /** In-app reflections, keyed by day index. */
  reflections: Record<number, string>;
}

const PATHWAY_KEY = 'soena.pathway.v1';
const JOURNEY_KEY = 'soena.journey.v1';
const HANDOFF_KEY = 'soena.handoff.v1';

/* ------------------------------------------------------------------ */
/* Pathway answers                                                     */
/* ------------------------------------------------------------------ */

export function savePathway(a: Omit<PathwayAnswers, 'version' | 'at'>): PathwayAnswers {
  const full: PathwayAnswers = { version: 1, at: Date.now(), ...a };
  try {
    localStorage.setItem(PATHWAY_KEY, JSON.stringify(full));
  } catch {
    /* private mode */
  }
  return full;
}

export function loadPathway(): PathwayAnswers | null {
  try {
    const raw = localStorage.getItem(PATHWAY_KEY);
    if (!raw) return null;
    const p = JSON.parse(raw) as PathwayAnswers;
    return p && p.version === 1 ? p : null;
  } catch {
    return null;
  }
}

export function clearPathway(): void {
  try {
    localStorage.removeItem(PATHWAY_KEY);
  } catch {
    /* private mode */
  }
}

/* ------------------------------------------------------------------ */
/* Journey progress                                                    */
/* ------------------------------------------------------------------ */

export function startJourney(journeyId: string, pathId?: string): JourneyState {
  const existing = loadJourney();
  // Re-choosing the same journey resumes it; a different one restarts.
  if (existing && existing.journeyId === journeyId) return existing;
  const state: JourneyState = { version: 1, journeyId, pathId, startedAt: Date.now(), done: [], reflections: {} };
  persistJourney(state);
  return state;
}

export function loadJourney(): JourneyState | null {
  try {
    const raw = localStorage.getItem(JOURNEY_KEY);
    if (!raw) return null;
    const j = JSON.parse(raw) as JourneyState;
    return j && j.version === 1 ? j : null;
  } catch {
    return null;
  }
}

function persistJourney(j: JourneyState): void {
  try {
    localStorage.setItem(JOURNEY_KEY, JSON.stringify(j));
  } catch {
    /* private mode */
  }
}

/** A day is open when every earlier day is done — sequential unlock. */
export function dayUnlocked(j: JourneyState, day: number): boolean {
  for (let i = 0; i < day; i += 1) if (!j.done.includes(i)) return false;
  return true;
}

/** The first not-yet-done day, or null when the program is complete. */
export function nextDay(j: JourneyState): number | null {
  for (let i = 0; i < 7; i += 1) if (!j.done.includes(i)) return i;
  return null;
}

export function completeDay(day: number): JourneyState | null {
  const j = loadJourney();
  if (!j || !dayUnlocked(j, day)) return j;
  if (!j.done.includes(day)) j.done.push(day);
  persistJourney(j);
  return j;
}

export function saveReflection(day: number, text: string): void {
  const j = loadJourney();
  if (!j) return;
  if (text.trim()) j.reflections[day] = text.trim();
  else delete j.reflections[day];
  persistJourney(j);
}

export function leaveJourney(): void {
  try {
    localStorage.removeItem(JOURNEY_KEY);
  } catch {
    /* private mode */
  }
}

/* ------------------------------------------------------------------ */
/* Chat handoff — context continuity                                   */
/* ------------------------------------------------------------------ */

/** Queue the greeting the next chat opening should begin with. */
export function setHandoff(greeting: string): void {
  try {
    sessionStorage.setItem(HANDOFF_KEY, greeting);
  } catch {
    /* private mode */
  }
}

/** Read AND consume the queued greeting (one-shot). */
export function takeHandoff(): string | null {
  try {
    const g = sessionStorage.getItem(HANDOFF_KEY);
    if (g) sessionStorage.removeItem(HANDOFF_KEY);
    return g;
  } catch {
    return null;
  }
}

/** Wipe everything this module stores (memory panel's Erase). */
export function erasePathwayMemory(): void {
  clearPathway();
  leaveJourney();
  try {
    sessionStorage.removeItem(HANDOFF_KEY);
  } catch {
    /* private mode */
  }
}
