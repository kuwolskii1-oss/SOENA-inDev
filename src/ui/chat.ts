/**
 * The table for two — SOENA's chat drawer.
 *
 * A quiet panel that slides up from the corner. Replies come from the
 * scripted mind (companion/mind.ts) with a small typing delay so the
 * exchange breathes like conversation rather than search results.
 */
import { emit } from '../core/bus';
import { fill, loadProfile } from '../core/profile';
import { respond } from '../companion/mind';
import { takeHandoff, setHandoff } from '../core/pathway';
import { say } from '../companion/dialogue';
import { pointAtSelector } from '../companion/presence';
import { iconSvg, prefixIcon, type IconName } from './icons';

interface ChatMessage {
  who: 'you' | 'soena';
  text: string;
  at: number;
}

const KEY = 'soena.chat.v1';

function loadHistory(): ChatMessage[] {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as ChatMessage[]) : [];
  } catch {
    return [];
  }
}

function saveHistory(msgs: ChatMessage[]): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(msgs.slice(-60)));
  } catch {
    /* private mode */
  }
}

let toggleImpl: (() => void) | null = null;
let pushExternal: ((text: string) => void) | null = null;

/** Open or close the conversation from anywhere (chips, SOENA herself). */
export function toggleChat(): void {
  toggleImpl?.();
}

/**
 * Open the conversation with a specific SOENA line — the paths hand the
 * chat a greeting written for the person's exact situation, so nobody
 * has to retell their story. If the table is already open, the line
 * simply lands in the ongoing conversation.
 */
export function openChatWith(text: string): void {
  if (pushExternal) {
    pushExternal(text);
    return;
  }
  setHandoff(text);
  toggleImpl?.();
}

export function initChat(): void {
  let drawer: HTMLElement | null = null;
  let messages = loadHistory();

  const build = () => {
    drawer = document.createElement('aside');
    drawer.className = 'chat';
    drawer.setAttribute('aria-label', 'Conversation with SOENA');
    // Wheel inside the chat must scroll its log, not the Lenis page.
    drawer.setAttribute('data-lenis-prevent', '');
    drawer.innerHTML = `
      <header class="chat-head">
        <span>${iconSvg('message-circle')} SOENA</span>
        <button type="button" class="btn btn--ghost btn--icon chat-close" aria-label="Close the conversation">${iconSvg('x')}</button>
      </header>
      <div class="chat-log" role="log" aria-live="polite"></div>
      <div class="chat-hints"></div>
      <form class="chat-form">
        <input class="chat-input" type="text" maxlength="600" placeholder="say anything…" aria-label="Say something to SOENA" autocomplete="off" />
        <button class="btn btn--primary btn--icon" type="submit" aria-label="Send">${iconSvg('send-horizontal')}</button>
      </form>`;
    document.body.appendChild(drawer);

    const log = drawer.querySelector('.chat-log') as HTMLElement;
    const form = drawer.querySelector('.chat-form') as HTMLFormElement;
    const input = drawer.querySelector('.chat-input') as HTMLInputElement;
    const hints = drawer.querySelector('.chat-hints') as HTMLElement;

    const render = () => {
      log.replaceChildren(
        ...messages.map((m) => {
          const el = document.createElement('p');
          el.className = `chat-msg chat-msg--${m.who}`;
          el.textContent = m.text;
          return el;
        }),
      );
      log.scrollTop = log.scrollHeight;
    };

    const push = (m: ChatMessage) => {
      messages.push(m);
      saveHistory(messages);
      render();
    };

    const HINTS: Array<[string, IconName]> = [
      ['suggest me a book', 'lightbulb'],
      ['remember: ', 'brain'],
      ['what do you remember?', 'gem'],
      ['show me the avenues', 'route'],
      ['tell me a joke', 'sparkles'],
    ];
    hints.replaceChildren(
      ...HINTS.map(([h, glyph]) => {
        const b = document.createElement('button');
        b.type = 'button';
        b.className = 'btn btn--chip';
        b.textContent = h.trim().replace(/:$/, '…');
        prefixIcon(b, glyph);
        b.addEventListener('click', () => {
          input.value = h;
          input.focus();
          if (!h.endsWith(' ')) form.requestSubmit();
        });
        return b;
      }),
    );

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const text = input.value.trim();
      if (!text) return;
      input.value = '';
      push({ who: 'you', text, at: Date.now() });
      emit('soena:mood', { mood: 'listening' });

      const thinking = document.createElement('p');
      thinking.className = 'chat-msg chat-msg--soena chat-msg--thinking';
      thinking.textContent = '· · ·';
      log.appendChild(thinking);
      log.scrollTop = log.scrollHeight;

      const reply = await respond(text);
      // A breath before answering; longer for longer thoughts.
      await new Promise((r) => setTimeout(r, Math.min(1800, 500 + reply.text.length * 4)));
      thinking.remove();
      push({ who: 'soena', text: reply.text, at: Date.now() });
      say(reply.text, reply.mood ?? 'speaking');
      if (reply.pointAt) pointAtSelector(reply.pointAt);
    });

    // Context continuity: a path or journey may have queued the exact
    // greeting this conversation should begin with.
    const handoff = takeHandoff();
    if (handoff) {
      render();
      push({ who: 'soena', text: fill(handoff), at: Date.now() });
      say(fill(handoff), 'guiding');
    } else if (!messages.length) {
      const p = loadProfile();
      push({
        who: 'soena',
        text: fill(
          p
            ? 'This is our table, {name}. Heavy things, light things, books, jokes when the room allows — all of it welcome. What is on the road today?'
            : 'This is our table. I do not know your name yet — you entered quietly, which is welcome too. What is on the road today?',
        ),
        at: Date.now(),
      });
    } else {
      render();
    }
    pushExternal = (text) => {
      push({ who: 'soena', text, at: Date.now() });
      say(text, 'guiding');
    };

    drawer.querySelector('.chat-close')?.addEventListener('click', close);
    window.setTimeout(() => drawer?.classList.add('is-open'), 30);
    input.focus();
  };

  const close = () => {
    pushExternal = null;
    drawer?.classList.remove('is-open');
    window.setTimeout(() => {
      drawer?.remove();
      drawer = null;
    }, 450);
    emit('soena:mood', { mood: 'idle' });
  };

  toggleImpl = () => {
    if (drawer) close();
    else build();
  };
  document.getElementById('chat-open')?.addEventListener('click', toggleImpl);
}
