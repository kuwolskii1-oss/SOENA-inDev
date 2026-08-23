/**
 * Smooth scroll and section awareness.
 *
 * Lenis is the engine behind locomotive-scroll v5 — it re-times native
 * scrolling on a rAF with lerp easing, moving content with transforms so
 * the browser never re-lays-out mid-frame. We run ONE rAF loop for the
 * whole app (scroll + WebGL share it via the bus) — multiple competing
 * loops are the classic jank source on animated sites.
 *
 * Section entry is detected with IntersectionObserver instead of measuring
 * scroll offsets every frame: no layout reads in the hot path.
 */
import Lenis from 'lenis';
import { emit } from './bus';
import { rememberAvenue } from './profile';

let lenis: Lenis | null = null;
let rafHandlers: Array<(t: number, dt: number) => void> = [];
let running = false;
let lastT = 0;

/** Register a per-frame callback; returns its unsubscriber. */
export function onFrame(fn: (t: number, dt: number) => void): () => void {
  rafHandlers.push(fn);
  return () => {
    rafHandlers = rafHandlers.filter((f) => f !== fn);
  };
}

function loop(time: number): void {
  if (!running) return;
  const dt = lastT ? Math.min((time - lastT) / 1000, 0.1) : 0.016;
  lastT = time;
  lenis?.raf(time);
  for (const fn of rafHandlers) fn(time / 1000, dt);
  requestAnimationFrame(loop);
}

export function startScroll(reducedMotion: boolean): void {
  if (!reducedMotion) {
    lenis = new Lenis({ lerp: 0.09, wheelMultiplier: 1, smoothWheel: true, anchors: true });
    lenis.on('scroll', ({ progress, velocity }: { progress: number; velocity: number }) => {
      emit('scroll:progress', { progress, velocity });
    });
  } else {
    // Honour reduced motion: native scrolling, but keep progress events
    // (cheap, passive) so the page still knows where it is.
    let scheduled = false;
    window.addEventListener(
      'scroll',
      () => {
        if (scheduled) return;
        scheduled = true;
        requestAnimationFrame(() => {
          scheduled = false;
          const max = document.documentElement.scrollHeight - window.innerHeight;
          emit('scroll:progress', { progress: max > 0 ? window.scrollY / max : 0, velocity: 0 });
        });
      },
      { passive: true },
    );
  }

  running = true;
  requestAnimationFrame(loop);

  // Save battery: halt the shared loop entirely when the tab is hidden.
  document.addEventListener('visibilitychange', () => {
    const visible = document.visibilityState === 'visible';
    if (visible && !running) {
      running = true;
      lastT = 0;
      requestAnimationFrame(loop);
    } else if (!visible) {
      running = false;
    }
  });
}

/** The avenue most recently scrolled into view, for late-arriving code. */
let current = 'threshold';
export function currentAvenue(): string {
  return current;
}

export function observeSections(): void {
  const sections = document.querySelectorAll<HTMLElement>('[data-avenue]');
  const io = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting) {
          const id = (entry.target as HTMLElement).dataset.avenue!;
          current = id;
          emit('avenue:enter', { id });
          if (id !== 'threshold') rememberAvenue(id);
        }
      }
    },
    { rootMargin: '-42% 0px -42% 0px' },
  );
  sections.forEach((s) => io.observe(s));

  // Reveal-on-entry for content blocks, again observer-driven.
  const reveal = new IntersectionObserver(
    (entries) => {
      for (const e of entries) {
        if (e.isIntersecting) {
          e.target.classList.add('is-in');
          reveal.unobserve(e.target);
        }
      }
    },
    { rootMargin: '0px 0px -12% 0px' },
  );
  document.querySelectorAll('.reveal').forEach((el) => reveal.observe(el));
}

export function scrollToSection(id: string): void {
  const el = document.getElementById(id);
  if (!el) return;
  if (lenis) lenis.scrollTo(el, { offset: 0, duration: 1.4 });
  else el.scrollIntoView({ behavior: 'auto' });
}
