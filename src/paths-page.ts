/**
 * Find Your Path — boot for the support-paths page.
 *
 * This page is SOENA's centre of gravity as a product: the eleven
 * tailored support paths, the guided pathway engine, the five 7-day
 * companionship journeys, and the Toolkit where grounding and
 * journaling live together. The same quiet shell as everywhere —
 * canopy, brief arrival, SOENA in the corner — carrying heavier cargo.
 */
import '@fontsource-variable/fraunces/index.css';
import '@fontsource-variable/outfit/index.css';
import './styles/main.css';
import './styles/garden.css';

import { emit } from './core/bus';
import { detectQuality } from './core/quality';
import { observeSections, startScroll } from './core/scroll';
import { initPresence } from './companion/presence';
import { say } from './companion/dialogue';
import { beginArrival } from './ui/arrival';
import { initHeaderControls } from './ui/header';
import { initChat } from './ui/chat';
import { buildNav } from './ui/drawer';
import { initPathfinder, initToolkit } from './ui/pathfinder';
import { loadJourney } from './core/pathway';
import { AVENUES } from './data/avenues';

const quality = detectQuality();
document.documentElement.dataset.tier = String(quality.tier);
if (quality.reducedMotion) document.documentElement.dataset.motion = 'reduced';

const arrival = beginArrival('brief');

initPathfinder();
initToolkit();

buildNav('./avenues.html#community', [
  { label: 'find your path', href: './paths.html', icon: 'map' as const },
  { label: 'toolkit', href: './paths.html#toolkit', icon: 'notebook-pen' as const },
  ...AVENUES.map((a) => ({ label: a.title.toLowerCase(), href: `./avenues.html#${a.id}`, emblem: a.emblem })),
  { label: 'reach out', href: './contact.html', icon: 'mail' as const },
]);
document.getElementById('site-head')?.removeAttribute('hidden');

initHeaderControls();
initChat();
startScroll(quality.reducedMotion);
observeSections();
initPresence(quality);

/* Pointer parallax (rAF-throttled) — feeds the corner companion. */
let pointerScheduled = false;
window.addEventListener(
  'pointermove',
  (e) => {
    if (pointerScheduled) return;
    pointerScheduled = true;
    requestAnimationFrame(() => {
      pointerScheduled = false;
      emit('pointer:move', {
        x: (e.clientX / window.innerWidth) * 2 - 1,
        y: -((e.clientY / window.innerHeight) * 2 - 1),
      });
    });
  },
  { passive: true },
);

arrival.then(() => {
  window.setTimeout(() => {
    const j = loadJourney();
    say(
      j
        ? 'Welcome back to the paths, {name}. Your journey is where you left it — no ground lost.'
        : 'Eleven doors, {name} — take the one that matches where you actually are. There is no wrong first step here.',
      'guiding',
    );
  }, 800);
});
