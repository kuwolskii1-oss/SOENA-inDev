/**
 * The Avenues — boot for the walking page.
 * The landing is a single still screen; this is where the journey scrolls.
 * SOENA walks the margins at full size here, section by section.
 */
import '@fontsource-variable/fraunces/index.css';
import '@fontsource-variable/outfit/index.css';
import './styles/main.css';
import './styles/garden.css';

import { emit, on } from './core/bus';
import { loadProfile } from './core/profile';
import { addMomentOnce } from './core/lore';
import { detectQuality } from './core/quality';
import { observeSections, startScroll } from './core/scroll';
import { initPresence } from './companion/presence';
import { say, speakAvenue } from './companion/dialogue';
import { beginArrival } from './ui/arrival';
import { renderAvenues } from './ui/avenues';
import { initGarden } from './ui/garden';
import { initHeaderControls } from './ui/header';
import { initChat } from './ui/chat';
import { buildNav } from './ui/drawer';
import { AVENUES, avenueById } from './data/avenues';

const quality = detectQuality();
document.documentElement.dataset.tier = String(quality.tier);
if (quality.reducedMotion) document.documentElement.dataset.motion = 'reduced';

/* Inner page: the brief curtain — enough to cover the settling, never
   enough to make moving around the site feel gated. */
const arrival = beginArrival('brief');

renderAvenues();
/* World dressing that is more than CSS — planted before the reveal
   observer below, so the vines are revealed like any other block. */
initGarden();
buildNav('#community', [
  ...AVENUES.map((a) => ({ label: a.title.toLowerCase(), href: `#${a.id}`, emblem: a.emblem })),
  { label: 'reach out', href: './contact.html', icon: 'mail' as const },
]);
document.getElementById('site-head')?.removeAttribute('hidden');

initHeaderControls();
initChat();
startScroll(quality.reducedMotion);
observeSections();

on('avenue:enter', ({ id }) => {
  const avenue = avenueById(id);
  const aura = document.getElementById('aura');
  if (aura && avenue) {
    aura.style.setProperty('--aura-h1', String(avenue.hues[0]));
    aura.style.setProperty('--aura-h2', String(avenue.hues[1]));
  }
  if (avenue) {
    speakAvenue(id);
    if (loadProfile()) {
      addMomentOnce(`first-${id}`, `first walked the avenue of ${avenue.title.toLowerCase()}`);
    }
  }
});

initPresence(quality);

/* Pointer parallax (rAF-throttled) */
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
    const p = loadProfile();
    say(
      p
        ? 'The avenues, {name}. Any order, any pace — I will keep alongside.'
        : 'The avenues. Walk them in any order — I will keep alongside.',
      'guiding',
    );
  }, 800);
});
