/**
 * Day and night over the canopy.
 *
 * The page's resting background is always a STILL — the day canopy or the
 * night canopy — because a still costs nothing to keep on screen. The two
 * stills are literally the first and last frames of the 0.8s timelapse
 * clips, so when a theme change plays the matching clip (day→night or
 * night→day), the hand-off into and out of video is pixel-invisible.
 *
 * The clips play exactly once per THEME CHANGE — never on load, never on
 * scroll — and the technique is chosen for smoothness end to end:
 *   · both clips are prefetched into blob: URLs at idle time (skipped
 *     under Save-Data), so the first toggle plays from memory with zero
 *     network stall mid-frame;
 *   · vp9/webm or h264/mp4 is picked by canPlayType, one file fetched,
 *     not both;
 *   · design tokens flip at the clip's midpoint behind a short global
 *     color transition, so the interface dims in step with the sky;
 *   · if the video cannot start within a beat (blocked autoplay, missing
 *     codec, ancient browser) or errors mid-play, the theme still changes
 *     with a quiet crossfade of the stills. The video is a garnish,
 *     never a dependency — and under prefers-reduced-motion the crossfade
 *     (opacity only, no motion) is used from the start.
 */
import { iconSvg } from './icons';
import { holdThemeShift, syncThemeColor } from './palette';
import { say } from '../companion/dialogue';

type Theme = 'light' | 'dark';

const KEY = 'soena.theme.v1';
const STILL: Record<Theme, string> = {
  light: './bg/canopy-day.webp',
  dark: './bg/canopy-night.webp',
};
const CLIP: Record<Theme, { webm: string; mp4: string }> = {
  dark: { webm: './bg/to-dark.webm', mp4: './bg/to-dark.mp4' }, // light → dark
  light: { webm: './bg/to-light.webm', mp4: './bg/to-light.mp4' }, // dark → light
};

const warmed = new Map<string, string>();
let busy = false;

function current(): Theme {
  return document.documentElement.dataset.theme === 'dark' ? 'dark' : 'light';
}

function clipUrl(target: Theme): string {
  const probe = document.createElement('video');
  const fmt = probe.canPlayType('video/webm; codecs="vp9"') ? 'webm' : 'mp4';
  return CLIP[target][fmt];
}

export function initTheme(): void {
  const actions = document.querySelector('.head-actions');
  if (!actions || document.getElementById('theme-toggle')) return;

  const btn = document.createElement('button');
  btn.type = 'button';
  btn.id = 'theme-toggle';
  btn.className = 'theme-toggle';
  btn.innerHTML =
    iconSvg('moon', { className: 'theme-icon theme-icon--to-dark' }) +
    iconSvg('sun', { className: 'theme-icon theme-icon--to-light' });
  const sync = () => {
    const t = current();
    btn.setAttribute('aria-pressed', String(t === 'dark'));
    btn.setAttribute('aria-label', t === 'dark' ? 'Return to day' : 'Let night fall');
    btn.title = btn.getAttribute('aria-label')!;
  };
  sync();
  btn.addEventListener('click', () => {
    void switchTheme(current() === 'dark' ? 'light' : 'dark').then(sync);
  });
  actions.insertBefore(btn, actions.firstChild);

  // Warm both clips into memory once the page is idle, so the very first
  // toggle never waits on the network. Save-Data means: don't.
  const nav = navigator as Navigator & { connection?: { saveData?: boolean } };
  if (!nav.connection?.saveData) {
    const warm = () => {
      for (const target of ['dark', 'light'] as Theme[]) {
        const url = clipUrl(target);
        if (warmed.has(url)) continue;
        fetch(url)
          .then((r) => (r.ok ? r.blob() : Promise.reject(new Error(String(r.status)))))
          .then((b) => warmed.set(url, URL.createObjectURL(b)))
          .catch(() => {/* the toggle will stream it, or fall back */});
      }
    };
    if ('requestIdleCallback' in window) window.requestIdleCallback(warm, { timeout: 8000 });
    else setTimeout(warm, 3000);
  }
}

/** Flip the tokens (and the resting still, via CSS) behind a short
 *  global color transition so every surface moves together. */
function applyTheme(t: Theme): void {
  const html = document.documentElement;
  // Shared with the palette switch — counted, so neither cuts the other short.
  holdThemeShift();
  if (t === 'dark') html.dataset.theme = 'dark';
  else delete html.dataset.theme;
  syncThemeColor();
  try {
    localStorage.setItem(KEY, t);
  } catch {
    /* private mode: the choice just won't survive the session */
  }
}

async function switchTheme(target: Theme): Promise<void> {
  if (busy || current() === target) return;
  busy = true;
  const backdrop = document.getElementById('backdrop');
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  if (!backdrop || reduced) {
    crossfade(target, backdrop);
    busy = false;
    return;
  }

  const url = clipUrl(target);
  const video = document.createElement('video');
  video.className = 'backdrop-media';
  video.muted = true;
  video.playsInline = true;
  video.setAttribute('playsinline', '');
  video.preload = 'auto';
  video.src = warmed.get(url) ?? url;

  let settled = false;
  const finish = (played: boolean) => {
    if (settled) return;
    settled = true;
    window.clearTimeout(watchdog);
    if (!played) {
      video.remove();
      crossfade(target, backdrop);
    } else {
      if (current() !== target) applyTheme(target);
      // The still beneath is already the clip's final frame: fade the
      // video out over it and nobody can see the seam.
      video.classList.add('is-done');
      window.setTimeout(() => video.remove(), 350);
    }
    busy = false;
  };

  // If playback hasn't actually begun within a beat, the theme change
  // must not be held hostage — fall back to the crossfade.
  const watchdog = window.setTimeout(() => finish(false), 900);

  video.addEventListener('error', () => finish(false));
  video.addEventListener('playing', () => window.clearTimeout(watchdog));
  video.addEventListener('timeupdate', () => {
    const d = video.duration || 0.8;
    if (video.currentTime >= d * 0.5 && current() !== target) applyTheme(target);
  });
  video.addEventListener('ended', () => finish(true));

  backdrop.appendChild(video);
  try {
    await video.play();
  } catch {
    finish(false);
  }

  window.setTimeout(() => {
    say(target === 'dark' ? 'Night, then. The stars keep watch with us.' : 'Morning again. The leaves remember the light.', 'guiding');
  }, 1200);
}

/** The quiet path: fade the target still in over the current one. */
function crossfade(target: Theme, backdrop: HTMLElement | null): void {
  if (!backdrop) {
    applyTheme(target);
    return;
  }
  const fade = document.createElement('div');
  fade.className = 'backdrop-fade';
  fade.style.backgroundImage = `url('${STILL[target]}')`;
  backdrop.appendChild(fade);
  requestAnimationFrame(() =>
    requestAnimationFrame(() => {
      fade.classList.add('is-in');
      window.setTimeout(() => applyTheme(target), 260);
      window.setTimeout(() => fade.remove(), 900);
    }),
  );
}
