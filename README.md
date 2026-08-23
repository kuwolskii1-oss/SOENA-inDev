# SOENA — a companion at the door

SOENA is a spiritual-journey companion web experience. Not a church, not a
course, not a feed: a **presence at the threshold** that learns your name,
your pronouns and the lean of your path, then ushers you through eight
avenues — **journeys, callings, encounters, guidance, community, testimony,
experience, consolidation** — in whatever register your path speaks:
theistic, non-theistic/atheistic, philosophical, psychological,
emotional/somatic, earth-based, interspiritual, or honestly undecided.

Built in the mold of [lisa.locomotive.ca](https://lisa.locomotive.ca/en)
(see [`docs/LISA-ANALYSIS.md`](docs/LISA-ANALYSIS.md) for the full teardown
of how that site is made and optimized) — with its own, deliberately
different 3D presence.

## What's here

- **The companion.** A fully procedural WebGL being — a simplex-FBM
  "living light" orb with true displaced normals, fresnel glow, a door-ring
  and an orbiting particle halo. Three draw calls, **zero bytes of 3D asset
  downloads**. It changes hue per avenue, drifts to the empty side of the
  page, breathes when idle, ripples when it speaks, and reacts to your
  pointer.
- **Memory.** SOENA remembers your name, pronouns (with a grammatical
  templating engine — `{they} {are}`, `{their}`, verbs conjugated
  correctly, or "just my name"), path orientation, intentions, tone,
  keepsakes, visits, last avenue walked and your journal. All of it lives
  in `localStorage` on your device — no account, no server. The **memory**
  door in the header shows everything, edits everything, erases everything.
- **The avenues.** Eight scroll sections, each re-voiced for your
  orientation, each with practical "doors": reflective prompts, a guided
  breath, an expressive-writing journal (testimony), seed voices
  (community).
- **Voice.** Opt-in browser `speechSynthesis` — no cloud TTS, no network.
  Word-boundary events drive the orb's speech ripples. Captions always.

## Performance shape

Critical path ≈ **27 kB gzip** (static HTML hero = LCP, inline critical
CSS, app JS incl. Lenis). three.js (118 kB gz) loads lazily at idle after
first paint; without WebGL or with reduced motion the site remains whole
(CSS aura, still frame, native scroll). DPR capped, quality tiers, one
shared rAF, paused when hidden.

## Develop

```bash
npm install
npm run dev        # vite dev server
npm run build      # typecheck + production build to dist/
npm run preview    # serve the build
node scripts/smoke.mjs  # headless-chromium smoke test (needs a built dist/)
```

No backend required; deploy `dist/` to any static host.

## Icons

Two families with strictly separate jobs, so they never compete:

- **[Lucide](https://lucide.dev)** (ISC) — every interface control: nav,
  buttons, switches, form fields, actions.
- **[Phosphor Icons](https://phosphoricons.com)** (MIT), duotone weight —
  the eight avenue emblems only. Two-tone fills read as editorial marks
  rather than something to click.

Only the ~36 glyphs actually drawn are vendored into `src/ui/icons.ts` by
`scripts/build-icons.mjs`, so the page makes no icon requests at runtime.
To change the set, edit the lists in that script and re-run:

```bash
npm i --no-save lucide-static @phosphor-icons/core
node scripts/build-icons.mjs
```

## Where things live

```
src/
  core/       bus, profile+pronoun engine, quality tiers, speech, scroll
  companion/  shaders (GLSL), scene (three.js), presence, dialogue
  data/       the eight avenues × eight orientations, orientations
  ui/         onboarding threshold, memory panel, avenues renderer, journal
  styles/     design system (dark, Fraunces + Outfit, motion-disciplined)
docs/
  LISA-ANALYSIS.md   how lisa.locomotive.ca is built & optimized, mapped to SOENA
```
