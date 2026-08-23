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
import { say } from '../companion/dialogue';
import { pointAtSelector } from '../companion/presence';

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

/** Open or close the conversation from anywhere (chips, SOENA herself). */
export function toggleChat(): void {
  toggleImpl?.();
}

export function initChat(): void {
  let drawer: HTMLElement | null = null;
  let messages = loadHistory();

  const build = () => {
    drawer = document.createElement('aside');
    drawer.className = 'chat';
    drawer.setAttribute('aria-label', 'Conversation with SOENA');
    drawer.innerHTML = `
      <header class="chat-head">
        <span>SOENA</span>
        <button type="button" class="btn btn--ghost chat-close" aria-label="Close the conversation">rest</button>
      </header>
      <div class="chat-log" role="log" aria-live="polite"></div>
      <div class="chat-hints"></div>
      <form class="chat-form">
        <input class="chat-input" type="text" maxlength="600" placeholder="say anything…" aria-label="Say something to SOENA" autocomplete="off" />
        <button class="btn btn--primary" type="submit">send</button>
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

    const HINTS = [
      'suggest me a book',
      'remember: ',
      'what do you remember?',
      'show me the avenues',
      'tell me a joke',
    ];
    hints.replaceChildren(
      ...HINTS.map((h) => {
        const b = document.createElement('button');
        b.type = 'button';
        b.className = 'btn btn--chip';
        b.textContent = h.trim().replace(/:$/, '…');
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

    if (!messages.length) {
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

    drawer.querySelector('.chat-close')?.addEventListener('click', close);
    window.setTimeout(() => drawer?.classList.add('is-open'), 30);
    input.focus();
  };

  const close = () => {
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
