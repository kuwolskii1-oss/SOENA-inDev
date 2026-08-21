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
    if (!speechSupported()) {
      voiceBtn.disabled = true;
      voiceBtn.title = 'Speech is not available in this browser';
    } else {
      const applyVoice = (onNow: boolean) => {
        setVoiceEnabled(onNow);
        voiceBtn.setAttribute('aria-pressed', String(onNow));
        voiceBtn.classList.toggle('is-on', onNow);
      };
      applyVoice(false);
      voiceBtn.addEventListener('click', () => {
        const next = voiceBtn.getAttribute('aria-pressed') !== 'true';
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
