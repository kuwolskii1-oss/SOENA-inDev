/**
 * SOENA in a body — the tide-glass figures.
 *
 * The companions are seated: translucent glass-like figures resting on
 * the edge of a plinth, generated from the supplied references (image →
 * Meshy image_to_3d, textured + PBR + rigged, original pose preserved).
 * They do not walk the page. They keep one post — the exact bottom-left
 * corner of the viewport, on every page, at every size — like someone
 * sitting on the edge of the world, watching you read.
 *
 * All aliveness is procedural and quiet:
 *   · the HEAD follows the cursor — pitch rides the cursor's height
 *     (look up when you reach high, down when you reach low), with a
 *     small yaw so the attention feels real rather than mechanical;
 *   · a breathing bob and a slow sway;
 *   · pulses (from dialogue) breathe the glow a little;
 *   · a hard scroll leans the figure back for a beat, nothing more.
 */
import {
  Bone,
  Box3,
  Color,
  DirectionalLight,
  Group,
  HemisphereLight,
  Mesh,
  MeshStandardMaterial,
  PerspectiveCamera,
  Scene,
  Vector3,
  WebGLRenderer,
} from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import type { Quality } from '../core/quality';
import type { CompanionForm } from '../data/companion-config';

/** Breathing room between the figure and the true viewport edges. */
const CORNER_PAD_X = 0.06;
const CORNER_PAD_Y = 0.02;

export class CharacterScene {
  private renderer: WebGLRenderer;
  private scene = new Scene();
  private camera: PerspectiveCamera;

  /** rig origin = the model's bottom-left corner, so pinning the rig to
   *  the viewport corner pins the figure regardless of scale. */
  private rig = new Group();
  private model: Group | null = null;

  private headBone: Bone | null = null;
  private gazeYaw = 0;
  private gazePitch = 0;

  /** Brief attention override: look at a spot on the page, then return. */
  private lookHold = 0;
  private lookNdc = { x: 0, y: 0 };

  private hemi: HemisphereLight;
  private key: DirectionalLight;
  private tint = new Color('#7fd9c8');
  private tintTarget = new Color('#7fd9c8');

  private pulse = 0;
  private pointer = { x: 0, y: 0 };
  private lean = 0;

  private stageScale = 1;
  private stageTarget = 1;

  constructor(canvas: HTMLCanvasElement, quality: Quality, private form: CompanionForm) {
    this.renderer = new WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: 'high-performance' });
    this.renderer.setPixelRatio(quality.dpr);

    this.camera = new PerspectiveCamera(35, 1, 0.1, 30);
    this.camera.position.set(0, 0, 6);

    // Bright even sky with a cool bounce — the tide-glass reads best lit
    // like an aquarium: soft, blue-green, no hard shadows.
    this.hemi = new HemisphereLight(0xffffff, 0x9fc4bd, 1.25);
    this.key = new DirectionalLight(0xffffff, 1.3);
    this.key.position.set(-1.2, 3, 3.5);
    this.scene.add(this.hemi, this.key, this.rig);

    this.resize();
  }

  /** Try local file first, then the CDN copy. Throws if neither loads. */
  async load(): Promise<void> {
    const loader = new GLTFLoader();
    const sources = [
      this.form.localAvailable ? this.form.localPath : undefined,
      this.form.remoteUrl,
    ].filter(Boolean) as string[];
    let lastErr: unknown = new Error('no model sources configured');
    for (const url of sources) {
      try {
        const gltf = await loader.loadAsync(url);
        this.model = gltf.scene;
        // Normalize to the form's height, then shift so the bounding
        // box's minimum corner sits at the rig origin — the rig origin
        // IS the figure's bottom-left, which makes corner-pinning exact.
        const box = new Box3().setFromObject(this.model);
        const size = box.getSize(new Vector3());
        const scale = this.form.height / Math.max(size.y, 0.001);
        this.model.scale.setScalar(scale);
        const scaled = new Box3().setFromObject(this.model);
        this.model.position.x = -scaled.min.x;
        this.model.position.y = -scaled.min.y;
        this.model.position.z = -(scaled.min.z + scaled.max.z) / 2;
        this.rig.add(this.model);

        // Find the head (or failing that the neck) in the auto-rig: the
        // cursor-following gaze lives on this bone.
        const bones: Bone[] = [];
        this.model.traverse((o) => {
          if ((o as Bone).isBone) bones.push(o as Bone);
        });
        this.headBone =
          bones.find((b) => /head/i.test(b.name)) ??
          bones.find((b) => /neck/i.test(b.name)) ??
          null;

        this.placeCorner();
        return;
      } catch (err) {
        lastErr = err;
      }
    }
    throw lastErr;
  }

  /* -------------------------------------------------------------- */
  /* Directing                                                        */
  /* -------------------------------------------------------------- */

  /** The post never moves — kept for API compatibility with the orb. */
  setAnchor(_x: number): void {
    /* the tide-glass figures always hold the bottom-left corner */
  }

  /** Pages may size the figure (the landing keeps it small). */
  setStage(scale: number): void {
    this.stageTarget = scale;
  }

  setHues(h1: number, h2: number): void {
    void h1;
    this.tintTarget.setHSL((((h2 % 360) + 360) % 360) / 360, 0.45, 0.72);
  }

  setPointer(x: number, y: number): void {
    this.pointer.x = x;
    this.pointer.y = y;
  }

  setScrollVelocity(v: number): void {
    // A hard scroll tips the seated figure back a touch, like wind.
    this.lean = Math.max(-0.12, Math.min(0.12, v * 0.002));
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

  /** Pin the rig origin (= model bottom-left) to the viewport corner. */
  private placeCorner(): void {
    const halfH = Math.tan((this.camera.fov * Math.PI) / 360) * this.camera.position.z;
    const halfW = halfH * this.camera.aspect;
    this.rig.position.x = -halfW + CORNER_PAD_X;
    this.rig.position.y = -halfH + CORNER_PAD_Y;
  }

  /* -------------------------------------------------------------- */
  /* Frame                                                            */
  /* -------------------------------------------------------------- */

  render(t: number, dt: number): void {
    const k = 1 - Math.exp(-dt * 4);
    this.tint.lerp(this.tintTarget, k);
    this.hemi.color.copy(this.tint);
    this.pulse *= Math.exp(-dt * 3);
    this.lookHold = Math.max(0, this.lookHold - dt);
    this.lean *= Math.exp(-dt * 2.2);

    // The head follows the cursor — pitch first (up when the cursor is
    // high, down when it is low), a little yaw so it reads as attention.
    // A glance request (pointAtElement) borrows the gaze for a moment.
    const aim = this.lookHold > 0 ? this.lookNdc : this.pointer;
    if (this.headBone) {
      const gk = 1 - Math.exp(-dt * 5);
      this.gazePitch += (-aim.y * 0.5 - this.gazePitch) * gk;
      this.gazeYaw += (aim.x * 0.25 - this.gazeYaw) * gk;
      this.headBone.rotation.x = this.gazePitch;
      this.headBone.rotation.y = this.gazeYaw;
    }

    // Stage scale eases; the corner hold is exact at every size because
    // the rig origin is the figure's own bottom-left corner.
    this.stageScale += (this.stageTarget - this.stageScale) * (1 - Math.exp(-dt * 2.5));
    const s = this.stageScale * (1 + this.pulse * 0.02);
    this.rig.scale.setScalar(s);
    this.placeCorner();

    // Quiet aliveness: breath, a slow sway, the scroll lean.
    if (this.model) {
      this.model.rotation.z = Math.sin(t * 0.6) * 0.012 - this.lean;
      this.model.rotation.y = Math.sin(t * 0.21) * 0.05;
      this.model.position.y += (Math.sin(t * 1.3) * 0.008 * this.form.height - (this.model.userData.breath ?? 0));
      this.model.userData.breath = Math.sin(t * 1.3) * 0.008 * this.form.height;
    }

    this.renderer.render(this.scene, this.camera);
  }

  renderStill(): void {
    this.render(8, 0.016);
  }

  resize(): void {
    const w = window.innerWidth;
    const h = window.innerHeight;
    this.renderer.setSize(w, h, false);
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
    this.placeCorner();
  }

  /** World half-width at the character plane (kept for the director). */
  worldHalfWidth(): number {
    return Math.tan((this.camera.fov * Math.PI) / 360) * this.camera.position.z * this.camera.aspect;
  }

  dispose(): void {
    this.renderer.dispose();
    this.scene.traverse((obj) => {
      const mesh = obj as Mesh;
      if (mesh.geometry) mesh.geometry.dispose();
      const mat = mesh.material as MeshStandardMaterial | undefined;
      if (mat?.dispose) mat.dispose();
    });
  }
}
