/**
 * A very small typed event bus. One shared instance wires the app together
 * so modules never import each other directly — the same decoupling that
 * agency-grade sites (Locomotive's modular architecture) use to keep the
 * scroll loop, the WebGL layer and the UI independent.
 */
export type AppEvents = {
  /** Active avenue changed (scroll or nav). */
  'avenue:enter': { id: string };
  /** Continuous scroll progress 0..1 across the whole page. */
  'scroll:progress': { progress: number; velocity: number };
  /** The companion should say something (caption + optional voice). */
  'soena:say': { text: string; mood?: string };
  /** Companion mood/state changed. */
  'soena:mood': { mood: string };
  /** Speech synthesis produced a word boundary (drives visual pulses). */
  'soena:pulse': { strength: number };
  /** Profile was created, updated or erased. */
  'profile:change': Record<string, never>;
  /** Pointer moved, normalized -1..1. */
  'pointer:move': { x: number; y: number };
};

type Handler<T> = (payload: T) => void;

const handlers = new Map<string, Set<Handler<never>>>();

export function on<K extends keyof AppEvents>(event: K, fn: Handler<AppEvents[K]>): () => void {
  let set = handlers.get(event);
  if (!set) {
    set = new Set();
    handlers.set(event, set);
  }
  set.add(fn as Handler<never>);
  return () => set!.delete(fn as Handler<never>);
}

export function emit<K extends keyof AppEvents>(event: K, payload: AppEvents[K]): void {
  const set = handlers.get(event);
  if (!set) return;
  for (const fn of set) (fn as Handler<AppEvents[K]>)(payload);
}
