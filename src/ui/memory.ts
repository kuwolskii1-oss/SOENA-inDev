/**
 * The memory door: a full, honest view of everything SOENA holds.
 *
 * Edits collect in a draft and commit only when the person presses
 * Apply — Cancel walks away leaving memory untouched. Trust in a
 * companion that remembers you begins with control over the remembering.
 *
 * The panel has two tabs: what SOENA remembers, and Developer options —
 * a demo drawer where the whole site's palette can be swapped live.
 */
import {
  INTENTIONS,
  PRONOUN_PRESETS,
  type Profile,
  eraseAllMemory,
  loadProfile,
  saveProfile,
} from '../core/profile';
import { ORIENTATIONS } from '../data/orientations';
import { COMPANION_FORMS } from '../data/companion-config';
import { loadJournal } from './journal';
import { say, speakErased, speakMemoryOpened } from '../companion/dialogue';
import { prefixIcon, setLabel, type IconName } from './icons';
import { FROST_LEVELS, PALETTES, applyFrost, applyPalette, currentFrost, currentPalette } from './palette';

export function openMemoryPanel(): void {
  const root = document.getElementById('overlay-root');
  if (!root || root.querySelector('.memory-panel')) return;

  // Who opened the door: focus returns to them when it shuts (cf.
  // drawer.ts). Only a real trigger gets aria-expanded — when the panel
  // is opened from a chat command the active element is <body>, which
  // must not be labelled as an expanded control.
  const active = document.activeElement as HTMLElement | null;
  const opener = active && active !== document.body ? active : null;
  if (opener?.hasAttribute('aria-haspopup')) opener.setAttribute('aria-expanded', 'true');

  const p = loadProfile();
  const overlay = document.createElement('div');
  overlay.className = 'threshold memory-panel';
  overlay.setAttribute('role', 'dialog');
  overlay.setAttribute('aria-modal', 'true');
  overlay.setAttribute('aria-label', 'What SOENA remembers');
  // Wheel inside the panel must scroll the panel, not the Lenis page.
  overlay.setAttribute('data-lenis-prevent', '');

  const onDocKey = (e: KeyboardEvent) => {
    if (e.key === 'Escape') close();
  };

  const close = () => {
    document.removeEventListener('keydown', onDocKey);
    overlay.classList.add('is-leaving');
    if (opener?.hasAttribute('aria-haspopup')) opener.setAttribute('aria-expanded', 'false');
    // Focus would otherwise land on <body> and a keyboard user would
    // restart tabbing from the top of the document. Backdrop-clicks blur
    // to <body> before close() runs, so accept that as "still ours".
    const held = document.activeElement;
    if (!held || held === document.body || overlay.contains(held)) opener?.focus?.();
    window.setTimeout(() => overlay.remove(), 500);
  };

  const panel = document.createElement('div');
  panel.className = 'threshold-panel memory-sheet';

  // Two tabs: memory, and the developer drawer.
  const tablist = document.createElement('div');
  tablist.className = 'panel-tabs';
  tablist.setAttribute('role', 'tablist');
  tablist.setAttribute('aria-label', 'Panel sections');
  const memPane = document.createElement('div');
  memPane.id = 'memory-pane';
  memPane.setAttribute('role', 'tabpanel');
  memPane.setAttribute('aria-labelledby', 'memory-tab');
  memPane.setAttribute('tabindex', '0');
  const devPane = document.createElement('div');
  devPane.id = 'developer-pane';
  devPane.setAttribute('role', 'tabpanel');
  devPane.setAttribute('aria-labelledby', 'developer-tab');
  devPane.setAttribute('tabindex', '0');
  devPane.hidden = true;
  const tabButtons: HTMLButtonElement[] = [];
  const showTab = (which: 'memory' | 'developer') => {
    const isDev = which === 'developer';
    memPane.hidden = isDev;
    devPane.hidden = !isDev;
    // Apply/Cancel/Erase act on memory: hide them while the developer
    // drawer is open (its palette switch commits on the spot).
    panel.classList.toggle('is-dev', isDev);
    for (const b of tabButtons) {
      const on = b.dataset.tab === which;
      b.setAttribute('aria-selected', String(on));
      b.tabIndex = on ? 0 : -1;
    }
  };
  for (const [id, label, glyph] of [
    ['memory', 'What I remember', 'brain'],
    ['developer', 'Developer options', 'sparkles'],
  ] as const) {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'panel-tab';
    b.dataset.tab = id;
    b.id = `${id}-tab`;
    b.setAttribute('role', 'tab');
    b.setAttribute('aria-controls', `${id}-pane`);
    b.textContent = label;
    prefixIcon(b, glyph);
    b.addEventListener('click', () => showTab(id));
    b.addEventListener('keydown', (e) => {
      if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return;
      e.preventDefault();
      const next = tabButtons[(tabButtons.indexOf(b) + (e.key === 'ArrowRight' ? 1 : -1) + tabButtons.length) % tabButtons.length];
      showTab(next.dataset.tab as 'memory' | 'developer');
      next.focus();
    });
    tabButtons.push(b);
    tablist.appendChild(b);
  }
  showTab('memory');
  panel.append(tablist, memPane, devPane);

  if (!p) {
    memPane.innerHTML = `
      <h2 tabindex="-1">I hold nothing.</h2>
      <p>You entered quietly, so I kept no memory. If you would like me to remember you,
      reload the page and step through the door again — or keep walking unremembered.
      Both are welcome.</p>`;
    const actions = document.createElement('div');
    actions.className = 'threshold-actions';
    actions.appendChild(button('Close', 'primary', close, 'x'));
    panel.appendChild(actions);
  } else {
    // All edits land here; nothing touches real memory until Apply.
    const draft: Profile = {
      ...p,
      pronouns: p.pronouns,
      intentions: [...p.intentions],
      keepsakes: [...p.keepsakes],
    };

    const journalCount = loadJournal().length;
    memPane.innerHTML = `
      <h2 tabindex="-1">What I remember</h2>
      <p class="memory-note">All of this lives in this browser's local storage — nowhere else.
      Change anything, then press Apply; Cancel leaves my memory as it was.</p>`;

    // Name
    memPane.appendChild(field('Your name', 'user', () => {
      const input = document.createElement('input');
      input.className = 'threshold-input';
      input.type = 'text';
      input.maxLength = 40;
      input.value = draft.name;
      input.addEventListener('input', () => {
        draft.name = input.value.trim() || 'traveller';
      });
      return input;
    }));

    // Pronouns
    memPane.appendChild(field('Your pronouns', 'message-circle', () => {
      const select = document.createElement('select');
      select.className = 'threshold-input';
      const opts = [...PRONOUN_PRESETS.map((s) => s.label), 'just my name'];
      const current = draft.pronouns?.label ?? 'just my name';
      if (draft.pronouns && !opts.includes(draft.pronouns.label)) opts.unshift(draft.pronouns.label);
      for (const label of opts) {
        const o = document.createElement('option');
        o.value = label;
        o.textContent = label;
        o.selected = label === current;
        select.appendChild(o);
      }
      select.addEventListener('change', () => {
        draft.pronouns =
          select.value === 'just my name'
            ? null
            : PRONOUN_PRESETS.find((s) => s.label === select.value) ?? draft.pronouns;
      });
      return select;
    }));

    // Form
    memPane.appendChild(field('The shape I wear', 'sparkles', () => {
      const select = document.createElement('select');
      select.className = 'threshold-input';
      for (const f of COMPANION_FORMS) {
        const opt = document.createElement('option');
        opt.value = f.id;
        opt.textContent = f.label;
        opt.selected = f.id === (draft.form ?? 'orb');
        select.appendChild(opt);
      }
      select.addEventListener('change', () => {
        draft.form = select.value;
      });
      return select;
    }));

    // Orientation
    memPane.appendChild(field('The lean of your path', 'compass', () => {
      const select = document.createElement('select');
      select.className = 'threshold-input';
      for (const o of ORIENTATIONS) {
        const opt = document.createElement('option');
        opt.value = o.id;
        opt.textContent = o.label;
        opt.selected = o.id === draft.orientation;
        select.appendChild(opt);
      }
      select.addEventListener('change', () => {
        draft.orientation = select.value;
      });
      return select;
    }));

    // Intentions
    memPane.appendChild(field('What you came seeking', 'target', () => {
      const wrap = document.createElement('div');
      wrap.className = 'chips';
      for (const it of INTENTIONS) {
        const b = button(it.label, 'chip', () => {
          const i = draft.intentions.indexOf(it.id);
          if (i >= 0) draft.intentions.splice(i, 1);
          else draft.intentions.push(it.id);
          b.setAttribute('aria-pressed', String(i < 0));
        });
        b.setAttribute('aria-pressed', String(draft.intentions.includes(it.id)));
        wrap.appendChild(b);
      }
      return wrap;
    }));

    // Keepsakes
    memPane.appendChild(field('Keepsakes — things you asked me to hold', 'gem', () => {
      const wrap = document.createElement('div');
      const list = document.createElement('ul');
      list.className = 'keepsakes';
      const renderList = () => {
        list.replaceChildren(
          ...draft.keepsakes.map((k, i) => {
            const li = document.createElement('li');
            const span = document.createElement('span');
            span.textContent = k;
            const del = button('release', 'ghost', () => {
              draft.keepsakes.splice(i, 1);
              renderList();
            }, 'x');
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
        draft.keepsakes.push(v);
        input.value = '';
        renderList();
      }, 'plus');
      row.append(input, add);
      wrap.append(list, row);
      return wrap;
    }));

    // Trace
    const trace = document.createElement('p');
    trace.className = 'memory-trace';
    trace.textContent = `Walked together ${p.visits} ${p.visits === 1 ? 'time' : 'times'} since ${new Date(p.createdAt).toLocaleDateString()}. ${journalCount} ${journalCount === 1 ? 'testimony' : 'testimonies'} kept.`;
    memPane.appendChild(trace);

    const actions = document.createElement('div');
    actions.className = 'threshold-actions';

    const apply = button('Apply', 'primary', () => {
      Object.assign(p, draft);
      saveProfile(p);
      say('Applied. I will speak accordingly, {name}.', 'guiding');
      close();
    }, 'check');
    apply.id = 'memory-apply';

    const cancel = button('Cancel', 'ghost', close, 'x');

    const erase = button('Erase everything I know', 'danger', () => {
      if (erase.dataset.confirm !== '1') {
        erase.dataset.confirm = '1';
        setLabel(erase, 'Are you certain? This forgets it all.');
        return;
      }
      eraseAllMemory();
      speakErased();
      close();
    }, 'trash-2');

    actions.append(apply, cancel, erase);
    panel.appendChild(actions);
  }

  buildDeveloperPane(devPane, close);

  overlay.appendChild(panel);
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) close();
  });
  // A modal dialog must hold the tab ring: aria-modal only moves the AT
  // virtual cursor, so without this Tab walks into the header and hero
  // behind the veil — and Escape (bound here) stops reaching the panel.
  overlay.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') return close();
    if (e.key !== 'Tab') return;
    const stops = [
      ...panel.querySelectorAll<HTMLElement>(
        'a[href], button:not([disabled]), input, select, textarea, [tabindex]',
      ),
    ].filter((el) => el.tabIndex >= 0 && el.getClientRects().length > 0);
    if (!stops.length) return;
    const edge = e.shiftKey ? stops[0] : stops[stops.length - 1];
    if (document.activeElement !== edge) return;
    e.preventDefault();
    (e.shiftKey ? stops[stops.length - 1] : stops[0]).focus();
  });
  root.appendChild(overlay);
  // Escape is bound at the document: clicking a paragraph inside the
  // sheet blurs to <body>, and a keydown there never reaches the overlay.
  document.addEventListener('keydown', onDocKey);
  (panel.querySelector('h2') as HTMLElement | null)?.focus();
  speakMemoryOpened();
}

/**
 * Developer options — a demo drawer, not a preference.
 *
 * The palette is pure CSS (see ui/palette.ts): switching writes one
 * attribute on <html>, so it applies to every surface at once and
 * survives reloads. It commits immediately rather than through Apply,
 * because the point is to SEE the change while the panel is open.
 */
function buildDeveloperPane(pane: HTMLElement, close: () => void): void {
  const h2 = document.createElement('h2');
  h2.tabIndex = -1;
  h2.textContent = 'Developer options';
  const note = document.createElement('p');
  note.className = 'memory-note';
  note.textContent =
    'For demos: tune the site\u2019s look. Everything here applies at once and is remembered — no Apply needed. Day and night both follow the palette; the loading screen keeps one look per palette.';
  pane.append(h2, note);

  const wrap = document.createElement('div');
  wrap.className = 'memory-field';
  const label = document.createElement('label');
  label.id = 'palette-label';
  label.textContent = 'Colour palette';
  prefixIcon(label, 'gem');

  const group = document.createElement('div');
  group.className = 'palette-grid';
  group.setAttribute('role', 'radiogroup');
  group.setAttribute('aria-labelledby', label.id);

  const options: HTMLButtonElement[] = [];
  const select = (id: string) => {
    applyPalette(id);
    for (const o of options) {
      const on = o.dataset.palette === id;
      o.setAttribute('aria-checked', String(on));
      o.tabIndex = on ? 0 : -1;
    }
  };

  for (const p of PALETTES) {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'palette-option';
    b.dataset.palette = p.id;
    b.setAttribute('role', 'radio');
    const on = currentPalette() === p.id;
    b.setAttribute('aria-checked', String(on));
    b.tabIndex = on ? 0 : -1;
    const swatches = p.swatches
      .map((c) => `<span class="palette-swatch" style="background:${c}"></span>`)
      .join('');
    b.innerHTML = `<span class="palette-swatches" aria-hidden="true">${swatches}</span><span class="palette-name">${p.label}</span><span class="palette-note">${p.note}</span>`;
    b.addEventListener('click', () => select(p.id));
    b.addEventListener('keydown', (e) => {
      if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight' && e.key !== 'ArrowDown' && e.key !== 'ArrowUp') return;
      e.preventDefault();
      const step = e.key === 'ArrowRight' || e.key === 'ArrowDown' ? 1 : -1;
      const next = options[(options.indexOf(b) + step + options.length) % options.length];
      select(next.dataset.palette!);
      next.focus();
    });
    options.push(b);
    group.appendChild(b);
  }
  // An unknown stored id would leave every option at tabIndex -1, making
  // the group unreachable by keyboard: always keep one tab stop.
  if (!options.some((o) => o.tabIndex === 0) && options[0]) options[0].tabIndex = 0;

  wrap.append(label, group);
  pane.appendChild(wrap);

  // Frosting: five steps of glass, clear to near-opaque, driving the
  // pane midground's blur and tint (html[data-frost] -> CSS).
  const fWrap = document.createElement('div');
  fWrap.className = 'memory-field';
  const fLabel = document.createElement('label');
  fLabel.id = 'frost-label';
  fLabel.textContent = 'Frosting — the glass over the garden';
  prefixIcon(fLabel, 'wind');
  const fGroup = document.createElement('div');
  fGroup.className = 'frost-steps';
  fGroup.setAttribute('role', 'radiogroup');
  fGroup.setAttribute('aria-labelledby', fLabel.id);
  const fOptions: HTMLButtonElement[] = [];
  const fSelect = (id: string) => {
    applyFrost(id);
    for (const o of fOptions) {
      const on = o.dataset.frost === id;
      o.setAttribute('aria-checked', String(on));
      o.tabIndex = on ? 0 : -1;
    }
  };
  for (const level of FROST_LEVELS) {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'frost-step';
    b.dataset.frost = level.id;
    b.setAttribute('role', 'radio');
    const on = currentFrost() === level.id;
    b.setAttribute('aria-checked', String(on));
    b.tabIndex = on ? 0 : -1;
    b.innerHTML = `<span class="frost-dot" aria-hidden="true" style="--step:${level.id}"></span><span class="frost-name">${level.label}</span>`;
    b.addEventListener('click', () => fSelect(level.id));
    b.addEventListener('keydown', (e) => {
      if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight' && e.key !== 'ArrowDown' && e.key !== 'ArrowUp') return;
      e.preventDefault();
      const step = e.key === 'ArrowRight' || e.key === 'ArrowDown' ? 1 : -1;
      const next = fOptions[(fOptions.indexOf(b) + step + fOptions.length) % fOptions.length];
      fSelect(next.dataset.frost!);
      next.focus();
    });
    fOptions.push(b);
    fGroup.appendChild(b);
  }
  if (!fOptions.some((o) => o.tabIndex === 0) && fOptions[0]) fOptions[0].tabIndex = 0;
  fWrap.append(fLabel, fGroup);
  pane.appendChild(fWrap);

  const actions = document.createElement('div');
  actions.className = 'threshold-actions';
  const done = document.createElement('button');
  done.type = 'button';
  done.className = 'btn btn--primary';
  done.textContent = 'Close';
  prefixIcon(done, 'check');
  done.addEventListener('click', close);
  actions.appendChild(done);
  pane.appendChild(actions);
}

let fieldSeq = 0;

/**
 * A labelled row. The label must actually be tied to what it labels:
 * for a real form control that is `for`/`id`, and for a group of chips
 * (which is a div, not a control) it is role="group" + aria-labelledby.
 * Without this the panel is a row of unnamed comboboxes to a screen
 * reader, and clicking the words does not focus the field.
 */
function field(label: string, glyph: IconName, build: () => HTMLElement): HTMLElement {
  const wrap = document.createElement('div');
  wrap.className = 'memory-field';
  const control = build();
  const id = `memory-field-${++fieldSeq}`;
  const l = document.createElement('label');
  l.textContent = label;

  const isControl =
    control instanceof HTMLInputElement ||
    control instanceof HTMLSelectElement ||
    control instanceof HTMLTextAreaElement;

  if (isControl) {
    if (!control.id) control.id = id;
    l.htmlFor = control.id;
  } else {
    // A container of controls: name it as a group instead.
    l.id = `${id}-label`;
    control.setAttribute('role', 'group');
    control.setAttribute('aria-labelledby', l.id);
  }

  prefixIcon(l, glyph);
  wrap.append(l, control);
  return wrap;
}

function button(
  label: string,
  kind: 'primary' | 'ghost' | 'chip' | 'danger',
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
