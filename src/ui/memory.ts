/**
 * The memory door: a full, honest view of everything SOENA holds, all of it
 * editable and erasable. Trust in a companion that remembers you begins
 * with being able to see exactly what it remembers.
 */
import {
  INTENTIONS,
  PRONOUN_PRESETS,
  eraseAllMemory,
  loadProfile,
  saveProfile,
} from '../core/profile';
import { ORIENTATIONS } from '../data/orientations';
import { COMPANION_FORMS } from '../data/companion-config';
import { loadJournal } from './journal';
import { speakErased, speakMemoryOpened } from '../companion/dialogue';

export function openMemoryPanel(): void {
  const root = document.getElementById('overlay-root');
  if (!root || root.querySelector('.memory-panel')) return;

  const p = loadProfile();
  const overlay = document.createElement('div');
  overlay.className = 'threshold memory-panel';
  overlay.setAttribute('role', 'dialog');
  overlay.setAttribute('aria-modal', 'true');
  overlay.setAttribute('aria-label', 'What SOENA remembers');

  const close = () => {
    overlay.classList.add('is-leaving');
    window.setTimeout(() => overlay.remove(), 500);
  };

  const panel = document.createElement('div');
  panel.className = 'threshold-panel memory-sheet';

  if (!p) {
    panel.innerHTML = `
      <h2 tabindex="-1">I hold nothing.</h2>
      <p>You entered quietly, so I kept no memory. If you would like me to remember you,
      reload the page and step through the door again — or keep walking unremembered.
      Both are welcome.</p>`;
    const actions = document.createElement('div');
    actions.className = 'threshold-actions';
    actions.appendChild(button('Close', 'primary', close));
    panel.appendChild(actions);
  } else {
    const journalCount = loadJournal().length;
    panel.innerHTML = `
      <h2 tabindex="-1">What I remember</h2>
      <p class="memory-note">All of this lives in this browser's local storage — nowhere else.
      Change anything; I will speak accordingly.</p>`;

    // Name
    panel.appendChild(field('Your name', () => {
      const input = document.createElement('input');
      input.className = 'threshold-input';
      input.type = 'text';
      input.maxLength = 40;
      input.value = p.name;
      input.addEventListener('change', () => {
        p.name = input.value.trim() || 'traveller';
        saveProfile(p);
      });
      return input;
    }));

    // Pronouns
    panel.appendChild(field('Your pronouns', () => {
      const select = document.createElement('select');
      select.className = 'threshold-input';
      const opts = [...PRONOUN_PRESETS.map((s) => s.label), 'just my name'];
      const current = p.pronouns?.label ?? 'just my name';
      if (p.pronouns && !opts.includes(p.pronouns.label)) opts.unshift(p.pronouns.label);
      for (const label of opts) {
        const o = document.createElement('option');
        o.value = label;
        o.textContent = label;
        o.selected = label === current;
        select.appendChild(o);
      }
      select.addEventListener('change', () => {
        p.pronouns =
          select.value === 'just my name'
            ? null
            : PRONOUN_PRESETS.find((s) => s.label === select.value) ?? p.pronouns;
        saveProfile(p);
      });
      return select;
    }));

    // Form
    panel.appendChild(field('The shape I wear', () => {
      const select = document.createElement('select');
      select.className = 'threshold-input';
      for (const f of COMPANION_FORMS) {
        const opt = document.createElement('option');
        opt.value = f.id;
        opt.textContent = f.label;
        opt.selected = f.id === (p.form ?? 'orb');
        select.appendChild(opt);
      }
      select.addEventListener('change', () => {
        p.form = select.value;
        saveProfile(p);
      });
      return select;
    }));

    // Orientation
    panel.appendChild(field('The lean of your path', () => {
      const select = document.createElement('select');
      select.className = 'threshold-input';
      for (const o of ORIENTATIONS) {
        const opt = document.createElement('option');
        opt.value = o.id;
        opt.textContent = o.label;
        opt.selected = o.id === p.orientation;
        select.appendChild(opt);
      }
      select.addEventListener('change', () => {
        p.orientation = select.value;
        saveProfile(p);
      });
      return select;
    }));

    // Intentions
    panel.appendChild(field('What you came seeking', () => {
      const wrap = document.createElement('div');
      wrap.className = 'chips';
      for (const it of INTENTIONS) {
        const b = button(it.label, 'chip', () => {
          const i = p.intentions.indexOf(it.id);
          if (i >= 0) p.intentions.splice(i, 1);
          else p.intentions.push(it.id);
          b.setAttribute('aria-pressed', String(i < 0));
          saveProfile(p);
        });
        b.setAttribute('aria-pressed', String(p.intentions.includes(it.id)));
        wrap.appendChild(b);
      }
      return wrap;
    }));

    // Keepsakes
    panel.appendChild(field('Keepsakes — things you asked me to hold', () => {
      const wrap = document.createElement('div');
      const list = document.createElement('ul');
      list.className = 'keepsakes';
      const renderList = () => {
        list.replaceChildren(
          ...p.keepsakes.map((k, i) => {
            const li = document.createElement('li');
            const span = document.createElement('span');
            span.textContent = k;
            const del = button('release', 'ghost', () => {
              p.keepsakes.splice(i, 1);
              saveProfile(p);
              renderList();
            });
            li.append(span, del);
            return li;
          }),
        );
      };
      renderList();
      const row = document.createElement('div');
      row.className = 'custom-row';
      const input = document.createElement('input');
      input.className = 'threshold-input';
      input.type = 'text';
      input.maxLength = 140;
      input.placeholder = 'e.g. “my grandmother’s river”, “the exam in May”';
      const add = button('keep', 'primary', () => {
        const v = input.value.trim();
        if (!v) return;
        p.keepsakes.push(v);
        input.value = '';
        saveProfile(p);
        renderList();
      });
      row.append(input, add);
      wrap.append(list, row);
      return wrap;
    }));

    // Trace
    const trace = document.createElement('p');
    trace.className = 'memory-trace';
    trace.textContent = `Walked together ${p.visits} ${p.visits === 1 ? 'time' : 'times'} since ${new Date(p.createdAt).toLocaleDateString()}. ${journalCount} ${journalCount === 1 ? 'testimony' : 'testimonies'} kept.`;
    panel.appendChild(trace);

    const actions = document.createElement('div');
    actions.className = 'threshold-actions';
    const erase = button('Erase everything I know', 'danger', () => {
      if (erase.dataset.confirm !== '1') {
        erase.dataset.confirm = '1';
        erase.textContent = 'Are you certain? This forgets it all.';
        return;
      }
      eraseAllMemory();
      speakErased();
      close();
    });
    actions.append(button('Close', 'primary', close), erase);
    panel.appendChild(actions);
  }

  overlay.appendChild(panel);
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) close();
  });
  overlay.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') close();
  });
  root.appendChild(overlay);
  (panel.querySelector('h2') as HTMLElement | null)?.focus();
  speakMemoryOpened();
}

function field(label: string, build: () => HTMLElement): HTMLElement {
  const wrap = document.createElement('div');
  wrap.className = 'memory-field';
  const l = document.createElement('label');
  l.textContent = label;
  wrap.append(l, build());
  return wrap;
}

function button(label: string, kind: 'primary' | 'ghost' | 'chip' | 'danger', onClick: () => void): HTMLButtonElement {
  const b = document.createElement('button');
  b.type = 'button';
  b.className = `btn btn--${kind}`;
  b.textContent = label;
  b.addEventListener('click', onClick);
  return b;
}
