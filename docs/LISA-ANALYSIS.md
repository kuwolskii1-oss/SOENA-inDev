# How lisa.locomotive.ca is made — and how SOENA applies its lessons

This document is the research base for SOENA. It answers two questions:
**how is LISA built**, and **why does it feel so fast** — then maps every
finding onto what SOENA does about it.

> **Method note.** The research environment could not fetch
> `lisa.locomotive.ca` directly (network egress policy), so this analysis
> was assembled from award metadata (Awwwards/Webby), Locomotive's own case
> studies and engineering posts, GitHub/npm package forensics (tarballs of
> `locomotive-scroll@5`, `lenis@1.3`, `three`, `ogl` were downloaded and
> inspected), and technical write-ups of the same techniques. Every claim
> below carries a confidence label: **[verified]** (directly observed),
> **[strong]** (multiple independent sources), **[plausible]** (single
> source or pattern inference), **[speculative]**.

---

## 1. What LISA is

**L.I.S.A. — "Locomotive's Interactive Super Assistant"** — is the
personality-driven voice assistant of Locomotive, the Montreal agency
(7× Awwwards Agency of the Year). She debuted on their 2019 self-rebrand
(Awwwards Site of the Month, June 2019) and later got the standalone site
at `lisa.locomotive.ca`, which won one of Locomotive's two 2026 Webby
Awards. **[strong]**

The essential insight — and the one most worth stealing — is what LISA
actually *is*:

- **She is not a real AI.** LISA is a **scripted dialogue tree of witty,
  hand-written copy** ("homemade creative copywriting"), presented as a
  conversational interface. Awwwards files her under *Forms & Semantic
  Forms* — structured choices, not free text. Zero hallucination risk,
  zero inference latency, total control of tone. **[strong]**
- **Her voice is Google Cloud Text-to-Speech**, and her canonical visual is
  an **audio-reactive expanding circle**: the TTS audio buffer is decoded
  and routed through a Web Audio `AudioContext` + `AnalyserNode`, and the
  per-frame amplitude drives the visual. **[strong]**
- The standalone site's Awwwards page tags **WebGL, GSAP, Blender, 60fps**,
  implying a Blender-authored 3D asset rendered in-browser via three.js.
  **[plausible]**

## 2. The stack

| Layer | LISA / Locomotive | Confidence |
| --- | --- | --- |
| Renderer | three.js (they post "Three.js Developer" roles requiring GSAP/Lenis/WebGL; internal tooling for model positions/lighting/scroll) | strong |
| Animation | GSAP, single `gsap.ticker` rAF | strong |
| Scroll | locomotive-scroll — their own 8.8k-star library; **v5 is a thin TypeScript wrapper over Lenis** (its only runtime dependency), verified from the npm tarball: data-scroll attributes, dual IntersectionObservers so only in-viewport elements consume frame time, 4.4 kB ESM | verified |
| Scroll engine | Lenis (darkroom.engineering): dependency-free, 5.4 kB gzip, rAF-lerped but **native-scroll-based** — sticky, anchors, and accessibility keep working (this corrects the old v4 transform-wrapper model, which "stressed the GPU and lowered frame rate") | verified |
| Framework | **None.** Locomotive's stated policy ("Why don't we use front-end frameworks at Locomotive?", 2022): vanilla ES modules auto-initialized from `data-module-*` attributes (modujs), page transitions via modularload. Their current lanes are Astro 6 + locomotive-scroll v5 + nanostores, or Craft CMS + Vite 6 (both boilerplate `package.json`s fetched raw and verified) | strong/verified |
| Voice | Google Cloud TTS → `decodeAudioData` → `AnalyserNode` → visual amplitude | strong |
| 3D assets | Blender-authored (Awwwards tag); 2019-era team models were Polycam scans cleaned in Blender, animated with Mixamo | strong |
| Type | PP Locomotive New — custom variable typeface, "two typefaces, four styles" minimalism | strong |
| CMS | Charcoal, their in-house open-source PHP CMS | plausible for this subdomain |
| LLM backend | No evidence of one across ~25 targeted searches; the "AI" is the copywriting | speculative-negative |

## 3. Why it's so fast — the optimization playbook

The techniques below are the award-tier WebGL performance canon (sources:
Codrops engineering write-ups incl. ZERO and the three.js Conf site,
three.js manual, web.dev, Locomotive's own materials). LISA's site
specifically was built in a brand era whose stated philosophy was a
deliberately **light front end** that "avoided excessive animations and
gadgets." **[strong]**

**Network / assets**
1. **Procedural GLSL beats downloaded assets** — gradients and effects in
   a few lines of shader code instead of images (ZERO shrank 35–40 MB of
   early builds to <10 MB shipped partly this way).
2. **Draco or meshopt compression** for any glTF geometry (90–95%
   smaller; meshopt when the model animates), decoders self-hosted.
3. **KTX2/Basis textures** stay compressed *into VRAM* (a 2048² PNG costs
   ~16 MB of VRAM once decoded; KTX2 doesn't).
4. **Self-hosted subset WOFF2 fonts**, 1–2 faces, `font-display: swap`.
5. **Inline critical CSS**; the LCP element is *text or a poster image*,
   never the canvas — `<canvas>` is not an LCP candidate, so a canvas-first
   page must deliberately control what its LCP is.

**JavaScript**
6. **Dynamic-import the 3D bundle after first paint** — the page is usable
   before three.js is even fetched.
7. **Tree-shake three.js via named imports** (full build ≈ 87 kB gzip
   minimum; OGL at ~29 kB is the lighter alternative for shader-driven
   scenes).
8. **One shared rAF loop** for scroll lerp + tweens + render — competing
   loops are the classic jank source.

**Rendering**
9. **Cap devicePixelRatio at 2** (1.5 on mobile) — 3× retina quadruples
   fill-rate cost for imperceptible gain; the cheapest big lever there is.
10. **GPU-tier gating** (pmndrs/detect-gpu or heuristics): particle counts,
    geometry density and DPR scale to the device class.
11. **Draw-call discipline**: instancing, batching, GPU particles animated
    in the vertex shader (60 fps at a million points).
12. **Render on demand / pause when hidden** — the three.js manual's own
    advice; background tabs shouldn't burn battery.
13. **Native-scroll smoothing (the Lenis model)** + IntersectionObserver
    for section logic — no layout reads in the hot path.

**Experience**
14. **Preloader as first impression** — asset fetch time hidden behind a
    branded moment; only the *first* scene gates entry, everything else
    streams in isolated loading groups.
15. **`prefers-reduced-motion` handled in JS** (canvas is invisible to CSS
    media queries): dampen or freeze, don't just hope.
16. **Audio requires a gesture** (autoplay policy) — turned into a ritual:
    one intentional tap "awakens" the companion and unlocks
    AudioContext + TTS simultaneously.

## 4. What SOENA does with all this

SOENA follows the LISA playbook where it's right, and deliberately diverges
where being SOENA demands it.

| LISA lesson | SOENA's application |
| --- | --- |
| Light front end, no framework | Vite + vanilla TypeScript modules wired by a tiny typed event bus (`src/core/bus.ts`); zero framework bytes |
| Lenis under locomotive-scroll v5 | Lenis used directly (`src/core/scroll.ts`), one shared rAF loop drives scroll + WebGL; IntersectionObserver for section entry and reveals |
| Blender asset → three.js | **Deliberate divergence:** SOENA's presence is a *different 3D model in kind* — fully procedural: an icosphere breathed into shape by simplex-FBM in the vertex shader (with true displaced-gradient normals), fresnel-lit, ringed by a GPU particle halo. **3 draw calls, 0 bytes of 3D asset downloads** — the strongest possible version of "procedural beats assets" |
| Draco/KTX2 pipelines | Not needed — there is nothing to compress. (If a modeled GLB companion is ever wanted, the scene class is the single swap point, and meshopt + KTX2 is the pipeline to use) |
| three.js cost | Named imports, and the entire three chunk (118 kB gzip) is **lazy-loaded at idle after first paint**; the site is fully usable if it never arrives (CSS aura fallback) |
| Cloud TTS → AnalyserNode | **Deliberate divergence:** SOENA speaks with the browser's own `speechSynthesis` — zero network, zero cost, private. Since synthesis output *cannot* be tapped by Web Audio (WICG speech-api #69 — the architectural reason LISA needs cloud TTS), SOENA drives its visual pulses from utterance **boundary events** (one ripple per spoken word). Sentence-chunked to dodge Chrome's long-utterance wedge; captions always shown; voice strictly opt-in |
| Scripted personality ("the AI is the copywriting") | All of SOENA's dialogue is hand-written, orientation-aware, pronoun-correct scripted copy — zero hallucination risk in a spiritual context. An LLM could later sit behind the same interface without changing the presence, voice or memory layers |
| 60 fps discipline | DPR capped (2 / 1.5), quality tiers scale tessellation (2.5k–41k verts) and halo count (400–1400), single rAF paused on `visibilitychange`, transform/opacity-only CSS animation |
| Preloader-as-moment | Inverted: there is nothing to preload. The critical path is ~27 kB gzip (HTML + CSS + app JS), the hero is static HTML (it *is* the LCP), and the companion "arrives" by fading in when the lazy chunk lands — absence-then-presence as a feature |
| Reduced motion | `matchMedia` in JS: native scroll, no rAF loop, one dignified still frame of the orb; CSS reveals disabled |
| Audio gesture ritual | The voice toggle is the awakening gesture |
| Returning-visitor memory (undocumented in LISA) | **SOENA's headline addition:** a full client-side memory — name, pronouns (with a grammatical templating engine), path orientation, intentions, tone, keepsakes, visits, last avenue, journal — in `localStorage`, never on a server, fully inspectable/editable/erasable through the "memory" door. Companionship, not surveillance |

### The performance receipts (this repo, `npm run build`)

| Asset | Size (gzip) | When it loads |
| --- | --- | --- |
| `index.html` | 1.6 kB | first byte — static hero, inline critical CSS |
| CSS | 3.7 kB | render, single file |
| App JS (incl. Lenis + all content) | 21.7 kB | after parse |
| Fonts (woff2, subset, self-hosted) | 11–37 kB each | progressive, `swap` |
| three.js chunk | 118 kB | **idle-time, after first paint** |
| Scene code | 3.7 kB | with three chunk |
| 3D models, textures | **0 bytes** | never |

## 5. Sources

- Awwwards: [L.I.S.A. site page](https://www.awwwards.com/sites/l-i-s-a) · [2019 Site of the Month case study](https://www.awwwards.com/locomotive-by-locomotive-wins-site-of-the-month-june-a-case-study.html) · [Reinventing Locomotive case study](https://www.awwwards.com/case-study-reinventing-locomotive-r.html)
- Locomotive: [locomotivemtl on GitHub](https://github.com/locomotivemtl) (boilerplates, locomotive-scroll) · [“Why don't we use front-end frameworks at Locomotive?”](https://medium.com/@LocomotiveMTL/why-dont-we-use-front-end-frameworks-at-locomotive-4ccb20c05bc5) · [locomotive-scroll v5 docs](https://scroll.locomotive.ca/docs/)
- [Lenis](https://github.com/darkroomengineering/lenis) (npm tarball inspected)
- Codrops engineering write-ups: [ZERO](https://tympanus.net/codrops/2026/07/17/zero-the-engineering-behind-a-defiant-interactive-narrative/) · [3D audio visualizer](https://tympanus.net/codrops/2025/06/18/coding-a-3d-audio-visualizer-with-three-js-gsap-web-audio-api/) · [three.js Conf site](https://tympanus.net/codrops/2026/02/28/when-community-becomes-ui-building-the-website-for-the-first-three-js-conference/)
- [WICG speech-api #69](https://github.com/WICG/speech-api/issues/69) (speechSynthesis cannot feed Web Audio) · [Chrome autoplay policy](https://developer.chrome.com/blog/autoplay)
- [three.js manual: rendering on demand](https://threejs.org/manual/en/rendering-on-demand.html) · [pmndrs/detect-gpu](https://github.com/pmndrs/detect-gpu) · [don mccurdy: web texture formats](https://www.donmccurdy.com/2024/02/11/web-texture-formats/)
- [web.dev: LCP](https://web.dev/articles/lcp) · [optimize long tasks](https://web.dev/articles/optimize-long-tasks) · [W3C SCR40: reduced motion in JS](https://www.w3.org/WAI/WCAG21/Techniques/client-side-script/SCR40)
