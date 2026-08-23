/**
 * SOENA — the landing door. One still screen, no scrolling: the
 * conversation on the left, and SOENA keeping a small post in the
 * bottom-left corner. The walking happens on avenues.html.
 */
import '@fontsource-variable/fraunces/index.css';
import '@fontsource-variable/outfit/index.css';
import './styles/main.css';

import { emit } from './core/bus';
import { loadProfile, touchVisit } from './core/profile';
import { detectQuality } from './core/quality';
import { startScroll } from './core/scroll';
import { initPresence, pointAtSelector } from './companion/presence';
import { greet, say, speakIntention } from './companion/dialogue';
import { beginArrival } from './ui/arrival';
import { runOnboarding } from './ui/onboarding';
import { initHeaderControls } from './ui/header';
import { initChat, toggleChat } from './ui/chat';
import { buildNav } from './ui/drawer';
import { prefixIcon, type IconName } from './ui/icons';
import { AVENUES, avenueById } from './data/avenues';

const quality = detectQuality();
document.documentElement.dataset.tier = String(quality.tier);
if (quality.reducedMotion) document.documentElement.dataset.motion = 'reduced';

document.body.classList.add('landing');

/* The door stays closed for one breath while the page readies itself
   behind it (fonts, layout, the staged entrance) — full ceremony here,
   since the landing is the first thing anyone meets. */
const arrival = beginArrival('full');

/* Nav: two words — communities, and the drawer that holds the rest. */
buildNav('./avenues.html#community', [
  ...AVENUES.map((a) => ({ label: a.title.toLowerCase(), href: `./avenues.html#${a.id}`, emblem: a.emblem })),
  { label: 'reach out', href: './contact.html', icon: 'mail' as const },
]);
document.getElementById('site-head')?.removeAttribute('hidden');

initHeaderControls();
initChat();

/* No scrolling here — but the shared rAF loop still drives the scene. */
startScroll(true);

initPresence(quality);

/* Hero conversation chips — a typed reply first, then the move. */
const chips = document.getElementById('hero-chips');
if (chips) {
  const chip = (label: string, cls: string, glyph: IconName, act: () => void) => {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = `btn btn--chip ${cls}`.trim();
    b.textContent = label;
    prefixIcon(b, glyph);
    b.addEventListener('click', act);
    return b;
  };
  const replyThen = (line: string, act: () => void, delay = 1600) => () => {
    say(line, 'guiding');
    window.setTimeout(act, delay);
  };
  chips.append(
    chip('Walk the avenues', 'external-page-link', 'route', replyThen('Then walk with me — the avenues are just through here.', () => {
      window.location.href = './avenues.html';
    })),
    chip('Just talk with me', '', 'message-circle', replyThen('Good. No agenda, no map — just company.', () => toggleChat(), 1100)),
    chip('Share a testimony', 'external-page-link', 'feather', replyThen('I keep a page for exactly that — your words stay on your own device.', () => {
      window.location.href = './avenues.html#testimony';
    })),
    chip('Reach the keepers', 'external-page-link', 'mail', replyThen('The people who tend this place would love a letter. This way.', () => {
      window.location.href = './contact.html';
    })),
  );
}

/* Pointer parallax (rAF-throttled) — feeds the corner avatar's gaze. */
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

/* Arrival ---------------------------------------------------------- */

/* Nobody gets spoken to through a closed door: the greeting and the
   onboarding wait for the veil to lift, then land a beat later. */
arrival.then(() => {
  const existing = loadProfile();
  if (existing) {
    touchVisit();
    window.setTimeout(() => {
      greet();
      if (existing.lastAvenue && avenueById(existing.lastAvenue)) {
        offerContinue(existing.lastAvenue);
      }
    }, 900);
  } else {
    window.setTimeout(() => {
      runOnboarding((entered) => {
        greet();
        if (entered) {
          window.setTimeout(speakIntention, 6500);
          // A first small demonstration of pointing: where memory lives.
          window.setTimeout(() => pointAtSelector('#memory-open'), 12000);
        }
      });
    }, 650);
  }
});

function offerContinue(avenueId: string): void {
  const avenue = avenueById(avenueId);
  if (!avenue) return;
  const bar = document.createElement('div');
  bar.className = 'continue-bar';
  const label = document.createElement('span');
  label.textContent = `Return to ${avenue.title.toLowerCase()}?`;
  const go = document.createElement('button');
  go.type = 'button';
  go.className = 'btn btn--primary';
  go.textContent = 'Walk on';
  const dismiss = document.createElement('button');
  dismiss.type = 'button';
  dismiss.className = 'btn btn--ghost';
  dismiss.textContent = 'Stay at the door';
  const closeBar = () => {
    bar.classList.add('is-leaving');
    window.setTimeout(() => bar.remove(), 400);
  };
  go.addEventListener('click', () => {
    window.location.href = `./avenues.html#${avenueId}`;
  });
  dismiss.addEventListener('click', closeBar);
  bar.append(label, go, dismiss);
  document.body.appendChild(bar);
  window.setTimeout(() => bar.classList.add('is-visible'), 60);
  window.setTimeout(closeBar, 16000);
}
