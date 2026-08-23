/**
 * Reach SOENA — boot for the contact page.
 * Same discipline as the main door: instant static paint, content wired
 * next, the WebGL presence arriving at idle from its lazy chunk.
 */
import '@fontsource-variable/fraunces/index.css';
import '@fontsource-variable/outfit/index.css';
import './styles/main.css';

import { emit } from './core/bus';
import { loadProfile } from './core/profile';
import { detectQuality } from './core/quality';
import { startScroll } from './core/scroll';
import { initPresence } from './companion/presence';
import { say } from './companion/dialogue';
import { beginArrival } from './ui/arrival';
import { initHeaderControls } from './ui/header';
import { initChat } from './ui/chat';
import { renderReach } from './ui/reach';

const quality = detectQuality();
document.documentElement.dataset.tier = String(quality.tier);
if (quality.reducedMotion) document.documentElement.dataset.motion = 'reduced';

/* Inner page: the brief curtain — enough to cover the settling, never
   enough to make moving around the site feel gated. */
const arrival = beginArrival('brief');

const mount = document.getElementById('reach');
if (mount) renderReach(mount);

initHeaderControls();
initChat();
startScroll(quality.reducedMotion);
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
        ? 'The reaching place, {name}. Whatever {they} {have} to say, I will help {them} fold it into a letter.'
        : 'This is the reaching place. Whoever you are, a letter from you is welcome — I will help you fold it.',
      'greeting',
    );
  }, 700);
});
