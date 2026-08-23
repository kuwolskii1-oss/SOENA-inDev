/**
 * SOENA in a body — the character runtime for the placeholder GLB models.
 *
 * The models are Higgsfield/Meshy conversions (textured, rigged, idle
 * clip). Everything expressive beyond the baked idle is procedural root
 * motion — walking bobs, pointing leans, the wand, the ladder, the
 * scroll-tumble — so any humanoid GLB dropped into /models keeps working
 * without re-authoring animation. Physical comedy through motion curves.
 */
import {
  AdditiveBlending,
  AnimationMixer,
  Bone,
  Box3,
  BoxGeometry,
  BufferAttribute,
  BufferGeometry,
  Color,
  CylinderGeometry,
  DirectionalLight,
  Group,
  HemisphereLight,
  Mesh,
  MeshBasicMaterial,
  MeshStandardMaterial,
  PerspectiveCamera,
  Points,
  PointsMaterial,
  Scene,
  SphereGeometry,
  Vector3,
  WebGLRenderer,
} from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import type { Quality } from '../core/quality';
import type { CompanionForm } from '../data/companion-config';

type CharState = 'idle' | 'walk' | 'point' | 'climbUp' | 'climbDown' | 'fall' | 'land';

const FLOOR_Y = -1.55;

export class CharacterScene {
  private renderer: WebGLRenderer;
  private scene = new Scene();
  private camera: PerspectiveCamera;

  private rig = new Group(); // moves around the page
  private model: Group | null = null;
  private mixer: AnimationMixer | null = null;

  // Gaze: the head bone follows the visitor's cursor — the single
  // strongest "someone is here with you" signal a character can give.
  private headBone: Bone | null = null;
  private gazeYaw = 0;
  private gazePitch = 0;

  private hemi: HemisphereLight;
  private key: DirectionalLight;
  private tint = new Color('#8b7bff');
  private tintTarget = new Color('#8b7bff');

  private wand: Group;
  private wandSparks: Points;
  private sparkSeeds: Float32Array;
  private ladder: Group;

  private state: CharState = 'idle';
  private stateT = 0;
  private anchorX = 0;
  private walkTargetX = 0;
  private climbTopY = 0;
  private pointWorld = new Vector3();
  private pointHold = 0;
  private needsLadder = false;
  private returnAfterPoint = true;

  private pulse = 0;
  private pointer = { x: 0, y: 0 };
  private scrollV = 0;
  private fallSpin = 0;

  // On the threshold the companion is the whole scenery; in the avenues
  // it walks at ordinary size beside the text.
  private stageScale = 1;
  private stageTarget = 1;

  constructor(canvas: HTMLCanvasElement, quality: Quality, private form: CompanionForm) {
    this.renderer = new WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: 'high-performance' });
    this.renderer.setPixelRatio(quality.dpr);

    this.camera = new PerspectiveCamera(35, 1, 0.1, 30);
    this.camera.position.set(0, 0, 6);

    // Soft studio light for the silver backdrop: bright even sky, gentle
    // grey bounce from below, one key from the upper left like a window.
    this.hemi = new HemisphereLight(0xffffff, 0xa5a3b0, 1.25);
    this.key = new DirectionalLight(0xffffff, 1.4);
    this.key.position.set(-1.2, 3, 3.5);
    this.scene.add(this.hemi, this.key, this.rig);

    this.wand = this.buildWand();
    this.wand.visible = false;
    this.rig.add(this.wand);

    const sparks = this.buildSparks(quality.tier === 0 ? 60 : 120);
    this.wandSparks = sparks.points;
    this.sparkSeeds = sparks.seeds;
    this.wandSparks.visible = false;
    this.scene.add(this.wandSparks);

    this.ladder = this.buildLadder();
    this.ladder.visible = false;
    this.scene.add(this.ladder);

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
        // Normalize: uniform scale to the form's height, feet on the floor.
        const box = new Box3().setFromObject(this.model);
        const size = box.getSize(new Vector3());
        const scale = this.form.height / Math.max(size.y, 0.001);
        this.model.scale.setScalar(scale);
        const scaled = new Box3().setFromObject(this.model);
        this.model.position.y = -scaled.min.y + FLOOR_Y;
        this.model.position.x = -(scaled.min.x + scaled.max.x) / 2;
        this.rig.add(this.model);

        if (gltf.animations.length) {
          this.mixer = new AnimationMixer(this.model);
          this.mixer.clipAction(gltf.animations[0]).play();
        }

        // Find the head (or failing that the neck) in the auto-rig so the
        // companion can meet the visitor's cursor with its gaze.
        const bones: Bone[] = [];
        this.model.traverse((o) => {
          if ((o as Bone).isBone) bones.push(o as Bone);
        });
        this.headBone =
          bones.find((b) => /head/i.test(b.name)) ??
          bones.find((b) => /neck/i.test(b.name)) ??
          null;
        return;
      } catch (err) {
        lastErr = err;
      }
    }
    throw lastErr;
  }

  /* -------------------------------------------------------------- */
  /* Props                                                           */
  /* -------------------------------------------------------------- */

  private buildWand(): Group {
    const g = new Group();
    const stick = new Mesh(
      new CylinderGeometry(0.012, 0.02, 0.55, 8),
      new MeshStandardMaterial({ color: 0x2c2440, roughness: 0.4 }),
    );
    stick.position.y = 0.275;
    const tip = new Mesh(
      new SphereGeometry(0.045, 12, 12),
      new MeshBasicMaterial({ color: 0xc9bfff }),
    );
    tip.position.y = 0.57;
    tip.name = 'tip';
    g.add(stick, tip);
    return g;
  }

  private buildSparks(count: number): { points: Points; seeds: Float32Array } {
    const geo = new BufferGeometry();
    const pos = new Float32Array(count * 3);
    const seeds = new Float32Array(count);
    for (let i = 0; i < count; i++) seeds[i] = Math.random();
    geo.setAttribute('position', new BufferAttribute(pos, 3));
    const points = new Points(
      geo,
      new PointsMaterial({ color: 0xd9d2ff, size: 0.045, transparent: true, opacity: 0.95, blending: AdditiveBlending, depthWrite: false, sizeAttenuation: true }),
    );
    return { points, seeds };
  }

  private buildLadder(): Group {
    const g = new Group();
    const mat = new MeshStandardMaterial({ color: 0x9a7b4f, roughness: 0.8 });
    const h = 2.6;
    for (const x of [-0.16, 0.16]) {
      const rail = new Mesh(new BoxGeometry(0.05, h, 0.05), mat);
      rail.position.set(x, h / 2, 0);
      g.add(rail);
    }
    for (let i = 0; i < 8; i++) {
      const rung = new Mesh(new BoxGeometry(0.34, 0.04, 0.04), mat);
      rung.position.set(0, 0.22 + i * 0.3, 0);
      g.add(rung);
    }
    g.position.y = FLOOR_Y;
    return g;
  }

  /* -------------------------------------------------------------- */
  /* Directing                                                        */
  /* -------------------------------------------------------------- */

  setAnchor(x: number): void {
    this.anchorX = x;
    if (this.state === 'idle') {
      this.walkTargetX = x;
      if (Math.abs(this.rig.position.x - x) > 0.2) this.enter('walk');
    }
  }

  /** Stage scale: 1 walking the avenues, smaller as the corner avatar. */
  setStage(scale: number): void {
    this.stageTarget = scale;
  }

  setHues(h1: number, h2: number): void {
    void h1;
    this.tintTarget.setHSL(((h2 % 360) + 360) % 360 / 360, 0.6, 0.68);
  }

  setPointer(x: number, y: number): void {
    this.pointer.x = x;
    this.pointer.y = y;
  }

  setScrollVelocity(v: number): void {
    this.scrollV = v;
    // A hard downward fling knocks the little companion off its feet.
    if (v > 30 && this.state === 'idle') this.enter('fall');
  }

  addPulse(strength: number): void {
    this.pulse = Math.min(1, Math.max(this.pulse, strength));
  }

  setMood(_mood: string): void {
    /* Character moods ride on state + pulses; hues carry the tone. */
  }

  /** Convert a DOM rect centre to world space on the character plane. */
  private screenToWorld(clientX: number, clientY: number): Vector3 {
    const ndc = new Vector3((clientX / window.innerWidth) * 2 - 1, -(clientY / window.innerHeight) * 2 + 1, 0.5);
    ndc.unproject(this.camera);
    const dir = ndc.sub(this.camera.position).normalize();
    const t = -this.camera.position.z / dir.z; // plane z = 0
    return this.camera.position.clone().add(dir.multiplyScalar(t));
  }

  /** Walk to the target, ladder up if it is high, and point the wand. */
  pointAtElement(el: Element): void {
    const rect = el.getBoundingClientRect();
    const target = this.screenToWorld(rect.left + rect.width / 2, rect.top + rect.height / 2);
    this.pointWorld.copy(target);
    this.needsLadder = rect.top < window.innerHeight * 0.34;
    this.climbTopY = Math.min(target.y - 0.6, FLOOR_Y + 2.0);
    // Stand beside the target, not on top of it.
    const side = target.x > 0 ? -1 : 1;
    this.walkTargetX = target.x + side * (this.needsLadder ? 0.55 : 0.9);
    this.pointHold = 4.6;
    this.returnAfterPoint = true;
    this.enter('walk');
  }

  private enter(state: CharState): void {
    this.state = state;
    this.stateT = 0;
    if (state === 'point') {
      this.wand.visible = true;
      this.wandSparks.visible = true;
    }
    if (state === 'climbUp') {
      this.ladder.visible = true;
      this.ladder.position.x = this.walkTargetX + (this.pointWorld.x > this.walkTargetX ? 0.35 : -0.35);
      this.ladder.scale.set(1, 0.01, 1);
    }
  }

  /* -------------------------------------------------------------- */
  /* Frame                                                            */
  /* -------------------------------------------------------------- */

  render(t: number, dt: number): void {
    this.stateT += dt;
    const k = 1 - Math.exp(-dt * 4);
    this.tint.lerp(this.tintTarget, k);
    this.hemi.color.copy(this.tint);
    this.pulse *= Math.exp(-dt * 4);
    this.mixer?.update(dt);

    // Gaze tracking, applied AFTER the mixer so it layers over the idle
    // clip: the head turns to meet the cursor, damped like real attention.
    if (this.headBone) {
      const gk = 1 - Math.exp(-dt * 5);
      this.gazeYaw += (this.pointer.x * 0.55 - this.gazeYaw) * gk;
      this.gazePitch += (-this.pointer.y * 0.32 - this.gazePitch) * gk;
      this.headBone.rotation.y += this.gazeYaw;
      this.headBone.rotation.x += this.gazePitch;
    }

    this.camera.position.y += (0 - this.camera.position.y) * (1 - Math.exp(-dt * 2.2));

    const r = this.rig;
    const dx = this.walkTargetX - r.position.x;

    this.stageScale += (this.stageTarget - this.stageScale) * (1 - Math.exp(-dt * 2.5));
    r.scale.setScalar(this.stageScale);

    switch (this.state) {
      case 'idle': {
        // Breathing bob, slow sway, occasional glance; wool has moods too.
        r.position.y += (Math.sin(t * 1.4) * 0.015 - r.position.y) * k;
        r.rotation.z += (Math.sin(t * 0.7) * 0.02 - r.rotation.z) * k;
        r.rotation.y += (this.pointer.x * 0.22 + Math.sin(t * 0.23) * 0.12 - r.rotation.y) * k;
        r.rotation.x += (-this.pulse * 0.06 - r.rotation.x) * (1 - Math.exp(-dt * 10));
        const s = this.stageScale * (1 + this.pulse * 0.025);
        r.scale.set(s, s, s);
        break;
      }
      case 'walk': {
        const dir = Math.sign(dx);
        const speed = Math.min(Math.abs(dx), 2.2) * 2.4;
        r.position.x += dir * speed * dt;
        r.position.y = Math.abs(Math.sin(t * 9)) * 0.05;
        r.rotation.z = -dir * 0.07;
        r.rotation.y += (dir * 0.55 - r.rotation.y) * k;
        if (Math.abs(this.walkTargetX - r.position.x) < 0.06) {
          r.position.x = this.walkTargetX;
          if (this.pointHold > 0) this.enter(this.needsLadder ? 'climbUp' : 'point');
          else this.enter('idle');
        }
        break;
      }
      case 'climbUp': {
        // The ladder unfolds, then a rung-by-rung climb.
        this.ladder.scale.y += (1 - this.ladder.scale.y) * (1 - Math.exp(-dt * 6));
        if (this.stateT > 0.45) {
          const progress = Math.min(1, (this.stateT - 0.45) / 1.1);
          const step = progress * (this.climbTopY - FLOOR_Y);
          r.position.y = step + Math.abs(Math.sin(progress * Math.PI * 6)) * 0.04;
          r.rotation.z = Math.sin(progress * Math.PI * 6) * 0.04;
          if (progress >= 1) this.enter('point');
        }
        break;
      }
      case 'point': {
        // Lean toward the target and hold the wand on it.
        const toward = Math.sign(this.pointWorld.x - r.position.x);
        r.rotation.y += (toward * 0.7 - r.rotation.y) * k;
        r.rotation.z += (toward * 0.1 - r.rotation.z) * k;

        const handY = (this.form.height ?? 1.5) * 0.62 + (r.position.y - 0);
        this.wand.position.set(toward * 0.32, handY - FLOOR_Y - r.position.y + FLOOR_Y, 0.25);
        this.wand.position.y = handY;
        const tipWorld = new Vector3(r.position.x + toward * 0.32, r.position.y + handY, 0.25);
        this.wand.lookAt(this.pointWorld.x - r.position.x + this.wand.position.x, this.pointWorld.y - r.position.y, this.pointWorld.z);
        this.wand.rotateX(Math.PI / 2);

        // Spark stream: motes travelling a soft arc from tip to target.
        const pos = this.wandSparks.geometry.getAttribute('position') as BufferAttribute;
        const mid = tipWorld.clone().lerp(this.pointWorld, 0.5).add(new Vector3(0, 0.45, 0));
        for (let i = 0; i < this.sparkSeeds.length; i++) {
          const u = (this.sparkSeeds[i] + t * (0.35 + this.sparkSeeds[i] * 0.3)) % 1;
          const a = tipWorld.clone().lerp(mid, u);
          const b = mid.clone().lerp(this.pointWorld, u);
          const p = a.lerp(b, u);
          const jitter = 0.03 * Math.sin(t * 8 + i);
          pos.setXYZ(i, p.x + jitter, p.y + jitter, p.z);
        }
        pos.needsUpdate = true;

        this.pointHold -= dt;
        if (this.pointHold <= 0) {
          this.wand.visible = false;
          this.wandSparks.visible = false;
          if (this.needsLadder) this.enter('climbDown');
          else {
            if (this.returnAfterPoint) {
              this.walkTargetX = this.anchorX;
              this.pointHold = 0;
              this.enter('walk');
            } else this.enter('idle');
          }
        }
        break;
      }
      case 'climbDown': {
        const progress = Math.min(1, this.stateT / 0.8);
        r.position.y = (1 - progress) * (this.climbTopY - FLOOR_Y);
        if (progress >= 1) {
          this.ladder.visible = false;
          this.needsLadder = false;
          this.walkTargetX = this.anchorX;
          this.pointHold = 0;
          this.enter('walk');
        }
        break;
      }
      case 'fall': {
        // Knocked head over heels by the scroll wind.
        this.fallSpin += dt * (6 + Math.min(this.scrollV, 60) * 0.12);
        r.rotation.z = Math.sin(this.fallSpin) * 0.9;
        r.rotation.y += dt * 2;
        r.position.y = -0.18 + Math.sin(this.fallSpin * 0.5) * 0.1;
        if (Math.abs(this.scrollV) < 8 && this.stateT > 0.35) this.enter('land');
        break;
      }
      case 'land': {
        // Squash, wobble, recover — dignity mostly intact.
        const u = Math.min(1, this.stateT / 0.55);
        const squash = Math.sin(u * Math.PI);
        const b = this.stageScale;
        r.scale.set(b * (1 + squash * 0.18), b * (1 - squash * 0.22), b * (1 + squash * 0.18));
        r.position.y = 0;
        r.rotation.z += (0 - r.rotation.z) * (1 - Math.exp(-dt * 8));
        r.rotation.y += (0 - r.rotation.y) * (1 - Math.exp(-dt * 8));
        if (u >= 1) {
          r.scale.setScalar(b);
          this.fallSpin = 0;
          this.enter('idle');
        }
        break;
      }
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
  }

  /** World half-width at the character plane, for anchor placement. */
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
