/**
 * Header controls shared by every page: the day/night toggle, the voice
 * awakening gesture and the memory door.
 */
import { loadProfile, saveProfile } from '../core/profile';
import { setVoiceEnabled, speechSupported } from '../core/speech';
import { say } from '../companion/dialogue';
import { openMemoryPanel } from './memory';
import { initTheme } from './theme';
import { iconSvg, prefixIcon } from './icons';

export function initHeaderControls(): void {
  initTheme();
  const voiceBtn = document.getElementById('voice-toggle') as HTMLButtonElement | null;
  if (voiceBtn) {
    // The voice control is a switch, not a button: label + track + thumb.
    voiceBtn.classList.add('switch');
    voiceBtn.setAttribute('role', 'switch');
    voiceBtn.removeAttribute('aria-pressed');
    // Speaker icon + word + track; the icon crosses out when voice is off,
    // so the switch reads at a glance without depending on colour alone.
    voiceBtn.innerHTML = `${iconSvg('volume-x', { className: 'switch-icon switch-icon--off' })}${iconSvg('volume-2', { className: 'switch-icon switch-icon--on' })}<span class="switch-label">voice</span><span class="switch-track" aria-hidden="true"><span class="switch-thumb"></span></span>`;
    if (!speechSupported()) {
      voiceBtn.disabled = true;
      voiceBtn.setAttribute('aria-checked', 'false');
      voiceBtn.title = 'Speech is not available in this browser';
    } else {
      const applyVoice = (onNow: boolean) => {
        setVoiceEnabled(onNow);
        voiceBtn.setAttribute('aria-checked', String(onNow));
        voiceBtn.classList.toggle('is-on', onNow);
      };
      applyVoice(false);
      voiceBtn.addEventListener('click', () => {
        const next = voiceBtn.getAttribute('aria-checked') !== 'true';
        applyVoice(next);
        const p = loadProfile();
        if (p) {
          p.voiceOn = next;
          saveProfile(p);
        }
        if (next) say('You will hear me now. I will keep my voice low.', 'speaking');
      });
    }
  }

  const memoryBtn = document.getElementById('memory-open');
  if (memoryBtn) {
    prefixIcon(memoryBtn as HTMLElement, 'brain');
    memoryBtn.setAttribute('aria-haspopup', 'dialog');
    memoryBtn.setAttribute('aria-expanded', 'false');
    memoryBtn.addEventListener('click', openMemoryPanel);
  }
}
