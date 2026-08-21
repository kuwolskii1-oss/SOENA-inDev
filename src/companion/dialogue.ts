/**
 * What SOENA says, and when. All lines pass through the pronoun engine, so
 * the companion speaks to the person as they asked to be spoken to.
 */
import { emit } from '../core/bus';
import { INTENTIONS, fill, loadProfile } from '../core/profile';
import { avenueById } from '../data/avenues';
import { orientationById } from '../data/orientations';
import { speak } from '../core/speech';

const captionEl = (): HTMLElement | null => document.getElementById('caption');

let hideTimer: number | undefined;
let lastAvenueSpoken = '';
let chain = 0; // invalidates a previous line's pulse chain when a new one starts

export function say(text: string, mood: string = 'speaking'): void {
  const line = fill(text);
  // On the threshold stage, SOENA's words live beside the character; the
  // floating caption only takes over once the stage has scrolled away.
  const heroLine = document.getElementById('hero-line');
  let heroVisible = false;
  if (heroLine) {
    heroLine.textContent = line;
    const rect = heroLine.getBoundingClientRect();
    heroVisible = rect.bottom > 0 && rect.top < window.innerHeight;
  }
  const el = captionEl();
  if (el && !heroVisible) {
    el.textContent = line;
    el.classList.add('is-visible');
    window.clearTimeout(hideTimer);
    hideTimer = window.setTimeout(() => el.classList.remove('is-visible'), Math.max(4200, line.length * 65));
  }
  emit('soena:mood', { mood });
  emit('soena:say', { text: line, mood });
  speak(line);
  // Without voice, still let the body ripple as if speaking.
  const myChain = ++chain;
  let pulses = Math.min(10, Math.ceil(line.split(' ').length / 3));
  const tick = () => {
    if (myChain !== chain) return; // a newer line took over
    if (pulses-- <= 0) {
      emit('soena:mood', { mood: 'idle' });
      return;
    }
    emit('soena:pulse', { strength: 0.4 + Math.random() * 0.4 });
    window.setTimeout(tick, 260 + Math.random() * 240);
  };
  tick();
}

/** A small awareness of the hour — companions notice the light. */
function hourWord(): string {
  const h = new Date().getHours();
  if (h < 5) return 'in the small hours';
  if (h < 12) return 'this morning';
  if (h < 18) return 'this afternoon';
  if (h < 22) return 'this evening';
  return 'tonight';
}

export function greet(): void {
  const p = loadProfile();
  if (!p) {
    say('I am SOENA — a companion at the door. Whoever you are, however you believe or don’t: you can come in.', 'greeting');
    return;
  }
  const days = Math.floor((Date.now() - p.createdAt) / 86400000);
  const orientation = orientationById(p.orientation);
  if (p.visits <= 1) {
    say(`Welcome, {name}. I will remember {them} — the door knows {their} name now.`, 'greeting');
  } else if (days < 1) {
    say(`Hello again, {name}. Twice through the door in one day — the path must be speaking to {them}.`, 'greeting');
  } else if (p.lastAvenue) {
    const av = avenueById(p.lastAvenue);
    say(
      `Welcome back ${hourWord()}, {name}. When {they} last {were} here, {they} {were} walking ${av ? `the avenue of ${av.title.toLowerCase()}` : 'the avenues'}. Shall we continue?`,
      'greeting',
    );
  } else {
    say(`Welcome back ${hourWord()}, {name}. The ${orientation.label.toLowerCase()} way is still here, and so am I.`, 'greeting');
  }
}

export function speakAvenue(id: string): void {
  if (id === lastAvenueSpoken) return;
  lastAvenueSpoken = id;
  const avenue = avenueById(id);
  if (!avenue) return;
  // The orientation-specific framing appears in the section itself;
  // the companion speaks its own ushering line.
  say(avenue.companionLine, 'guiding');
}

export function speakIntention(): void {
  const p = loadProfile();
  if (!p || !p.intentions.length) return;
  const first = INTENTIONS.find((i) => i.id === p.intentions[0]);
  if (first) {
    say(`{Name} came seeking ${first.label}. I have kept that in mind.`, 'guiding');
  }
}

export function speakMemoryOpened(): void {
  say('Here is everything I hold about {them}, {name}. All of it lives on {their} device alone — change it or burn it freely.', 'guiding');
}

export function speakErased(): void {
  say('It is done. I remember nothing — we can begin again whenever you wish.', 'idle');
}

export function speakJournalSaved(): void {
  say('Kept. {Their} words are safe with me, and only here.', 'guiding');
}
