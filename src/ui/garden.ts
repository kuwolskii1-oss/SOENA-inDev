/**
 * The Garden world's growing things.
 *
 * Garden is a place, not a palette: besides its own tokens, arrangement
 * and component shapes (styles/garden.css) it plants vines between the
 * avenues, which draw themselves as they scroll into view.
 *
 * The vines are decorative and world-scoped: they are planted only
 * while the Garden is the current world, and cleared when the visitor
 * switches worlds — no other world inherits Garden's undergrowth.
 */
import { on } from '../core/bus';
import { currentPalette } from './palette';

const SVG = 'http://www.w3.org/2000/svg';

/** A wandering stem with leaves along it, drawn in one path so the
 *  growth reads as a single continuous gesture. */
function vine(seed: number): SVGSVGElement {
  const flip = seed % 2 === 1;
  const svg = document.createElementNS(SVG, 'svg');
  svg.setAttribute('viewBox', '0 0 220 150');
  svg.setAttribute('aria-hidden', 'true');
  svg.setAttribute('focusable', 'false');
  svg.classList.add('garden-vine', 'reveal');

  // Each divider bends a little differently, so no two look stamped.
  const sway = 26 + (seed % 3) * 12;
  const d = `M ${flip ? 206 : 14} 4
     C ${flip ? 206 - sway : 14 + sway} 40, ${flip ? 150 : 70} 52, ${flip ? 120 : 100} 80
     S ${flip ? 60 : 160} 118, ${flip ? 40 : 180} 146`;
  const stem = document.createElementNS(SVG, 'path');
  stem.setAttribute('d', d);
  stem.classList.add('vine-stem');
  svg.appendChild(stem);

  // Leaves hang off the stem at intervals, alternating sides. Each one
  // is PLACED by its <g> and ANIMATED on the <path> inside it: a CSS
  // transform on the path would otherwise override the placement
  // attribute and collapse every leaf onto the origin.
  const leaves: Array<[number, number, number]> = flip
    ? [
        [188, 30, -32], [150, 58, 26], [126, 86, -20],
        [92, 108, 30], [64, 130, -26],
      ]
    : [
        [34, 30, 30], [70, 58, -26], [102, 86, 22],
        [138, 108, -28], [166, 130, 24],
      ];
  for (const [x, y, rot] of leaves) {
    const sprig = document.createElementNS(SVG, 'g');
    sprig.classList.add('vine-sprig');
    sprig.setAttribute(
      'transform',
      `translate(${x} ${y}) rotate(${rot}) scale(${(0.8 + ((seed + x) % 5) * 0.08).toFixed(2)})`,
    );
    const leaf = document.createElementNS(SVG, 'path');
    // A simple two-arc leaf: tip, belly, tip — centred on its own origin
    // so the unfurl scales from the middle of the blade.
    leaf.setAttribute('d', 'M -13 0 C -6 -8, 7 -8, 13 0 C 7 8, -6 8, -13 0 Z');
    leaf.classList.add('vine-leaf');
    sprig.appendChild(leaf);
    svg.appendChild(sprig);
  }

  // The dash length must cover the path so the draw starts fully hidden.
  try {
    stem.style.setProperty('--len', String(Math.ceil(stem.getTotalLength() || 600)));
  } catch {
    stem.style.setProperty('--len', '600');
  }
  return svg;
}

function plant(): void {
  const sections = document.querySelectorAll<HTMLElement>('.avenue');
  sections.forEach((section, i) => {
    // No vine after the last avenue: the coda ends the path itself.
    if (i === sections.length - 1) return;
    if (section.nextElementSibling?.classList.contains('garden-vine')) return;
    section.after(vine(i));
  });
}

function clear(): void {
  document.querySelectorAll('.garden-vine').forEach((v) => v.remove());
}

/** Reveal the vines planted after the page's own observer already ran. */
function revealLate(): void {
  const fresh = document.querySelectorAll<SVGSVGElement>('.garden-vine:not(.is-in)');
  if (!fresh.length) return;
  const io = new IntersectionObserver(
    (entries) => {
      for (const e of entries) {
        if (!e.isIntersecting) continue;
        e.target.classList.add('is-in');
        io.unobserve(e.target);
      }
    },
    { rootMargin: '0px 0px -12% 0px' },
  );
  fresh.forEach((v) => io.observe(v));
}

/**
 * Plant (or clear) the Garden's undergrowth for the current world.
 * Call AFTER the avenues are rendered and BEFORE the reveal observer
 * runs, so the vines are observed like any other revealed element.
 */
export function initGarden(): void {
  if (currentPalette() === 'garden') plant();
  // Switching worlds in Developer options replants immediately; those
  // vines missed the page's reveal pass, so give them their own.
  on('palette:change', ({ id }) => {
    if (id !== 'garden') {
      clear();
      return;
    }
    plant();
    revealLate();
  });
}
