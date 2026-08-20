/**
 * The companion's presence layer: decides IF and WHEN the WebGL body loads,
 * and wires it to the rest of the app through the bus.
 *
 * Loading discipline (the LISA lesson):
 *  - The page paints and is fully usable before any 3D code is fetched.
 *  - three.js + scene arrive via dynamic import during idle time.
 *  - No WebGL / reduced-motion / failure → the CSS aura simply remains.
 *    Nothing on the page depends on the canvas existing.
 */
import { on } from '../core/bus';
import type { Quality } from '../core/quality';
import { AVENUES, avenueById } from '../data/avenues';
import type { SoenaScene } from './scene';

let scene: SoenaScene | null = null;

export function initPresence(quality: Quality): void {
  if (!quality.webgl) return; // CSS aura carries the presence alone

  const mount = () => {
    import('./scene')
      .then(({ SoenaScene }) => {
        const canvas = document.getElementById('gl') as HTMLCanvasElement | null;
        if (!canvas) return;
        scene = new SoenaScene(canvas, quality);
        canvas.classList.add('is-live');
        wire(quality);
        if (quality.reducedMotion) {
          // One dignified still frame; no animation loop.
          scene.renderStill();
        }
      })
      .catch(() => {
        /* GPU refused or chunk failed: the aura remains, the app continues */
      });
  };

  if ('requestIdleCallback' in window) {
    (window as Window & typeof globalThis).requestIdleCallback(mount, { timeout: 2500 });
  } else {
    setTimeout(mount, 600);
  }
}

function wire(quality: Quality): void {
  if (!scene) return;
  const s = scene;

  on('avenue:enter', ({ id }) => {
    const avenue = avenueById(id);
    if (avenue) {
      s.setHues(avenue.hues[0], avenue.hues[1]);
      // Deterministic sides: even avenues put the companion on the left,
      // odd on the right — always opposite the text column.
      const idx = AVENUES.findIndex((a) => a.id === id);
      const side = idx % 2 === 0 ? -1 : 1;
      s.setAnchor(window.innerWidth < 720 ? 0 : side * 0.9);
    } else {
      // Threshold: centre stage.
      s.setHues(255, 205);
      s.setAnchor(0);
    }
    if (quality.reducedMotion) s.renderStill();
  });

  on('soena:mood', ({ mood }) => s.setMood(mood));
  on('soena:pulse', ({ strength }) => s.addPulse(strength));
  on('scroll:progress', ({ velocity }) => s.setScrollVelocity(velocity));
  on('pointer:move', ({ x, y }) => s.setPointer(x, y));

  window.addEventListener('resize', () => {
    s.resize();
    if (quality.reducedMotion) s.renderStill();
  });

  if (!quality.reducedMotion) {
    // Join the app's single shared rAF loop.
    import('../core/scroll').then(({ onFrame }) => {
      onFrame((t, dt) => s.render(t, dt));
    });
  }
}
