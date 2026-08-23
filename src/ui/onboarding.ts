/**
 * The Threshold — SOENA's onboarding ritual.
 *
 * A short, skippable conversation at the door where the companion learns a
 * name, pronouns, the lean of a path, and what the person came seeking.
 * Everything is optional; "Enter quietly" is always visible. Consent is
 * stated in plain words before anything is kept.
 */
import { emit } from '../core/bus';
import {
  INTENTIONS,
  PRONOUN_PRESETS,
  type PronounSet,
  type Tone,
  createProfile,
} from '../core/profile';
import { ORIENTATIONS } from '../data/orientations';
import { COMPANION_FORMS } from '../data/companion-config';
import { prefixIcon, type IconName } from './icons';

interface Draft {
  name: string;
  pronouns: PronounSet | null;
  orientation: string;
  intentions: string[];
  tone: Tone;
  form: string;
}

export function runOnboarding(onDone: (entered: boolean) => void): void {
  const root = document.getElementById('overlay-root');
  if (!root) return onDone(false);

  const draft: Draft = { name: '', pronouns: PRONOUN_PRESETS[2], orientation: 'seeking', intentions: [], tone: 'gentle', form: 'orb' };
  let step = 0;

  const overlay = document.createElement('div');
  overlay.className = 'threshold';
  overlay.setAttribute('role', 'dialog');
  overlay.setAttribute('aria-modal', 'true');
  overlay.setAttribute('aria-label', 'SOENA is greeting you');
  root.appendChild(overlay);

  const finish = (save: boolean) => {
    if (save) {
      createProfile({
        name: draft.name.trim() || 'traveller',
        pronouns: draft.pronouns,
        orientation: draft.orientation,
        intentions: draft.intentions,
        tone: draft.tone,
        keepsakes: [],
        voiceOn: false,
        form: draft.form,
      });
    }
    overlay.classList.add('is-leaving');
    window.setTimeout(() => {
      overlay.remove();
      onDone(save);
    }, 650);
  };

  const steps: Array<() => HTMLElement> = [
    // 0 — the door
    () =>
      panel(
        'I am SOENA.',
        'A companion at the door. I walk beside journeys of every kind — with gods, without them, through philosophy, psyche, feeling, earth, or honest not-knowing. May I learn how to walk beside yours?',
        [
          btn('Yes — let us begin', 'primary', () => next(), 'arrow-right'),
          btn('Enter quietly', 'ghost', () => finish(false), 'door-open'),
        ],
      ),
    // 1 — name
    () => {
      const p = panel('What may I call you?', 'A name, a nickname, anything that feels like yours. I will keep it only on this device.', []);
      const input = document.createElement('input');
      input.type = 'text';
      input.maxLength = 40;
      input.placeholder = 'your name';
      input.setAttribute('autocomplete', 'nickname');
      input.className = 'threshold-input';
      input.value = draft.name;
      input.addEventListener('input', () => (draft.name = input.value));
      input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') next();
      });
      p.insertBefore(input, p.querySelector('.threshold-actions'));
      p.querySelector('.threshold-actions')!.append(
        btn('Continue', 'primary', () => next(), 'arrow-right'),
        btn('Skip', 'ghost', () => next(), 'chevron-right'),
      );
      queueMicrotask(() => input.focus());
      return p;
    },
    // 2 — pronouns
    () => {
      const p = panel('Which words should carry you?', 'So that when I speak of you, I speak truly.', []);
      const wrap = document.createElement('div');
      wrap.className = 'chips';
      const options: Array<{ label: string; value: PronounSet | null }> = [
        ...PRONOUN_PRESETS.map((set) => ({ label: set.label, value: set as PronounSet | null })),
        { label: 'just my name', value: null },
      ];
      const buttons: HTMLButtonElement[] = [];
      const refresh = () => {
        buttons.forEach((b, i) => {
          const selected =
            (options[i].value === null && draft.pronouns === null) ||
            (options[i].value !== null && draft.pronouns?.label === options[i].value!.label);
          b.setAttribute('aria-pressed', String(selected));
        });
      };
      options.forEach((opt, i) => {
        const b = btn(opt.label, 'chip', () => {
          draft.pronouns = opt.value;
          refresh();
        });
        buttons[i] = b;
        wrap.appendChild(b);
      });

      // Custom set: three words are enough; the rest is derived.
      const custom = document.createElement('details');
      custom.className = 'threshold-custom';
      custom.innerHTML = `<summary>my own words</summary>`;
      const row = document.createElement('div');
      row.className = 'custom-row';
      const fields = ['they', 'them', 'their'].map((ph) => {
        const f = document.createElement('input');
        f.type = 'text';
        f.maxLength = 16;
        f.placeholder = ph;
        f.className = 'threshold-input small';
        row.appendChild(f);
        return f;
      });
      const apply = () => {
        const [su, ob, po] = fields.map((f) => f.value.trim().toLowerCase());
        if (su && ob && po) {
          draft.pronouns = {
            label: `${su}/${ob}`,
            subject: su,
            object: ob,
            possessive: po,
            possessiveStandalone: po.endsWith('s') ? po : `${po}s`,
            reflexive: `${ob}self`,
            plural: su === 'they',
          };
          refresh();
        }
      };
      fields.forEach((f) => f.addEventListener('input', apply));
      custom.appendChild(row);

      p.insertBefore(wrap, p.querySelector('.threshold-actions'));
      p.insertBefore(custom, p.querySelector('.threshold-actions'));
      p.querySelector('.threshold-actions')!.append(btn('Continue', 'primary', () => next(), 'arrow-right'));
      refresh();
      return p;
    },
    // 3 — orientation
    () => {
      const p = panel('Which way does your path lean?', 'There is no right answer, and you may change it any time. The door is the same width for everyone.', []);
      const grid = document.createElement('div');
      grid.className = 'orient-grid';
      const cards: HTMLButtonElement[] = [];
      ORIENTATIONS.forEach((o, i) => {
        const c = document.createElement('button');
        c.type = 'button';
        c.className = 'orient-card';
        c.innerHTML = `<strong>${o.label}</strong><span>${o.essence}</span>`;
        c.addEventListener('click', () => {
          draft.orientation = o.id;
          cards.forEach((x) => x.setAttribute('aria-pressed', 'false'));
          c.setAttribute('aria-pressed', 'true');
        });
        c.setAttribute('aria-pressed', String(o.id === draft.orientation));
        cards[i] = c;
        grid.appendChild(c);
      });
      p.insertBefore(grid, p.querySelector('.threshold-actions'));
      p.querySelector('.threshold-actions')!.append(btn('Continue', 'primary', () => next(), 'arrow-right'));
      return p;
    },
    // 4 — intentions
    () => {
      const p = panel('What draws you here, now?', 'Choose any that ring true — or none.', []);
      const wrap = document.createElement('div');
      wrap.className = 'chips';
      INTENTIONS.forEach((it) => {
        const b = btn(it.label, 'chip', () => {
          const i = draft.intentions.indexOf(it.id);
          if (i >= 0) draft.intentions.splice(i, 1);
          else draft.intentions.push(it.id);
          b.setAttribute('aria-pressed', String(i < 0));
        });
        b.setAttribute('aria-pressed', 'false');
        wrap.appendChild(b);
      });
      p.insertBefore(wrap, p.querySelector('.threshold-actions'));
      p.querySelector('.threshold-actions')!.append(btn('Continue', 'primary', () => next(), 'arrow-right'));
      return p;
    },
    // 5 — form
    () => {
      const p = panel('What shape should I wear?', 'A body for walking beside you. You can change it any time through the memory door.', []);
      const wrap = document.createElement('div');
      wrap.className = 'chips';
      COMPANION_FORMS.forEach((f) => {
        const b = btn(f.label, 'chip', () => {
          draft.form = f.id;
          wrap.querySelectorAll('button').forEach((x) => x.setAttribute('aria-pressed', 'false'));
          b.setAttribute('aria-pressed', 'true');
        });
        b.setAttribute('aria-pressed', String(f.id === draft.form));
        wrap.appendChild(b);
      });
      p.insertBefore(wrap, p.querySelector('.threshold-actions'));
      p.querySelector('.threshold-actions')!.append(btn('Continue', 'primary', () => next(), 'arrow-right'));
      return p;
    },
    // 6 — tone + consent
    () => {
      const p = panel(
        'How shall I speak with you?',
        'One last thing — and my promise: what you have told me stays in this browser, on this device. No account, no server, no one else. You can see it, change it, or erase it at any time through the “memory” door above.',
        [],
      );
      const wrap = document.createElement('div');
      wrap.className = 'chips';
      (
        [
          ['gentle', 'gently'],
          ['plain', 'plainly'],
          ['poetic', 'a little poetically'],
        ] as Array<[Tone, string]>
      ).forEach(([tone, label]) => {
        const b = btn(label, 'chip', () => {
          draft.tone = tone;
          wrap.querySelectorAll('button').forEach((x) => x.setAttribute('aria-pressed', 'false'));
          b.setAttribute('aria-pressed', 'true');
        });
        b.setAttribute('aria-pressed', String(tone === draft.tone));
        wrap.appendChild(b);
      });
      p.insertBefore(wrap, p.querySelector('.threshold-actions'));
      p.querySelector('.threshold-actions')!.append(
        btn('Open the door', 'primary', () => finish(true), 'door-open'),
        btn('Enter without being remembered', 'ghost', () => finish(false), 'x'),
      );
      return p;
    },
  ];

  function next(): void {
    step += 1;
    if (step >= steps.length) return finish(true);
    render();
  }

  function render(): void {
    overlay.replaceChildren(steps[step]());
    emit('soena:pulse', { strength: 0.8 });
    const heading = overlay.querySelector('h2');
    if (heading) (heading as HTMLElement).focus?.();
  }

  render();
}

function panel(title: string, body: string, actions: HTMLElement[]): HTMLElement {
  const el = document.createElement('div');
  el.className = 'threshold-panel';
  const h = document.createElement('h2');
  h.tabIndex = -1;
  h.textContent = title;
  const p = document.createElement('p');
  p.textContent = body;
  const act = document.createElement('div');
  act.className = 'threshold-actions';
  act.append(...actions);
  el.append(h, p, act);
  return el;
}

function btn(
  label: string,
  kind: 'primary' | 'ghost' | 'chip',
  onClick: () => void,
  glyph?: IconName,
): HTMLButtonElement {
  const b = document.createElement('button');
  b.type = 'button';
  b.className = `btn btn--${kind}`;
  b.textContent = label;
  if (glyph) prefixIcon(b, glyph);
  b.addEventListener('click', onClick);
  return b;
}
