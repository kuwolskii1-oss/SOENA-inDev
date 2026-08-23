/**
 * Header controls shared by every page: the voice awakening gesture and
 * the memory door.
 */
import { loadProfile, saveProfile } from '../core/profile';
import { setVoiceEnabled, speechSupported } from '../core/speech';
import { say } from '../companion/dialogue';
import { openMemoryPanel } from './memory';

export function initHeaderControls(): void {
  const voiceBtn = document.getElementById('voice-toggle') as HTMLButtonElement | null;
  if (voiceBtn) {
    // The voice control is a switch, not a button: label + track + thumb.
    voiceBtn.classList.add('switch');
    voiceBtn.setAttribute('role', 'switch');
    voiceBtn.removeAttribute('aria-pressed');
    voiceBtn.innerHTML =
      '<span class="switch-label">voice</span><span class="switch-track" aria-hidden="true"><span class="switch-thumb"></span></span>';
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

  document.getElementById('memory-open')?.addEventListener('click', openMemoryPanel);
}
