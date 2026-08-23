/**
 * The reaching place — SOENA's contact experience.
 *
 * The pattern (learned from studying LISA): replace the static inquiry
 * form with a short scripted conversation, companion-led, one question at
 * a time. All copy is SOENA's own. There is no backend: the flow composes
 * a letter the visitor sends through their own mail app or clipboard, so
 * nothing is transmitted until they choose to send it themselves.
 */
import { emit } from '../core/bus';
import { fill, loadProfile } from '../core/profile';
import { say } from '../companion/dialogue';
import { prefixIcon, setLabel, type IconName } from './icons';

/** Where letters go. Change this when SOENA has a real inbox. */
const CONTACT_EMAIL = 'hello@soena.example';

interface Branch {
  id: string;
  chip: string;
  subject: string;
  ask: string;
  placeholder: string;
}

const BRANCHES: Branch[] = [
  {
    id: 'walk',
    chip: 'I want to walk with SOENA',
    subject: 'Walking with SOENA',
    ask: 'Tell me a little about the path you are on — whatever you would tell a companion at the door.',
    placeholder: 'Where are you walking from, and what are you hoping to find?',
  },
  {
    id: 'testimony',
    chip: 'I have a testimony to share',
    subject: 'A testimony for the wall',
    ask: 'Set it down in your own words. If it is chosen for the wall of voices, it will appear anonymous, and only with your consent.',
    placeholder: 'This happened, and it mattered…',
  },
  {
    id: 'build',
    chip: 'I want to help build this',
    subject: 'Building alongside SOENA',
    ask: 'Builder, writer, guide, funder, critic — every kind of hand is welcome at a door. What would you bring?',
    placeholder: 'What I could bring to SOENA…',
  },
  {
    id: 'else',
    chip: 'Something else',
    subject: 'A knock at the door',
    ask: 'Then simply say it as it is. Unpolished is welcome here.',
    placeholder: 'Hello…',
  },
];

export function renderReach(mount: HTMLElement): void {
  const profile = loadProfile();
  let branch: Branch | null = null;

  const step0 = section();
  const q0 = heading('What brings you to the door today?');
  const chips = document.createElement('div');
  chips.className = 'chips';
  const BRANCH_ICON: Record<string, IconName> = {
    walk: 'route',
    testimony: 'feather',
    build: 'sparkles',
    else: 'message-circle',
  };
  BRANCHES.forEach((b) => {
    const c = button(b.chip, 'chip', () => {
      branch = b;
      chips.querySelectorAll('button').forEach((x) => x.setAttribute('aria-pressed', String(x === c)));
      showStep1();
    });
    c.setAttribute('aria-pressed', 'false');
    prefixIcon(c, BRANCH_ICON[b.id] ?? 'message-circle');
    chips.appendChild(c);
  });
  step0.append(q0, chips);
  mount.appendChild(step0);

  const step1 = section();
  step1.hidden = true;
  mount.appendChild(step1);

  const step2 = section();
  step2.hidden = true;
  mount.appendChild(step2);

  function showStep1(): void {
    if (!branch) return;
    say(branch.ask, 'guiding');
    // A new branch retires any letter already folded from the old one.
    step2.hidden = true;
    step2.replaceChildren();
    step1.hidden = false;
    step1.replaceChildren();

    const ask = document.createElement('p');
    ask.className = 'reach-ask';
    ask.textContent = branch.ask;

    const nameField = fieldRow('Your name', 'text', profile?.name ?? '', 'how shall we address you?');
    const fromField = fieldRow('A way to reach you', 'email', '', 'you@somewhere.earth');
    const message = document.createElement('textarea');
    message.className = 'journal-input';
    message.rows = 6;
    message.maxLength = 6000;
    message.placeholder = branch.placeholder;
    message.setAttribute('aria-label', 'Your message');

    const go = button('Fold the letter', 'primary', () => {
      const name = (nameField.querySelector('input') as HTMLInputElement).value.trim() || 'a traveller';
      const from = (fromField.querySelector('input') as HTMLInputElement).value.trim();
      const body = message.value.trim();
      if (!body) {
        say('The page is still blank, {name}. Even one sentence is enough.', 'guiding');
        message.focus();
        return;
      }
      showStep2(name, from, body);
    });
    prefixIcon(go, 'arrow-right');

    step1.append(ask, nameField, fromField, message, go);
    step1.scrollIntoView({ behavior: 'smooth', block: 'center' });
    emit('soena:pulse', { strength: 0.8 });
  }

  function showStep2(name: string, from: string, body: string): void {
    if (!branch) return;
    step2.hidden = false;
    step2.replaceChildren();

    const intro = heading('Here is your letter, as I will carry it.');

    const letter = document.createElement('blockquote');
    letter.className = 'reach-letter';
    const lines = [
      `To SOENA — ${branch.subject}`,
      '',
      body,
      '',
      `— ${name}${from ? ` (${from})` : ''}`,
    ].join('\n');
    letter.textContent = lines;

    const actions = document.createElement('div');
    actions.className = 'threshold-actions';

    const mailto = document.createElement('a');
    mailto.className = 'btn btn--primary has-icon';
    mailto.href = `mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent(branch.subject)}&body=${encodeURIComponent(lines)}`;
    mailto.textContent = 'Send with your mail app';
    prefixIcon(mailto, 'mail');

    const copy = button('Copy the letter', 'ghost', async () => {
      try {
        await navigator.clipboard.writeText(lines);
        setLabel(copy, 'Copied — safe travels');
      } catch {
        setLabel(copy, 'Select and copy it above');
      }
    });
    prefixIcon(copy, 'copy');

    actions.append(mailto, copy);

    const note = document.createElement('p');
    note.className = 'reach-note';
    note.textContent =
      'Nothing has been sent yet, and nothing leaves this page until you send it yourself. That is the arrangement here: your words travel only by your hand.';

    step2.append(intro, letter, actions, note);
    step2.scrollIntoView({ behavior: 'smooth', block: 'center' });
    say(fill('It is a good letter, {name}. Send it when {they} {are} ready — there is no hurry at this door.'), 'speaking');
  }
}

/* small builders ------------------------------------------------- */

function section(): HTMLElement {
  const el = document.createElement('div');
  el.className = 'reach-step';
  return el;
}

function heading(text: string): HTMLElement {
  const h = document.createElement('h2');
  h.className = 'reach-q';
  h.textContent = text;
  return h;
}

let fieldSeq = 0;

function fieldRow(label: string, type: string, value: string, placeholder: string): HTMLElement {
  const wrap = document.createElement('div');
  wrap.className = 'memory-field';
  const input = document.createElement('input');
  input.className = 'threshold-input';
  input.id = `reach-field-${++fieldSeq}`;
  input.type = type;
  input.value = value;
  input.placeholder = placeholder;
  input.maxLength = 120;
  // Without htmlFor the label is decoration: no accessible name, and
  // clicking the words would not focus the field.
  const l = document.createElement('label');
  l.textContent = label;
  l.htmlFor = input.id;
  wrap.append(l, input);
  return wrap;
}

function button(label: string, kind: 'primary' | 'ghost' | 'chip', onClick: () => void): HTMLButtonElement {
  const b = document.createElement('button');
  b.type = 'button';
  b.className = `btn btn--${kind}`;
  b.textContent = label;
  b.addEventListener('click', onClick);
  return b;
}
