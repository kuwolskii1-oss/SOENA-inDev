/**
 * Which body SOENA wears.
 *
 * The tide-glass pair are generated from the supplied references
 * (image → Meshy image_to_3d, textured + PBR + rigged, seated pose
 * preserved). The loader prefers a local file in /models (the deploy
 * workflow vendors the GLBs as same-origin files), then the CDN URL,
 * and if both fail the procedural light-orb takes over — the page
 * never breaks over a missing body.
 */
export type CompanionFormId = 'orb' | 'she' | 'he';

export interface CompanionForm {
  id: CompanionFormId;
  label: string;
  /** Path under the site root, tried first — but only when localAvailable. */
  localPath?: string;
  /** Flip to true once the GLB is actually committed under /public/models. */
  localAvailable?: boolean;
  /** Higgsfield CDN result, used when no local copy exists. */
  remoteUrl?: string;
  /** Approximate on-screen height in world units. */
  height: number;
}

export const COMPANION_FORMS: CompanionForm[] = [
  {
    id: 'she',
    label: 'her — the tide-glass listener',
    localPath: './models/soena-she.glb',
    localAvailable: true,
    // Converted from the supplied seated translucent female reference.
    remoteUrl: 'https://d8j0ntlcm91z4.cloudfront.net/user_3ExYiHyupSF2psOwNiJ4aHe340s/hf_20260823_171936_cbccfa99-4e2d-4124-ad6e-1170e2d4c7c4.glb',
    height: 1.5,
  },
  {
    id: 'he',
    label: 'him — the tide-glass listener',
    localPath: './models/soena-he.glb',
    localAvailable: true,
    // Converted from the supplied seated translucent male reference.
    remoteUrl: 'https://d8j0ntlcm91z4.cloudfront.net/user_3ExYiHyupSF2psOwNiJ4aHe340s/hf_20260823_172455_e2ae55ba-a228-4a30-88df-96f7ff910c20.glb',
    height: 1.5,
  },
  { id: 'orb', label: 'a living light', height: 1.4 },
];

/** Unknown or retired form ids resolve to her — the door's face. */
export function formById(id: string | undefined): CompanionForm {
  return COMPANION_FORMS.find((f) => f.id === id) ?? COMPANION_FORMS[0];
}
