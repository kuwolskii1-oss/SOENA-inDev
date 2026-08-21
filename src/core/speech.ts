/**
 * SOENA's voice — the browser's own speech synthesis, nothing cloud-bound.
 *
 * LISA (lisa.locomotive.ca) streams Google Cloud TTS audio and runs it
 * through an AudioContext analyser to animate her visuals. We take the
 * zero-network route instead: speechSynthesis costs no bytes and no
 * round-trips. Synthesis output can't be tapped by Web Audio, so we drive
 * the companion's visual pulses from utterance boundary events (one pulse
 * per spoken word) — same effect, no audio graph.
 *
 * Voice is opt-in (browsers require a user gesture for audio anyway) and
 * every line is always shown as a caption, so sound is never load-bearing.
 */
import { emit } from './bus';

let enabled = false;
let chosenVoice: SpeechSynthesisVoice | null = null;
let currentUtterance: SpeechSynthesisUtterance | null = null;

const supported = typeof window !== 'undefined' && 'speechSynthesis' in window;

function pickVoice(): void {
  if (!supported) return;
  const voices = window.speechSynthesis.getVoices();
  if (!voices.length) return;
  const en = voices.filter((v) => v.lang.startsWith('en'));
  const pool = en.length ? en : voices;
  // Prefer locally-installed voices (no network fetch, lower latency).
  chosenVoice =
    pool.find((v) => v.localService && /female|aria|serena|samantha|zira/i.test(v.name)) ??
    pool.find((v) => v.localService) ??
    pool[0];
}

if (supported) {
  pickVoice();
  // Voice list loads asynchronously in most browsers.
  window.speechSynthesis.addEventListener('voiceschanged', pickVoice);
}

export function speechSupported(): boolean {
  return supported;
}

export function setVoiceEnabled(on: boolean): void {
  enabled = on && supported;
  if (!enabled && supported) window.speechSynthesis.cancel();
}

export function voiceEnabled(): boolean {
  return enabled;
}

export function speak(text: string): void {
  if (!enabled || !supported) return;
  window.speechSynthesis.cancel();

  // Chrome desktop wedges on utterances longer than ~15s, so speak in
  // sentence-sized pieces — which is the right cadence for a companion
  // anyway. Mood is raised on the first piece and released on the last.
  const pieces = text.match(/[^.!?…]+[.!?…]*/g)?.map((s) => s.trim()).filter(Boolean) ?? [text];
  pieces.forEach((piece, i) => {
    const u = new SpeechSynthesisUtterance(piece);
    if (i === pieces.length - 1) currentUtterance = u;
    if (chosenVoice) u.voice = chosenVoice;
    u.rate = 0.92;
    u.pitch = 1.02;
    u.volume = 0.9;
    u.addEventListener('boundary', () => emit('soena:pulse', { strength: 0.55 + Math.random() * 0.45 }));
    if (i === 0) u.addEventListener('start', () => emit('soena:mood', { mood: 'speaking' }));
    u.addEventListener('end', () => {
      if (currentUtterance === u) {
        currentUtterance = null;
        emit('soena:mood', { mood: 'idle' });
      }
    });
    window.speechSynthesis.speak(u);
  });
}

export function hush(): void {
  if (supported) window.speechSynthesis.cancel();
  currentUtterance = null;
}
