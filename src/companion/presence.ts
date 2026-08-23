/**
 * The companion's presence director.
 *
 * Decides which body SOENA wears (the procedural light-orb, or one of the
 * placeholder character models), loads it lazily after first paint, wires
 * it to the app bus, and owns the pointing gesture: scroll the target into
 * view, spotlight it in CSS, and — when a character is on stage — walk
 * over, raise the ladder if it is high, and hold the wand on it.
 *
 * Loading discipline is unchanged from the orb days: the page is fully
 * usable before any 3D code arrives, and every failure path lands back on
 * the CSS aura.
 */
import { on } from '../core/bus';
import type { Quality } from '../core/quality';
import { loadProfile } from '../core/profile';
import { AVENUES, avenueById } from '../data/avenues';
import { formById } from '../data/companion-config';
import type { SoenaScene } from './scene';
import type { CharacterScene } from './character';

let orb: SoenaScene | null = null;
let character: CharacterScene | null = null;
let currentQuality: Quality | null = null;
let activeFormId = 'orb';

export function initPresence(quality: Quality): void {
  currentQuality = quality;
  if (!quality.webgl) return; // CSS aura carries the presence alone

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
  orb?.dispose();
  character?.dispose();
  orb = null;
  character = null;
  document.getElementById('gl')?.classList.remove('is-live');
}

async function mountPresence(quality: Quality): Promise<void> {
  const canvas = document.getElementById('gl') as HTMLCanvasElement | null;
  if (!canvas) return;
  const form = formById(loadProfile()?.form);
  activeFormId = form.id;

  if (form.id !== 'orb') {
    try {
      const { CharacterScene } = await import('./character');
      const scene = new CharacterScene(canvas, quality, form);
      await scene.load();
      character = scene;
      canvas.classList.add('is-live');
      wire(quality);
      if (quality.reducedMotion) scene.renderStill();
      return;
    } catch {
      /* model unreachable (offline, CDN blocked, no file yet):
         the light-orb steps in without complaint */
    }
  }

  try {
    const { SoenaScene } = await import('./scene');
    orb = new SoenaScene(canvas, quality);
    activeFormId = 'orb';
    canvas.classList.add('is-live');
    wire(quality);
    if (quality.reducedMotion) orb.renderStill();
  } catch {
    /* GPU refused or chunk failed: the aura remains, the app continues */
  }
}

function wire(quality: Quality): void {
  const applyAvenue = (id: string) => {
    const avenue = avenueById(id);
    if (avenue) {
      const idx = AVENUES.findIndex((a) => a.id === id);
      const side = idx % 2 === 0 ? -1 : 1;
      orb?.setHues(avenue.hues[0], avenue.hues[1]);
      character?.setHues(avenue.hues[0], avenue.hues[1]);
      const anchor = window.innerWidth < 720 ? 0 : side * 0.9;
      orb?.setAnchor(anchor);
      orb?.setStage(1);
      character?.setAnchor(anchor * (character?.worldHalfWidth() ?? 2) * 0.52);
      character?.setStage(1);
    } else {
      // No avenue on screen: the garden greens, and the page decides the
      // companion's post and size (the landing keeps a small corner avatar).
      orb?.setHues(150, 92);
      character?.setHues(150, 92);
      const aside = parseFloat(document.body.dataset.presenceAnchor ?? '0') || 0;
      const scale = parseFloat(document.body.dataset.presenceScale ?? '1') || 1;
      orb?.setAnchor(window.innerWidth < 720 ? aside * 0.6 : aside * 1.55);
      orb?.setStage(scale < 1 ? scale * 0.75 : 1);
      character?.setAnchor(
        window.innerWidth < 720
          ? aside * (character?.worldHalfWidth() ?? 2) * 0.3
          : aside * (character?.worldHalfWidth() ?? 2) * 0.82,
      );
      character?.setStage(scale);
    }
    if (quality.reducedMotion) still();
  };

  on('avenue:enter', ({ id }) => applyAvenue(id));

  // The scene arrives late (idle-time chunk): catch up with wherever the
  // visitor already scrolled to, instead of waking up in threshold colors.
  const active = document.querySelector<HTMLAnchorElement>('#ways a.is-active');
  applyAvenue(active?.getAttribute('href')?.slice(1) ?? 'threshold');

  on('soena:mood', ({ mood }) => {
    orb?.setMood(mood);
    character?.setMood(mood);
  });
  on('soena:pulse', ({ strength }) => {
    orb?.addPulse(strength);
    character?.addPulse(strength);
  });
  on('scroll:progress', ({ velocity }) => {
    orb?.setScrollVelocity(velocity);
    character?.setScrollVelocity(velocity);
  });
  on('pointer:move', ({ x, y }) => {
    orb?.setPointer(x, y);
    character?.setPointer(x, y);
  });

  window.addEventListener('resize', () => {
    orb?.resize();
    character?.resize();
    if (quality.reducedMotion) still();
  });

  if (!quality.reducedMotion) {
    import('../core/scroll').then(({ onFrame }) => {
      onFrame((t, dt) => {
        orb?.render(t, dt);
        character?.render(t, dt);
      });
    });
  }
}

function still(): void {
  orb?.renderStill();
  character?.renderStill();
}

/* ------------------------------------------------------------------ */
/* Pointing at the page                                                */
/* ------------------------------------------------------------------ */

let spotlightTimer: number | undefined;

/**
 * Direct SOENA's attention (and the visitor's) at a piece of the UI.
 * Works in every form: the character walks over and points the wand;
 * the orb pulses; either way the element itself is spotlit.
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

    if (character) character.pointAtElement(el);
    else orb?.addPulse(1);
  }, offscreen ? 900 : 60);
}
