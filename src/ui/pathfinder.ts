/**
 * Find your path — the heart of SOENA as a product.
 *
 * One page, four views, all state on the device:
 *   grid     → the eleven support paths
 *   path     → one path's three layers (You might be feeling… →
 *              Steady steps → Talk to SOENA about this)
 *   pathway  → the guided six-layer questioning engine, one question
 *              per screen, tappable answers, a progress bar, and a
 *              safety card that outranks everything else
 *   journey  → the chosen 7-day companionship program
 *
 * Design principles, enforced here rather than remembered:
 *   validation before instruction (feelings render above steps),
 *   safety before progress (the unsafe answer interrupts the flow),
 *   user-led goals (the goal question asks, never assumes),
 *   context continuity (every route into chat carries the situation).
 */
import { fill, loadProfile } from '../core/profile';
import {
  FEELING_OPTIONS, GOAL_OPTIONS, IMPACT_OPTIONS, PATHS, SUPPORT_OPTIONS,
  pathById, type PathOption, type SupportPath,
} from '../data/paths';
import { journeyById, type Journey } from '../data/journeys';
import {
  completeDay, dayUnlocked, leaveJourney, loadJourney, loadPathway,
  nextDay, savePathway, saveReflection, startJourney, type PathwayAnswers,
} from '../core/pathway';
import { openChatWith } from './chat';
import { say } from '../companion/dialogue';
import { icon, iconSvg, prefixIcon, type IconName } from './icons';
import { renderBreath, renderJournal } from './avenues';
import { loadJournal } from './journal';

type View = 'grid' | 'path' | 'pathway' | 'journey';

let host: HTMLElement;

/* ------------------------------------------------------------------ */
/* Small builders                                                      */
/* ------------------------------------------------------------------ */

function el<K extends keyof HTMLElementTagNameMap>(
  tag: K, cls?: string, text?: string,
): HTMLElementTagNameMap[K] {
  const n = document.createElement(tag);
  if (cls) n.className = cls;
  if (text !== undefined) n.textContent = text;
  return n;
}

function btn(label: string, cls: string, glyph: IconName, act: () => void): HTMLButtonElement {
  const b = el('button', cls, label);
  b.type = 'button';
  prefixIcon(b, glyph);
  b.addEventListener('click', act);
  return b;
}

function backLink(label: string, act: () => void): HTMLButtonElement {
  const b = btn(label, 'btn btn--ghost path-back', 'chevron-left', act);
  return b;
}

function show(view: View, render: (root: HTMLElement) => void): void {
  host.dataset.view = view;
  const root = el('div', `path-stage path-stage--${view}`);
  render(root);
  host.replaceChildren(root);
  window.scrollTo({ top: 0, behavior: 'auto' });
}

/* ------------------------------------------------------------------ */
/* View: the eleven paths                                              */
/* ------------------------------------------------------------------ */

function renderGrid(root: HTMLElement): void {
  const grid = el('div', 'path-grid');
  grid.setAttribute('role', 'list');
  PATHS.forEach((p, i) => {
    const card = el('button', 'path-card');
    card.type = 'button';
    card.setAttribute('role', 'listitem');
    card.innerHTML = `
      <span class="path-card-glyph" aria-hidden="true">${iconSvg(p.icon, { size: 26 })}</span>
      <span class="path-card-n" aria-hidden="true">${String(i + 1).padStart(2, '0')}</span>
      <span class="path-card-title">${p.title}</span>
      <span class="path-card-who">${p.who}</span>`;
    card.addEventListener('click', () => openPath(p.id));
    grid.appendChild(card);
  });
  root.appendChild(grid);
}

/* ------------------------------------------------------------------ */
/* View: one path, three layers                                        */
/* ------------------------------------------------------------------ */

function openPath(id: string): void {
  const p = pathById(id);
  if (!p) return;
  show('path', (root) => {
    root.appendChild(backLink('all paths', () => showGrid()));

    const head = el('header', 'path-head');
    head.innerHTML = `
      <span class="path-head-glyph" aria-hidden="true">${iconSvg(p.icon, { size: 30 })}</span>
      <h2>${p.title}</h2>
      <p class="path-who">${p.who}</p>`;
    root.appendChild(head);

    if (p.note) {
      const note = el('p', 'path-note');
      note.appendChild(icon('heart', { size: 15 }));
      note.appendChild(document.createTextNode(' ' + p.note));
      root.appendChild(note);
    }

    // Layer 1 — validation FIRST. This audience expects judgment;
    // recognition is what builds trust.
    const feel = el('section', 'path-layer');
    feel.setAttribute('aria-labelledby', 'layer-feel');
    feel.innerHTML = `<h3 id="layer-feel">${iconSvg('heart', { size: 17 })} You might be feeling…</h3>`;
    const fl = el('ul', 'feel-list');
    p.feelings.forEach((f) => fl.appendChild(el('li', '', f)));
    feel.appendChild(fl);
    root.appendChild(feel);

    // Layer 2 — steady steps: concrete, small, never commanding.
    const steps = el('section', 'path-layer');
    steps.setAttribute('aria-labelledby', 'layer-steps');
    steps.innerHTML = `<h3 id="layer-steps">${iconSvg('footprints', { size: 17 })} Steady steps</h3>`;
    const sl = el('ol', 'step-list');
    p.steps.forEach((s) => sl.appendChild(el('li', '', s)));
    steps.appendChild(sl);
    root.appendChild(steps);

    // Layer 3 — the door into conversation, carrying the situation.
    const acts = el('div', 'path-actions');
    acts.append(
      btn('Begin guided pathway', 'btn btn--primary', 'map', () => beginPathway(p)),
      btn('Talk to SOENA about this', 'btn btn--ghost', 'message-circle', () => {
        openChatWith(fill(p.greeting));
      }),
    );
    root.appendChild(acts);
  });
}

/* ------------------------------------------------------------------ */
/* View: the guided pathway — six layers, one question per screen      */
/* ------------------------------------------------------------------ */

interface Draft {
  stage?: PathOption;
  specific?: PathOption;
  feeling?: PathOption;
  impact: PathOption[];
  support?: PathOption;
  goal?: (typeof GOAL_OPTIONS)[number];
}

const LAYERS = ['Stage', 'Specifics', 'Feelings', 'Impact', 'Support', 'Goal'] as const;

function beginPathway(p: SupportPath): void {
  const draft: Draft = { impact: [] };
  stepScreen(p, draft, 0);
}

function progressBar(step: number): HTMLElement {
  const bar = el('div', 'pathway-progress');
  bar.setAttribute('role', 'progressbar');
  bar.setAttribute('aria-valuemin', '1');
  bar.setAttribute('aria-valuemax', '6');
  bar.setAttribute('aria-valuenow', String(step + 1));
  bar.setAttribute('aria-label', `Question ${step + 1} of 6 — ${LAYERS[step]}`);
  for (let i = 0; i < 6; i += 1) {
    const dot = el('span', `pathway-dot${i < step ? ' is-done' : ''}${i === step ? ' is-now' : ''}`);
    bar.appendChild(dot);
  }
  const label = el('span', 'pathway-step-label', `${step + 1} / 6 · ${LAYERS[step]}`);
  bar.appendChild(label);
  return bar;
}

function answerButton(o: PathOption, act: () => void, pressed = false): HTMLButtonElement {
  const b = el('button', 'answer-btn', o.label);
  b.type = 'button';
  if (pressed) {
    b.classList.add('is-picked');
    b.setAttribute('aria-pressed', 'true');
  }
  b.addEventListener('click', act);
  return b;
}

function stepScreen(p: SupportPath, draft: Draft, step: number): void {
  show('pathway', (root) => {
    root.appendChild(
      backLink(step === 0 ? p.title : 'back', () =>
        step === 0 ? openPath(p.id) : stepScreen(p, draft, step - 1),
      ),
    );
    root.appendChild(progressBar(step));

    const q = el('h2', 'pathway-q');
    const wrap = el('div', 'pathway-answers');

    const next = () => stepScreen(p, draft, step + 1);

    switch (step) {
      case 0: {
        q.textContent = 'Where are you in it right now?';
        p.stages.forEach((o) =>
          wrap.appendChild(answerButton(o, () => { draft.stage = o; next(); }, draft.stage?.id === o.id)),
        );
        break;
      }
      case 1: {
        q.textContent = p.specifics.question;
        p.specifics.options.forEach((o) =>
          wrap.appendChild(answerButton(o, () => { draft.specific = o; next(); }, draft.specific?.id === o.id)),
        );
        break;
      }
      case 2: {
        q.textContent = 'What is the strongest feeling right now?';
        FEELING_OPTIONS.forEach((o) =>
          wrap.appendChild(answerButton(o, () => { draft.feeling = o; next(); }, draft.feeling?.id === o.id)),
        );
        break;
      }
      case 3: {
        q.textContent = 'Which parts of life is it touching?';
        const hint = el('p', 'pathway-hint', 'Choose as many as are true — or none.');
        root.appendChild(hint);
        IMPACT_OPTIONS.forEach((o) => {
          const b = answerButton(o, () => {
            const at = draft.impact.findIndex((x) => x.id === o.id);
            if (at >= 0) draft.impact.splice(at, 1);
            else draft.impact.push(o);
            b.classList.toggle('is-picked');
            b.setAttribute('aria-pressed', b.classList.contains('is-picked') ? 'true' : 'false');
          }, draft.impact.some((x) => x.id === o.id));
          b.setAttribute('aria-pressed', draft.impact.some((x) => x.id === o.id) ? 'true' : 'false');
          wrap.appendChild(b);
        });
        break;
      }
      case 4: {
        q.textContent = 'Who knows what is happening?';
        SUPPORT_OPTIONS.forEach((o) =>
          wrap.appendChild(
            answerButton(o, () => {
              draft.support = o;
              // Safety before progress: the unsafe answer interrupts
              // the flow with the safety card, ahead of everything.
              if (o.urgent) safetyScreen(p, draft);
              else next();
            }, draft.support?.id === o.id),
          ),
        );
        break;
      }
      case 5: {
        q.textContent = 'What do you want from SOENA right now?';
        GOAL_OPTIONS.forEach((o) =>
          wrap.appendChild(
            answerButton(o, () => {
              draft.goal = o;
              finishPathway(p, draft);
            }, draft.goal?.id === o.id),
          ),
        );
        break;
      }
    }

    root.appendChild(q);
    root.appendChild(wrap);

    if (step === 3) {
      const cont = btn('Continue', 'btn btn--primary pathway-continue', 'arrow-right', next);
      root.appendChild(cont);
    }
  });
}

/** The safety card — prominent, unhurried, and honest about limits. */
function safetyScreen(p: SupportPath, draft: Draft): void {
  show('pathway', (root) => {
    const card = el('section', 'safety-card');
    card.setAttribute('role', 'alert');
    card.innerHTML = `
      <h2>${iconSvg('shield', { size: 22 })} Your safety comes first</h2>
      <p>Before any pathway, program, or plan: if you are in immediate danger,
         contact your <strong>local emergency services</strong> now.</p>
      <ul>
        <li>${iconSvg('phone', { size: 15 })} If you are being threatened, followed, or prevented from
            leaving, that is a matter for people with real-world reach — the
            authorities, or a victim-support or domestic-abuse line in your country.</li>
        <li>${iconSvg('users-round', { size: 15 })} If you can, tell one person you trust where you are
            and what is happening — one message is enough.</li>
        <li>${iconSvg('heart', { size: 15 })} SOENA is a companion, not a crisis service. It stays
            beside you before and after — but your safety needs humans first.</li>
      </ul>`;
    root.appendChild(card);
    const acts = el('div', 'path-actions');
    acts.append(
      btn('I’m safe enough to continue', 'btn btn--primary', 'arrow-right', () => stepScreen(p, draft, 5)),
      btn('Stop here for now', 'btn btn--ghost', 'x', () => openPath(p.id)),
    );
    root.appendChild(acts);
  });
}

/* ------------------------------------------------------------------ */
/* View: "Your pathway" — the summary                                  */
/* ------------------------------------------------------------------ */

function finishPathway(p: SupportPath, draft: Draft): void {
  const urgent = Boolean(draft.stage?.urgent || draft.support?.urgent);
  const answers = savePathway({
    pathId: p.id,
    stage: draft.stage?.id ?? '',
    specific: draft.specific?.id ?? '',
    feeling: draft.feeling?.id ?? '',
    impact: draft.impact.map((o) => o.id),
    support: draft.support?.id ?? '',
    goal: draft.goal?.id ?? '',
    urgent,
  });
  say('Thank you for walking that with me. Here is your pathway — and I will remember it, so you never have to retell it.', 'guiding');
  summaryScreen(p, draft, answers);
}

function summaryScreen(p: SupportPath, draft: Draft, answers: PathwayAnswers): void {
  show('pathway', (root) => {
    root.appendChild(backLink(p.title, () => openPath(p.id)));

    const head = el('header', 'path-head');
    head.innerHTML = `<h2>Your pathway</h2>
      <p class="path-who">Everything below stays on this device — and SOENA carries it into every conversation, so you never repeat yourself.</p>`;
    root.appendChild(head);

    const list = el('dl', 'summary-list');
    const row = (k: string, v: string) => {
      const dt = el('dt', '', k);
      const dd = el('dd', '', v);
      list.append(dt, dd);
    };
    row('Where you are', draft.stage?.label ?? '—');
    row(p.specifics.question, draft.specific?.label ?? '—');
    row('Strongest feeling', draft.feeling?.label ?? '—');
    row('Touching', draft.impact.length ? draft.impact.map((o) => o.label).join(', ') : 'Nothing selected');
    row('Who knows', draft.support?.label ?? '—');
    row('What you want', draft.goal?.label ?? '—');
    root.appendChild(list);

    // Urgent guidance outranks the program offer.
    if (draft.stage?.urgent && p.urgentGuidance) {
      const u = el('section', 'safety-card safety-card--urgent');
      u.innerHTML = `<h3>${iconSvg('shield', { size: 18 })} First, the urgent part</h3><p>${p.urgentGuidance}</p>`;
      root.appendChild(u);
    }
    if (draft.support?.urgent) {
      const u = el('section', 'safety-card safety-card--urgent');
      u.innerHTML = `<h3>${iconSvg('shield', { size: 18 })} Safety stays first</h3>
        <p>You said you don’t feel safe right now. Whatever else this page offers, that comes first:
        local emergency services if there is immediate danger, and one trusted person told where you are.
        The pathway and programs will keep — they can wait for you.</p>`;
      root.appendChild(u);
    }

    const closing = el('p', 'summary-closing', fill(draft.goal?.closing ?? ''));
    root.appendChild(closing);

    // The matching 7-day journey, offered right here.
    const j = journeyById(draft.goal?.journey ?? '');
    if (j) {
      const offer = el('section', 'journey-offer');
      offer.innerHTML = `
        <span class="journey-offer-glyph" aria-hidden="true">${iconSvg(j.icon, { size: 24 })}</span>
        <h3>${j.title} — a 7-day companionship program</h3>
        <p class="journey-wish">${j.wish}</p>
        <p>${j.line}</p>`;
      offer.appendChild(
        btn('Begin the 7 days', 'btn btn--primary', 'calendar', () => {
          startJourney(j.id, p.id);
          openJourney();
        }),
      );
      root.appendChild(offer);
    }

    const acts = el('div', 'path-actions');
    acts.append(
      btn('Talk to SOENA with all of this', 'btn btn--ghost', 'message-circle', () => {
        openChatWith(contextGreeting(p, answers));
      }),
    );
    root.appendChild(acts);
  });
}

/** The greeting the chat opens with after a pathway — SOENA already
 *  knows the stage, pressures, feeling and goal. Context continuity is
 *  the thing trauma-informed services get right and most apps get wrong. */
function contextGreeting(p: SupportPath, a: PathwayAnswers): string {
  const stage = p.stages.find((o) => o.id === a.stage)?.label ?? '';
  const feeling = FEELING_OPTIONS.find((o) => o.id === a.feeling)?.label ?? '';
  const goal = GOAL_OPTIONS.find((o) => o.id === a.goal);
  const name = loadProfile()?.name;
  const opening = name ? `I have your pathway, ${name}` : 'I have your pathway';
  const parts = [
    `${opening} — you never need to retell it.`,
    stage ? `You are at "${stage.toLowerCase()}",` : '',
    feeling ? `and the loudest feeling is "${feeling.toLowerCase()}".` : '',
    goal ? `You said what you want right now is to ${goal.label.toLowerCase()}.` : '',
    'So let us start exactly there. What part of it is most alive today?',
  ].filter(Boolean);
  return parts.join(' ');
}

/* ------------------------------------------------------------------ */
/* View: the 7-day journey                                             */
/* ------------------------------------------------------------------ */

export function openJourney(): void {
  const state = loadJourney();
  const j = state ? journeyById(state.journeyId) : null;
  if (!state || !j) {
    showGrid();
    return;
  }
  show('journey', (root) => {
    root.appendChild(backLink('all paths', () => showGrid()));

    const head = el('header', 'path-head journey-head');
    const doneCount = state.done.length;
    head.innerHTML = `
      <span class="path-head-glyph" aria-hidden="true">${iconSvg(j.icon, { size: 30 })}</span>
      <h2>${j.title}</h2>
      <p class="journey-wish">${j.wish}</p>
      <p class="path-who">${j.line}</p>
      <p class="journey-count">${doneCount === 7 ? 'All seven days walked.' : `Day ${doneCount + 1} of 7 awaits — days open one at a time, and your progress stays on this device.`}</p>`;
    root.appendChild(head);

    if (j.safety) {
      const s = el('p', 'path-note journey-safety');
      s.appendChild(icon('shield', { size: 15 }));
      s.appendChild(document.createTextNode(' ' + j.safety));
      root.appendChild(s);
    }

    const days = el('div', 'journey-days');
    j.days.forEach((day, i) => {
      const isDone = state.done.includes(i);
      const isOpen = dayUnlocked(state, i);
      const isNow = nextDay(state) === i;
      const card = el('article', `day-card${isDone ? ' is-done' : ''}${isNow ? ' is-now' : ''}${!isOpen ? ' is-locked' : ''}`);

      const h = el('h3', 'day-title');
      h.innerHTML = `${iconSvg(isDone ? 'check' : isOpen ? 'sun' : 'lock', { size: 16 })}
        <span class="day-n">Day ${i + 1}</span> ${day.title}`;
      card.appendChild(h);

      if (!isOpen) {
        card.appendChild(el('p', 'day-locked-note', 'Opens when the day before is done.'));
        days.appendChild(card);
        return;
      }

      const body = el('div', 'day-body');
      if (isDone && !isNow) {
        // A finished day folds to its essentials; tap to reopen.
        const reopen = btn('Revisit this day', 'btn btn--ghost btn--small', 'rotate-ccw', () => {
          card.classList.toggle('is-open');
        });
        card.appendChild(reopen);
        body.classList.add('day-body--folded');
      }
      body.innerHTML = `
        <p class="day-intent">${day.intent}</p>
        <h4>${iconSvg('footprints', { size: 14 })} Today’s practice</h4>
        <p>${day.practice}</p>
        <h4>${iconSvg('pen-line', { size: 14 })} Reflection</h4>
        <p class="day-reflect-q">${day.reflect}</p>`;

      const ta = el('textarea', 'journal-input day-reflect') as HTMLTextAreaElement;
      ta.rows = 4;
      ta.maxLength = 4000;
      ta.placeholder = 'Write here — it stays on this device…';
      ta.setAttribute('aria-label', `Reflection for day ${i + 1}`);
      ta.value = state.reflections[i] ?? '';
      ta.addEventListener('change', () => saveReflection(i, ta.value));
      body.appendChild(ta);

      const acts = el('div', 'day-actions');
      acts.append(
        btn('Check in with SOENA about today', 'btn btn--ghost', 'message-circle', () => {
          saveReflection(i, ta.value);
          openChatWith(dayGreeting(j, i));
        }),
      );
      if (!isDone) {
        acts.append(
          btn('Mark the day done', 'btn btn--primary', 'check', () => {
            saveReflection(i, ta.value);
            completeDay(i);
            const after = loadJourney();
            say(
              after && nextDay(after) === null
                ? 'Seven days, walked at your own pace. I hope you feel the difference — even one degree of it.'
                : `Day ${i + 1}, kept. Tomorrow’s door is open whenever you are.`,
              'guiding',
            );
            openJourney();
          }),
        );
      }
      body.appendChild(acts);
      card.appendChild(body);
      days.appendChild(card);
    });
    root.appendChild(days);

    // Setting a journey down is allowed — with a two-tap confirm so a
    // stray click never erases a week of reflections.
    const leave = el('button', 'btn btn--ghost journey-leave');
    leave.type = 'button';
    leave.textContent = 'Set this journey down';
    prefixIcon(leave, 'x');
    let armed = false;
    leave.addEventListener('click', () => {
      if (!armed) {
        armed = true;
        leave.textContent = 'Tap again — this clears the 7 days and reflections';
        prefixIcon(leave, 'trash-2');
        window.setTimeout(() => {
          if (!armed) return;
          armed = false;
          leave.textContent = 'Set this journey down';
          prefixIcon(leave, 'x');
        }, 4000);
        return;
      }
      leaveJourney();
      showGrid();
    });
    root.appendChild(leave);
  });
}

function dayGreeting(j: Journey, dayIx: number): string {
  const day = j.days[dayIx];
  const name = loadProfile()?.name;
  return `${name ? `${name} — day` : 'Day'} ${dayIx + 1} of ${j.title}: ${day.title.toLowerCase()}. ${day.intent} How did it actually go for you today — the unedited version?`;
}

/* ------------------------------------------------------------------ */
/* Boot                                                                */
/* ------------------------------------------------------------------ */

function showGrid(): void {
  show('grid', renderGrid);
}

/** Renders the path browser into #paths and handles deep links. */
export function initPathfinder(): void {
  const mount = document.getElementById('paths');
  if (!mount) return;
  host = mount;

  const route = () => {
    const h = window.location.hash;
    if (h === '#journey' && loadJourney()) openJourney();
    else if (h.startsWith('#p/') && pathById(h.slice(3))) openPath(h.slice(3));
    else if (h === '#toolkit') {
      showGrid();
      document.getElementById('toolkit')?.scrollIntoView();
    } else showGrid();
  };
  route();
  window.addEventListener('hashchange', route);
}

/* ------------------------------------------------------------------ */
/* The Toolkit — grounding and journaling live together here           */
/* ------------------------------------------------------------------ */

export function initToolkit(): void {
  const mount = document.getElementById('toolkit-body');
  if (!mount) return;

  // Progress — how far you have come, at a glance. Repainted whenever
  // it comes into view or the hash routes here: the pathway, journey
  // and journal all change without a page reload, and a stale
  // "nothing recorded yet" would quietly undo their encouragement.
  const prog = el('div', 'toolkit-progress');
  const paintProgress = () => {
    const pathway = loadPathway();
    const journey = loadJourney();
    const jd = journey ? journeyById(journey.journeyId) : null;
    const entries = loadJournal().length;
    const bits: string[] = [];
    if (pathway) {
      const p = pathById(pathway.pathId);
      const goal = GOAL_OPTIONS.find((g) => g.id === pathway.goal);
      if (p) bits.push(`You walked the pathway for “${p.title}”${goal ? ` and chose to ${goal.label.toLowerCase()}` : ''}.`);
    }
    if (journey && jd) {
      const n = journey.done.length;
      bits.push(n === 7 ? `You completed all seven days of ${jd.title}.` : `You are ${n} day${n === 1 ? '' : 's'} into ${jd.title}.`);
    }
    if (entries) bits.push(`${entries} journal entr${entries === 1 ? 'y' : 'ies'} kept — yours to reread any time.`);
    if (!bits.length) bits.push('Nothing recorded yet — everything you do here will quietly gather, so you can see how far you have come.');
    prog.innerHTML = `<h3>${iconSvg('sprout', { size: 17 })} How far you’ve come</h3>`;
    bits.forEach((b) => prog.appendChild(el('p', 'toolkit-line', b)));
    if (journey && jd && journey.done.length < 7) {
      prog.appendChild(btn('Continue the journey', 'btn btn--primary', 'calendar', () => {
        window.location.hash = '#journey';
      }));
    }
  };
  paintProgress();
  new IntersectionObserver((entries2) => {
    if (entries2.some((e) => e.isIntersecting)) paintProgress();
  }).observe(prog);
  window.addEventListener('hashchange', () => {
    if (window.location.hash === '#toolkit') paintProgress();
  });
  mount.appendChild(prog);

  // Grounding — the shared breath, unchanged from the avenues.
  const ground = el('div', 'toolkit-block');
  ground.innerHTML = `<h3>${iconSvg('wind', { size: 17 })} Grounding</h3>
    <p class="toolkit-line">A slow round of breathing, whenever the noise rises. In for four, out for six.</p>`;
  ground.appendChild(renderBreath());
  mount.appendChild(ground);

  // Journaling — same journal as everywhere; one store, many doors.
  const journal = el('div', 'toolkit-block');
  journal.innerHTML = `<h3>${iconSvg('notebook-pen', { size: 17 })} Journal</h3>
    <p class="toolkit-line">Write and reread your notes — they never leave this device.</p>`;
  journal.appendChild(renderJournal('toolkit'));
  mount.appendChild(journal);
}
