/**
 * Quality tiers — the single biggest lever award-tier WebGL sites pull.
 * Rather than rendering the same scene everywhere, we detect a coarse
 * device class once and scale geometry density, particle counts and
 * devicePixelRatio to it. A phone renders a calmer SOENA; a desktop GPU
 * renders a richer one; both hold their frame rate.
 */
export interface Quality {
  tier: 0 | 1 | 2; // 0 = low, 1 = mid, 2 = high
  dpr: number;
  orbDetail: number; // icosahedron subdivision
  haloCount: number; // particles
  reducedMotion: boolean;
  webgl: boolean;
}

export function detectQuality(): Quality {
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  let webgl = false;
  try {
    const c = document.createElement('canvas');
    webgl = !!(c.getContext('webgl2') || c.getContext('webgl'));
  } catch {
    webgl = false;
  }

  const cores = navigator.hardwareConcurrency ?? 4;
  const memory = (navigator as unknown as { deviceMemory?: number }).deviceMemory ?? 4;
  const coarse = window.matchMedia('(pointer: coarse)').matches;

  let tier: 0 | 1 | 2 = 1;
  if (cores >= 8 && memory >= 8 && !coarse) tier = 2;
  else if (cores <= 4 || memory <= 2) tier = 0;

  // Cap DPR: rendering at 3x on phones burns battery for invisible gains.
  const dpr = Math.min(window.devicePixelRatio || 1, tier === 2 ? 2 : 1.5);

  return {
    tier,
    dpr,
    // Detail 4 (2.5k verts) is the floor: below that the displaced
    // silhouette reads faceted. Vertex count is not where the cost is —
    // even detail 6 (41k verts) is trivial for any GPU from this decade.
    orbDetail: tier === 2 ? 6 : tier === 1 ? 5 : 4,
    haloCount: tier === 2 ? 1400 : tier === 1 ? 800 : 400,
    reducedMotion,
    webgl,
  };
}
