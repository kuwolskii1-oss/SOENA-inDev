/**
 * The companion's presence director.
 *
 * Decides which body SOENA wears — the tide-glass figures (2D layered
 * sprites, no WebGL, no network beyond two small webp files) or the
 * procedural light-orb — wires it to the app bus, and owns the pointing
 * gesture. The figures hold ONE post: the page's exact bottom-left
 * corner, on every page; pages choose only their size, avenues only
 * their colour.
 *
 * Loading discipline is unchanged from the orb days: the page is fully
 * usable before any presence arrives, and every failure path lands back
 * on the CSS aura.
 */
import { on } from '../core/bus';
import type { Quality } from '../core/quality';
import { loadProfile } from '../core/profile';
import { avenueById } from '../data/avenues';
import { formById } from '../data/companion-config';
import type { SoenaScene } from './scene';
import type { FigurePresence } from './figure';

let orb: SoenaScene | null = null;
let figure: FigurePresence | null = null;
let currentQuality: Quality | null = null;
let activeFormId = 'orb';

/** Everything wire() registers, so teardown can actually unregister it —
 *  otherwise every form swap would stack duplicate handlers and the
 *  shared rAF would run each body's physics N times per frame. */
let unwire: Array<() => void> = [];

/** Mount generation: a swap that starts while an earlier mount is still
 *  awaiting its sprite/chunk invalidates that older mount entirely. */
let mountSeq = 0;

export function initPresence(quality: Quality): void {
  currentQuality = quality;

  const mount = () => void mountPresence(quality);
  if ('requestIdleCallback' in window) {
    window.requestIdleCallback(mount, { timeout: 2500 });
  } else {
    setTimeout(mount, 600);
  }

  // Changing form in the memory panel swaps the body in place.
  on('profile:change', () => {
    const wanted = formById(loadProfile()?.form).id;
    if (wanted !== activeFormId && currentQuality) {
      teardown();
      void mountPresence(currentQuality);
    }
  });
}

function teardown(): void {
  for (const off of unwire) off();
  unwire = [];
  orb?.dispose();
  figure?.dispose();
  orb = null;
  figure = null;
  document.getElementById('gl')?.classList.remove('is-live');
}

async function mountPresence(quality: Quality): Promise<void> {
  const seq = ++mountSeq;
  const stale = () => seq !== mountSeq;
  const form = formById(loadProfile()?.form);
  activeFormId = form.id;

  if (form.sprite) {
    let f: FigurePresence | null = null;
    try {
      const { FigurePresence } = await import('./figure');
      if (stale()) return;
      f = new FigurePresence(form, quality.reducedMotion);
      await f.load();
      if (stale()) {
        f.dispose();
        return;
      }
      figure = f;
      wire(quality);
      if (quality.reducedMotion) f.renderStill();
      return;
    } catch {
      // Dispose the LOCAL instance: its root is in the DOM even though
      // the module-level `figure` was never assigned.
      f?.dispose();
      /* sprite unreachable: the light-orb steps in without complaint */
    }
  }

  const canvas = document.getElementById('gl') as HTMLCanvasElement | null;
  if (!canvas || !quality.webgl) return; // CSS aura carries the presence
  try {
    const { SoenaScene } = await import('./scene');
    if (stale()) return;
    orb = new SoenaScene(canvas, quality);
    canvas.classList.add('is-live');
    wire(quality);
    if (quality.reducedMotion) orb.renderStill();
  } catch {
    /* GPU refused or chunk failed: the aura remains, the app continues */
  }
}

function wire(quality: Quality): void {
  // One post for every page: the bottom-left corner. Pages set only the
  // size (the landing keeps it small); avenues change only the colour.
  const scale = parseFloat(document.body.dataset.presenceScale ?? '1') || 1;
  orb?.setAnchor(-0.88);
  orb?.setStage(scale < 1 ? scale * 0.75 : 0.85);
  figure?.setStage(scale);

  const applyAvenue = (id: string) => {
    const avenue = avenueById(id);
    if (avenue) {
      orb?.setHues(avenue.hues[0], avenue.hues[1]);
      figure?.setHues(avenue.hues[0], avenue.hues[1]);
    } else {
      orb?.setHues(150, 92);
      figure?.setHues(150, 92);
    }
    if (quality.reducedMotion) still();
  };

  unwire.push(on('avenue:enter', ({ id }) => applyAvenue(id)));

  // The presence arrives late (idle-time): catch up with wherever the
  // visitor already scrolled to, instead of waking up in threshold hues.
  import('../core/scroll').then(({ currentAvenue }) => applyAvenue(currentAvenue()));

  unwire.push(
    on('soena:mood', ({ mood }) => {
      orb?.setMood(mood);
      figure?.setMood(mood);
    }),
  );
  unwire.push(
    on('soena:pulse', ({ strength }) => {
      orb?.addPulse(strength);
      figure?.addPulse(strength);
    }),
  );
  unwire.push(
    on('scroll:progress', ({ velocity }) => {
      orb?.setScrollVelocity(velocity);
      figure?.setScrollVelocity(velocity);
    }),
  );
  unwire.push(
    on('pointer:move', ({ x, y }) => {
      orb?.setPointer(x, y);
      figure?.setPointer(x, y);
    }),
  );

  const onResize = () => {
    orb?.resize();
    figure?.resize();
    if (quality.reducedMotion) still();
  };
  window.addEventListener('resize', onResize);
  unwire.push(() => window.removeEventListener('resize', onResize));

  if (!quality.reducedMotion) {
    // core/scroll is already loaded (startScroll ran at boot), so this
    // resolves in a microtask — the disposer lands in the current bag.
    import('../core/scroll').then(({ onFrame }) => {
      unwire.push(
        onFrame((t, dt) => {
          orb?.render(t, dt);
          figure?.render(t, dt);
        }),
      );
    });
  }
}

function still(): void {
  orb?.renderStill();
  figure?.renderStill();
}

/* ------------------------------------------------------------------ */
/* Pointing at the page                                                */
/* ------------------------------------------------------------------ */

let spotlightTimer: number | undefined;

/**
 * Direct SOENA's attention (and the visitor's) at a piece of the UI.
 * Works in every form: the figure glances over and glows; the orb
 * pulses; either way the element itself is spotlit.
 */
export function pointAtSelector(selector: string): void {
  const el = document.querySelector(selector);
  if (!el) return;

  // Bring the target on screen first if it is far away.
  const rect = el.getBoundingClientRect();
  const offscreen = rect.bottom < 0 || rect.top > window.innerHeight;
  if (offscreen) {
    import('../core/scroll').then(({ scrollToSection }) => {
      const withId = (el as HTMLElement).closest('[id]') as HTMLElement | null;
      if (withId) scrollToSection(withId.id);
    });
  }

  window.setTimeout(() => {
    // Spotlight the element in CSS (works with or without WebGL).
    document.querySelectorAll('.soena-spotlight').forEach((n) => n.classList.remove('soena-spotlight'));
    el.classList.add('soena-spotlight');
    window.clearTimeout(spotlightTimer);
    spotlightTimer = window.setTimeout(() => el.classList.remove('soena-spotlight'), 5200);

    if (figure) figure.pointAtElement(el);
    else orb?.addPulse(1);
  }, offscreen ? 900 : 60);
}
