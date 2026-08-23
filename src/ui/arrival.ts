/**
 * The arrival — SOENA's door held closed for one breath, then lifted.
 *
 * Why smooth sites open behind a veil at all:
 *   · Fonts and layout need a moment. Revealing before the typeface has
 *     arrived means visible font-swap and text reflow on the very first
 *     thing a visitor reads. The veil waits for document.fonts.ready, so
 *     the first frame anyone sees is already settled — no flash of
 *     fallback type, no layout shift, no elements popping in one by one.
 *   · An entrance can only be choreographed from a known moment. Because
 *     the reveal happens at a time we control, the brand, header, line and
 *     chips can rise in a deliberate stagger instead of appearing whenever
 *     the network happens to deliver them.
 *   · A branded, animated wait reads as intention; a blank white page
 *     reads as breakage. Perceived performance is part of performance.
 *
 * Discipline, so the veil never becomes the slow thing it exists to hide:
 *   · It never waits on the 3D companion — that arrives lazily by design.
 *   · Hard cap: the door always opens within ~3 seconds, fonts or not.
 *   · The veil only exists when JS runs (the inline boot script gates it),
 *     so a scriptless visitor is never left staring at a closed door, and
 *     an inline failsafe lifts it even if this module never loads.
 *   · Reduced motion collapses the whole ceremony to a brief quiet fade.
 */

export type ArrivalMode = 'full' | 'brief';

export function beginArrival(mode: ArrivalMode = 'full'): Promise<void> {
  const html = document.documentElement;
  const veil = document.getElementById('arrival');

  // The module made it: the inline 4s failsafe is no longer needed.
  const w = window as unknown as { __soenaArrival?: number };
  if (w.__soenaArrival) window.clearTimeout(w.__soenaArrival);

  if (!veil || !html.classList.contains('has-arrival') || html.classList.contains('arrival-done')) {
    html.classList.add('arrival-done');
    return Promise.resolve();
  }

  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const wait = (ms: number) => new Promise<void>((r) => window.setTimeout(r, ms));
  const fontsReady: Promise<void> =
    'fonts' in document ? document.fonts.ready.then(() => undefined) : Promise.resolve();

  // Light the wordmark only when its type is truly loaded, so the letters
  // never rise in a fallback face and swap mid-air. If fonts dawdle past
  // the cap, light it anyway — the door must open.
  let lit: Promise<void>;
  if (mode === 'brief' || reduced) {
    requestAnimationFrame(() => veil.classList.add('is-lit'));
    lit = Promise.resolve();
  } else {
    lit = Promise.race([fontsReady, wait(1400)]).then(() => {
      veil.classList.add('is-lit');
      return wait(520); // let the letters land before the lift begins
    });
  }

  const minHold = wait(reduced ? 180 : mode === 'full' ? 1250 : 460);
  const ready = Promise.all([lit, minHold]);

  return Promise.race([ready, wait(3200)]).then(
    () =>
      new Promise<void>((resolve) => {
        // Two frames so the lit state has painted before the lift starts.
        requestAnimationFrame(() =>
          requestAnimationFrame(() => {
            html.classList.add('arrival-done');
            window.setTimeout(() => veil.remove(), reduced ? 400 : 950);
            // Resolve as the lift begins: callers' own small delays then
            // land right as the door finishes opening.
            resolve();
          }),
        );
      }),
  );
}
