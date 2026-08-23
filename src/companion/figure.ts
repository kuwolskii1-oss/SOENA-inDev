/**
 * The tide-glass figures — 2D layered sprites, alive in the corner.
 *
 * No WebGL, no model files, no CDN: two small webp layers in the DOM.
 * The body keeps its seat pinned to the page's exact bottom-left corner;
 * the feathered head layer rotates around the neck so the head follows
 * the visitor's cursor — up when the cursor is high, down when it is
 * low. Everything animates with transforms only, driven by the app's
 * single shared rAF loop, and stands still under reduced motion.
 *
 * The head layer is cut from the same pixels as the body (which keeps
 * its own head drawn underneath) and rides at a slight scale-up, so
 * small rotations cover the static head beneath and the feathered edge
 * hides the seam.
 */
import type { CompanionForm } from '../data/companion-config';

const HEAD_SCALE = 1.05;
const MAX_NOD_DEG = 8;
const MAX_TURN_DEG = 2.2;

export class FigurePresence {
  private root: HTMLDivElement;
  private stage: HTMLDivElement;
  private body: HTMLImageElement;
  private headEl: HTMLImageElement | null = null;
  private glow: HTMLDivElement;

  private pointer = { x: 0, y: 0 };
  private lookNdc = { x: 0, y: 0 };
  private lookHold = 0;
  private pulse = 0;
  private lean = 0;
  private nod = 0;
  private turn = 0;
  private stageScale = 1;
  private stageTarget = 1;
  private disposed = false;
  private reduced: boolean;

  constructor(form: CompanionForm, reducedMotion: boolean) {
    this.reduced = reducedMotion;
    this.root = document.createElement('div');
    this.root.id = 'figure';
    this.root.setAttribute('aria-hidden', 'true');

    this.glow = document.createElement('div');
    this.glow.className = 'figure-glow';

    this.stage = document.createElement('div');
    this.stage.className = 'figure-stage';

    this.body = document.createElement('img');
    this.body.className = 'figure-body';
    this.body.alt = '';
    this.body.draggable = false;
    this.body.decoding = 'async';
    this.body.src = form.sprite ?? '';

    this.stage.append(this.glow, this.body);

    if (form.headSprite && form.head) {
      const h = form.head;
      const head = document.createElement('img');
      head.className = 'figure-head';
      head.alt = '';
      head.draggable = false;
      head.decoding = 'async';
      head.src = form.headSprite;
      head.style.left = `${h.x * 100}%`;
      head.style.top = `${h.y * 100}%`;
      head.style.width = `${h.w * 100}%`;
      // The neck pivot, expressed inside the head layer's own box.
      head.style.transformOrigin = `${((h.pivotX - h.x) / h.w) * 100}% ${((h.pivotY - h.y) / h.h) * 100}%`;
      this.headEl = head;
      this.stage.appendChild(head);
    }

    this.root.appendChild(this.stage);
    document.body.appendChild(this.root);
  }

  /** Resolves when the body sprite has real pixels; rejects to let the
   *  presence director fall back to the orb. */
  async load(): Promise<void> {
    await this.body.decode();
    if (!this.body.naturalWidth) throw new Error('empty sprite');
    this.root.classList.add('is-here');
  }

  /* ---------------- directing (API mirrors the orb's) -------------- */

  setAnchor(_x: number): void {
    /* the figures always hold the bottom-left corner */
  }

  setStage(scale: number): void {
    this.stageTarget = scale;
    if (this.reduced) this.applyStage(scale);
  }

  setHues(h1: number, h2: number): void {
    void h1;
    this.glow.style.background = `radial-gradient(closest-side, hsl(${((h2 % 360) + 360) % 360} 70% 62% / 0.34), transparent 75%)`;
  }

  setPointer(x: number, y: number): void {
    this.pointer.x = x;
    this.pointer.y = y;
  }

  setScrollVelocity(v: number): void {
    this.lean = Math.max(-1, Math.min(1, v * 0.02));
  }

  addPulse(strength: number): void {
    this.pulse = Math.min(1, Math.max(this.pulse, strength));
  }

  setMood(_mood: string): void {
    /* moods ride on pulses; hues carry the tone */
  }

  /** Attention without locomotion: glance at the element and glow. */
  pointAtElement(el: Element): void {
    const rect = el.getBoundingClientRect();
    this.lookNdc = {
      x: ((rect.left + rect.width / 2) / window.innerWidth) * 2 - 1,
      y: -(((rect.top + rect.height / 2) / window.innerHeight) * 2 - 1),
    };
    this.lookHold = 3.6;
    this.addPulse(1);
  }

  /* ---------------- frame ------------------------------------------ */

  private applyStage(scale: number): void {
    // Height as a viewport fraction; width follows the sprite's aspect.
    this.root.style.height = `${Math.round(scale * 62 * 10) / 10}vh`;
  }

  render(t: number, dt: number): void {
    if (this.disposed) return;
    this.pulse *= Math.exp(-dt * 3);
    this.lean *= Math.exp(-dt * 2.2);
    this.lookHold = Math.max(0, this.lookHold - dt);

    this.stageScale += (this.stageTarget - this.stageScale) * (1 - Math.exp(-dt * 3));
    this.applyStage(this.stageScale);

    // The head follows the cursor — pitch first: high cursor, head up.
    const aim = this.lookHold > 0 ? this.lookNdc : this.pointer;
    const k = 1 - Math.exp(-dt * 5);
    this.nod += (aim.y * MAX_NOD_DEG - this.nod) * k;
    this.turn += (aim.x * MAX_TURN_DEG - this.turn) * k;
    if (this.headEl) {
      // Right-facing profile: looking up is a counter-clockwise tilt.
      this.headEl.style.transform = `rotate(${(-this.nod + this.turn * 0.4).toFixed(2)}deg) scale(${HEAD_SCALE})`;
    }

    // Quiet aliveness: breath, a whisper of sway, the scroll lean.
    const breath = Math.sin(t * 1.25) * 0.35;
    const sway = Math.sin(t * 0.2) * 0.35;
    this.stage.style.transform = `translateY(${breath.toFixed(2)}%) rotate(${(sway - this.lean * 1.6).toFixed(2)}deg) scale(${(1 + this.pulse * 0.02).toFixed(3)})`;
    this.glow.style.opacity = String(0.55 + this.pulse * 0.45);
  }

  renderStill(): void {
    this.render(8, 0.016);
  }

  resize(): void {
    /* vh/aspect layout: nothing to do */
  }

  dispose(): void {
    this.disposed = true;
    this.root.remove();
  }
}
