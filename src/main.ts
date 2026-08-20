/**
 * SOENA — boot sequence.
 *
 * Order matters for performance:
 *  1. The HTML shell has already painted (critical CSS is inline).
 *  2. This module renders content and starts the scroll loop — still no 3D.
 *  3. The WebGL presence loads itself during idle time from a lazy chunk.
 */
import '@fontsource-variable/fraunces/index.css';
import '@fontsource-variable/outfit/index.css';
import './styles/main.css';

import { emit, on } from './core/bus';
import { loadProfile, saveProfile, touchVisit } from './core/profile';
import { detectQuality } from './core/quality';
import { observeSections, scrollToSection, startScroll } from './core/scroll';
import { setVoiceEnabled, speechSupported } from './core/speech';
import { initPresence } from './companion/presence';
import { greet, say, speakAvenue, speakIntention } from './companion/dialogue';
import { renderAvenues } from './ui/avenues';
import { runOnboarding } from './ui/onboarding';
import { openMemoryPanel } from './ui/memory';
import { AVENUES, avenueById } from './data/avenues';

const quality = detectQuality();
document.documentElement.dataset.tier = String(quality.tier);
if (quality.reducedMotion) document.documentElement.dataset.motion = 'reduced';

/* Content ------------------------------------------------------- */

renderAvenues();
enhanceHero();
document.getElementById('site-head')?.removeAttribute('hidden');

/* Scroll + sections ---------------------------------------------- */

startScroll(quality.reducedMotion);
observeSections();

on('avenue:enter', ({ id }) => {
  // Re-tint the CSS aura (works with or without WebGL).
  const avenue = avenueById(id);
  const aura = document.getElementById('aura');
  if (aura && avenue) {
    aura.style.setProperty('--aura-h1', String(avenue.hues[0]));
    aura.style.setProperty('--aura-h2', String(avenue.hues[1]));
  }
  document.querySelectorAll('#ways a').forEach((a) => {
    a.classList.toggle('is-active', a.getAttribute('href') === `#${id}`);
  });
  if (avenue) speakAvenue(id);
});

/* The companion's body ------------------------------------------- */

initPresence(quality);

/* Pointer parallax (rAF-throttled) -------------------------------- */

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

/* Header controls ------------------------------------------------- */

const voiceBtn = document.getElementById('voice-toggle') as HTMLButtonElement | null;
if (voiceBtn) {
  if (!speechSupported()) {
    voiceBtn.disabled = true;
    voiceBtn.title = 'Speech is not available in this browser';
  } else {
    const applyVoice = (onNow: boolean) => {
      setVoiceEnabled(onNow);
      voiceBtn.setAttribute('aria-pressed', String(onNow));
      voiceBtn.classList.toggle('is-on', onNow);
    };
    applyVoice(false);
    voiceBtn.addEventListener('click', () => {
      const next = voiceBtn.getAttribute('aria-pressed') !== 'true';
      applyVoice(next);
      const p = loadProfile();
      if (p) {
        p.voiceOn = next;
        saveProfile(p);
      }
      if (next) say('You will hear me now. I will keep my voice low.', 'speaking');
    });
  }
}

document.getElementById('memory-open')?.addEventListener('click', openMemoryPanel);

/* Arrival ---------------------------------------------------------- */

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
      if (entered) window.setTimeout(speakIntention, 6500);
    });
  }, 700);
}

/* ------------------------------------------------------------------ */

function enhanceHero(): void {
  const hero = document.getElementById('boot-hero');
  if (!hero) return;
  hero.dataset.avenue = 'threshold';
  const cue = document.createElement('button');
  cue.type = 'button';
  cue.className = 'hero-cue';
  cue.innerHTML = `<span>step through</span><span class="hero-cue-line" aria-hidden="true"></span>`;
  cue.addEventListener('click', () => scrollToSection(AVENUES[0].id));
  hero.appendChild(cue);
}

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
  dismiss.textContent = 'Start at the door';
  const closeBar = () => {
    bar.classList.add('is-leaving');
    window.setTimeout(() => bar.remove(), 400);
  };
  go.addEventListener('click', () => {
    scrollToSection(avenueId);
    closeBar();
  });
  dismiss.addEventListener('click', closeBar);
  bar.append(label, go, dismiss);
  document.body.appendChild(bar);
  window.setTimeout(() => bar.classList.add('is-visible'), 60);
  window.setTimeout(closeBar, 16000);
}
