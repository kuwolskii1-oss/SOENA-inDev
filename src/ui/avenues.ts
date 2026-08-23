/**
 * Renders the eight avenues into the page and wires their interactive
 * doors (prompts, the shared breath, the testimony journal).
 *
 * Markup is built once at boot from data — there is no framework diffing
 * and no re-render churn. Personalized fragments (orientation framings)
 * carry a data hook and are re-voiced in place when the profile changes.
 */
import { on } from '../core/bus';
import { fill, loadProfile } from '../core/profile';
import { addLore } from '../core/lore';
import { emblemSvg, iconSvg, prefixIcon, setLabel, type IconName } from './icons';
import { AVENUES, type Avenue, type Door } from '../data/avenues';
import { speakJournalSaved } from '../companion/dialogue';
import { addEntry, deleteEntry, formatDate, loadJournal } from './journal';

const SEED_VOICES: Array<{ path: string; text: string }> = [
  { path: 'a theistic path', text: 'I stopped trying to feel certain and started trying to feel accompanied. Certainty never came; company did.' },
  { path: 'a non-theistic path', text: 'No one is watching, and still I keep the vigil. It turns out reverence survives the theology I dropped.' },
  { path: 'a philosophical path', text: 'I came for answers and stayed for better questions. That trade improved my life more than any answer has.' },
  { path: 'a psychological path', text: 'The voice in my head got quieter the day I wrote down what it kept saying. Paper is a patient exorcist.' },
  { path: 'an emotional path', text: 'I let the grief finish for once — the whole wave. On the far side of it there was, of all things, gratitude.' },
  { path: 'an earth-rooted path', text: 'My church has a canopy. Attendance is taken by the birds. I have never been more faithful to anything.' },
];

export function renderAvenues(): void {
  const main = document.getElementById('app');
  if (!main) return;

  AVENUES.forEach((avenue, index) => {
    // Section
    const section = document.createElement('section');
    // Text sits opposite the companion: orb left on even avenues → text right.
    section.className = `avenue ${index % 2 === 0 ? 'avenue--text-right' : 'avenue--text-left'}`;
    section.id = avenue.id;
    section.dataset.avenue = avenue.id;
    section.setAttribute('aria-labelledby', `${avenue.id}-title`);

    const inner = document.createElement('div');
    inner.className = 'avenue-inner';

    const head = document.createElement('header');
    head.className = 'avenue-head reveal';
    head.innerHTML = `
      <span class="avenue-index">${emblemSvg(avenue.emblem, { className: 'avenue-emblem' })}${String(index + 1).padStart(2, '0')}</span>
      <h2 class="avenue-title" id="${avenue.id}-title">${avenue.title}</h2>
      <p class="avenue-tagline">${avenue.tagline}</p>`;

    const intro = document.createElement('p');
    intro.className = 'avenue-intro reveal';
    intro.textContent = avenue.intro;

    const framing = document.createElement('p');
    framing.className = 'avenue-framing reveal';
    framing.dataset.framingFor = avenue.id;
    framing.textContent = framingText(avenue);

    const doors = document.createElement('div');
    doors.className = 'doors';
    avenue.doors.forEach((door) => doors.appendChild(renderDoor(avenue, door)));

    inner.append(head, intro, framing, doors);

    if (avenue.id === 'community') inner.appendChild(renderVoices());

    section.appendChild(inner);
    main.appendChild(section);
  });

  // Closing coda
  const coda = document.createElement('section');
  coda.className = 'coda';
  coda.innerHTML = `
    <p class="reveal" data-coda>${fill('Go gently, {name}. The door does not close.')}</p>
    <a class="coda-reach external-page-link reveal has-icon" href="./contact.html">${iconSvg('mail')}<span>or reach out to those who tend it</span></a>`;
  main.appendChild(coda);

  // Re-voice personalized fragments when the profile changes.
  on('profile:change', () => {
    AVENUES.forEach((avenue) => {
      const el = document.querySelector<HTMLElement>(`[data-framing-for="${avenue.id}"]`);
      if (el) el.textContent = framingText(avenue);
    });
    const codaEl = document.querySelector<HTMLElement>('[data-coda]');
    if (codaEl) codaEl.textContent = fill('Go gently, {name}. The door does not close.');
  });
}

function framingText(avenue: Avenue): string {
  const p = loadProfile();
  const orientation = p?.orientation ?? 'seeking';
  return fill(avenue.framings[orientation] ?? avenue.framings.seeking, p);
}

function renderDoor(avenue: Avenue, door: Door): HTMLElement {
  const card = document.createElement('article');
  card.className = 'door reveal';
  const h = document.createElement('h3');
  h.textContent = door.title;
  const DOOR_ICON: Record<string, IconName> = {
    journal: 'notebook-pen',
    breath: 'wind',
    prompt: 'lightbulb',
  };
  prefixIcon(h, DOOR_ICON[door.kind ?? 'prompt'] ?? 'lightbulb');
  const body = document.createElement('p');
  body.textContent = door.body;
  card.append(h, body);

  if (door.kind === 'breath') card.appendChild(renderBreath());
  if (door.kind === 'journal') card.appendChild(renderJournal(avenue.id));

  return card;
}

/* ---------------------------------------------------------------- */
/* The shared breath                                                 */
/* ---------------------------------------------------------------- */

function renderBreath(): HTMLElement {
  const wrap = document.createElement('div');
  wrap.className = 'breath';
  const circle = document.createElement('div');
  circle.className = 'breath-circle';
  circle.setAttribute('aria-hidden', 'true');
  const label = document.createElement('p');
  label.className = 'breath-label';
  label.setAttribute('role', 'status');
  const start = document.createElement('button');
  start.type = 'button';
  start.className = 'btn btn--primary';
  start.textContent = 'Breathe with me';
  prefixIcon(start, 'wind');

  let timer: number | undefined;
  let running = false;

  const stop = () => {
    running = false;
    window.clearTimeout(timer);
    circle.classList.remove('is-in', 'is-out');
    label.textContent = '';
    setLabel(start, 'Breathe with me');
  };

  start.addEventListener('click', () => {
    if (running) return stop();
    running = true;
    setLabel(start, 'Enough for now');
    let cycle = 0;
    const inhale = () => {
      if (!running) return;
      circle.classList.remove('is-out');
      circle.classList.add('is-in');
      label.textContent = 'in — 2 — 3 — 4';
      timer = window.setTimeout(exhale, 4000);
    };
    const exhale = () => {
      if (!running) return;
      circle.classList.remove('is-in');
      circle.classList.add('is-out');
      label.textContent = 'out — 2 — 3 — 4 — 5 — 6';
      cycle += 1;
      timer = window.setTimeout(cycle >= 5 ? finish : inhale, 6000);
    };
    const finish = () => {
      stop();
      label.textContent = 'There. The noise floor is lower.';
    };
    inhale();
  });

  wrap.append(circle, label, start);
  return wrap;
}

/* ---------------------------------------------------------------- */
/* Testimony journal                                                 */
/* ---------------------------------------------------------------- */

function renderJournal(avenueId: string): HTMLElement {
  const wrap = document.createElement('div');
  wrap.className = 'journal';

  const textarea = document.createElement('textarea');
  textarea.className = 'journal-input';
  textarea.rows = 5;
  textarea.maxLength = 4000;
  textarea.placeholder = 'Right now…';
  textarea.setAttribute('aria-label', 'Write your testimony');

  const save = document.createElement('button');
  save.type = 'button';
  save.className = 'btn btn--primary';
  save.textContent = 'Keep these words';
  prefixIcon(save, 'feather');

  const list = document.createElement('div');
  list.className = 'journal-list';

  const renderList = () => {
    const entries = loadJournal();
    list.replaceChildren(
      ...entries.slice(0, 12).map((e) => {
        const item = document.createElement('article');
        item.className = 'journal-entry';
        const meta = document.createElement('header');
        meta.textContent = formatDate(e.at);
        prefixIcon(meta, 'calendar');
        const text = document.createElement('p');
        text.textContent = e.text;
        const del = document.createElement('button');
        del.type = 'button';
        del.className = 'btn btn--ghost';
        del.textContent = 'release';
        prefixIcon(del, 'trash-2');
        del.addEventListener('click', () => {
          deleteEntry(e.id);
          renderList();
        });
        item.append(meta, text, del);
        return item;
      }),
    );
  };

  save.addEventListener('click', () => {
    const value = textarea.value.trim();
    if (!value) return;
    addEntry(avenueId, value);
    // Lore: SOENA remembers THAT you testified (a moment), not the words —
    // the words stay in the journal where they belong.
    addLore('moment', `kept a testimony (${new Date().toLocaleDateString()})`, ['testimony']);
    textarea.value = '';
    speakJournalSaved();
    renderList();
  });

  renderList();
  wrap.append(textarea, save, list);
  return wrap;
}

/* ---------------------------------------------------------------- */
/* Community seed voices                                             */
/* ---------------------------------------------------------------- */

function renderVoices(): HTMLElement {
  const wrap = document.createElement('div');
  wrap.className = 'voices reveal';
  const h = document.createElement('h3');
  h.className = 'voices-title';
  h.textContent = 'Voices at the door';
  prefixIcon(h, 'users-round');
  const note = document.createElement('p');
  note.className = 'voices-note';
  note.textContent = 'Left by other travellers, kept anonymous, shared with consent.';
  wrap.append(h, note);
  SEED_VOICES.forEach((v) => {
    const q = document.createElement('blockquote');
    q.className = 'voice';
    const text = document.createElement('p');
    text.textContent = `“${v.text}”`;
    const cite = document.createElement('cite');
    cite.textContent = `— from ${v.path}`;
    q.append(text, cite);
    wrap.appendChild(q);
  });
  return wrap;
}
