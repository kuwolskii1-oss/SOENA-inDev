/**
 * The WebGL heart of the companion. This module (and three.js itself) lives
 * in a lazy chunk that loads after first paint — the door renders instantly
 * from HTML/CSS, then SOENA "arrives".
 *
 * Draw calls per frame: 3 (orb, glow, halo). No textures, no lights, no
 * shadow maps, no postprocessing — everything is shader-computed, so the
 * GPU cost is flat and tiny, and the network cost is zero.
 */
import {
  AdditiveBlending,
  BufferAttribute,
  BufferGeometry,
  Color,
  IcosahedronGeometry,
  Mesh,
  PerspectiveCamera,
  PlaneGeometry,
  Points,
  Scene,
  ShaderMaterial,
  WebGLRenderer,
} from 'three';
import type { Quality } from '../core/quality';
import {
  GLOW_FRAGMENT,
  GLOW_VERTEX,
  HALO_FRAGMENT,
  HALO_VERTEX,
  ORB_FRAGMENT,
  ORB_VERTEX,
} from './shaders';

export interface MoodParams {
  amp: number;
  tempo: number;
  energy: number;
}

const MOODS: Record<string, MoodParams> = {
  idle: { amp: 0.16, tempo: 0.55, energy: 0.55 },
  greeting: { amp: 0.3, tempo: 0.9, energy: 0.95 },
  listening: { amp: 0.09, tempo: 0.35, energy: 0.7 },
  speaking: { amp: 0.26, tempo: 1.15, energy: 1.0 },
  guiding: { amp: 0.2, tempo: 0.7, energy: 0.8 },
  breathing: { amp: 0.12, tempo: 0.28, energy: 0.65 },
};

export class SoenaScene {
  private renderer: WebGLRenderer;
  private scene = new Scene();
  private camera: PerspectiveCamera;

  private orb: Mesh<IcosahedronGeometry, ShaderMaterial>;
  private glow: Mesh<PlaneGeometry, ShaderMaterial>;
  private halo: Points<BufferGeometry, ShaderMaterial>;

  private colorA = new Color();
  private colorB = new Color();
  private targetA = new Color();
  private targetB = new Color();

  private mood: MoodParams = { ...MOODS.idle };
  private targetMood: MoodParams = { ...MOODS.idle };

  private pulse = 0;
  private pointer = { x: 0, y: 0, tx: 0, ty: 0 };
  private anchorX = 0;
  private currentX = 0;
  private scrollVelocity = 0;

  constructor(canvas: HTMLCanvasElement, quality: Quality) {
    this.renderer = new WebGLRenderer({
      canvas,
      antialias: quality.tier > 0,
      alpha: true,
      powerPreference: 'high-performance',
    });
    this.renderer.setPixelRatio(quality.dpr);

    this.camera = new PerspectiveCamera(38, 1, 0.1, 30);
    this.camera.position.set(0, 0, 5.2);

    this.setHues(255, 205);
    this.colorA.copy(this.targetA);
    this.colorB.copy(this.targetB);

    const shared = {
      uTime: { value: 0 },
      uAmp: { value: this.mood.amp },
      uTempo: { value: this.mood.tempo },
      uEnergy: { value: this.mood.energy },
      uPulse: { value: 0 },
      uColorA: { value: this.colorA },
      uColorB: { value: this.colorB },
    };

    this.orb = new Mesh(
      new IcosahedronGeometry(1, quality.orbDetail),
      new ShaderMaterial({ vertexShader: ORB_VERTEX, fragmentShader: ORB_FRAGMENT, uniforms: shared }),
    );
    // The companion is a presence, not a planet: keep it modest.
    this.orb.scale.setScalar(0.68);
    this.scene.add(this.orb);

    this.glow = new Mesh(
      new PlaneGeometry(6.4, 6.4),
      new ShaderMaterial({
        vertexShader: GLOW_VERTEX,
        fragmentShader: GLOW_FRAGMENT,
        uniforms: shared,
        transparent: true,
        blending: AdditiveBlending,
        depthWrite: false,
      }),
    );
    this.glow.position.z = -1.2;
    this.glow.scale.setScalar(0.78);
    this.scene.add(this.glow);

    this.halo = new Points(
      this.buildHaloGeometry(quality.haloCount),
      new ShaderMaterial({
        vertexShader: HALO_VERTEX,
        fragmentShader: HALO_FRAGMENT,
        uniforms: { ...shared, uPixelRatio: { value: quality.dpr } },
        transparent: true,
        blending: AdditiveBlending,
        depthWrite: false,
      }),
    );
    this.halo.scale.setScalar(0.82);
    this.scene.add(this.halo);

    this.resize();
  }

  private buildHaloGeometry(count: number): BufferGeometry {
    const geo = new BufferGeometry();
    const pos = new Float32Array(count * 3);
    const seed = new Float32Array(count);
    for (let i = 0; i < count; i++) {
      // Fibonacci-ish shell between r=1.6 and r=2.6, flattened toward a belt.
      const r = 1.6 + Math.random() * 1.0;
      const theta = Math.random() * Math.PI * 2;
      const y = (Math.random() * 2 - 1) * (0.35 + Math.random() * 0.45);
      pos[i * 3] = Math.cos(theta) * r;
      pos[i * 3 + 1] = y;
      pos[i * 3 + 2] = Math.sin(theta) * r;
      seed[i] = Math.random();
    }
    geo.setAttribute('position', new BufferAttribute(pos, 3));
    geo.setAttribute('aSeed', new BufferAttribute(seed, 1));
    return geo;
  }

  /** Avenue hues in degrees; converted once, lerped per-frame. */
  setHues(h1: number, h2: number): void {
    this.targetA.setHSL(((h1 % 360) + 360) % 360 / 360, 0.55, 0.38);
    this.targetB.setHSL(((h2 % 360) + 360) % 360 / 360, 0.75, 0.62);
  }

  setMood(name: string): void {
    this.targetMood = MOODS[name] ?? MOODS.idle;
  }

  addPulse(strength: number): void {
    this.pulse = Math.min(1.2, Math.max(this.pulse, strength));
  }

  setPointer(x: number, y: number): void {
    this.pointer.tx = x;
    this.pointer.ty = y;
  }

  /** Which side of the viewport the companion stands on (-1..1). */
  setAnchor(x: number): void {
    this.anchorX = x;
  }

  setScrollVelocity(v: number): void {
    this.scrollVelocity = v;
  }

  resize(): void {
    const w = window.innerWidth;
    const h = window.innerHeight;
    this.renderer.setSize(w, h, false);
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
    // On narrow screens the companion stays centred and slightly higher.
    if (w < 720) this.anchorX = 0;
  }

  render(t: number, dt: number): void {
    const k = 1 - Math.exp(-dt * 3.2); // frame-rate independent lerp

    this.mood.amp += (this.targetMood.amp - this.mood.amp) * k;
    this.mood.tempo += (this.targetMood.tempo - this.mood.tempo) * k;
    this.mood.energy += (this.targetMood.energy - this.mood.energy) * k;
    this.colorA.lerp(this.targetA, k);
    this.colorB.lerp(this.targetB, k);
    this.pulse *= Math.exp(-dt * 4.5);

    this.pointer.x += (this.pointer.tx - this.pointer.x) * k;
    this.pointer.y += (this.pointer.ty - this.pointer.y) * k;

    // Drift toward the avenue's anchor side; scroll velocity leans the orb.
    const worldHalfWidth = Math.tan((this.camera.fov * Math.PI) / 360) * this.camera.position.z * this.camera.aspect;
    const targetX = this.anchorX * worldHalfWidth * 0.52;
    this.currentX += (targetX - this.currentX) * (1 - Math.exp(-dt * 2.2));

    const group = [this.orb, this.glow, this.halo] as const;
    const bobY = Math.sin(t * 0.6) * 0.08 - this.scrollVelocity * 0.006;
    for (const obj of group) {
      obj.position.x = this.currentX + this.pointer.x * 0.18;
      obj.position.y = (obj === this.glow ? -0.02 : 0) + bobY + this.pointer.y * 0.12;
    }
    this.glow.position.z = -1.2;
    this.halo.rotation.z = Math.sin(t * 0.1) * 0.25;
    this.orb.rotation.y = t * 0.05;

    const u = this.orb.material.uniforms;
    u.uTime.value = t;
    u.uAmp.value = this.mood.amp;
    u.uTempo.value = this.mood.tempo;
    u.uEnergy.value = this.mood.energy;
    u.uPulse.value = this.pulse;

    this.renderer.render(this.scene, this.camera);
  }

  /** Render one still frame (reduced-motion path). */
  renderStill(): void {
    this.render(12.4, 0.016);
  }

  dispose(): void {
    this.orb.geometry.dispose();
    this.orb.material.dispose();
    this.glow.geometry.dispose();
    this.glow.material.dispose();
    this.halo.geometry.dispose();
    this.halo.material.dispose();
    this.renderer.dispose();
  }
}
