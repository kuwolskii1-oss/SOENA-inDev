/**
 * Which body SOENA wears.
 *
 * The character models are placeholders generated through Higgsfield
 * (image → Meshy image_to_3d, textured + rigged + idle clip). The loader
 * prefers a local file in /models (committed to the repo once downloaded),
 * then the CDN URL, and if both fail the procedural light-orb takes over —
 * the page never breaks over a missing body.
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
  { id: 'orb', label: 'a living light', height: 1.4 },
  {
    id: 'she',
    label: 'her — the felted guide',
    localPath: './models/soena-she.glb',
    // Pending: 3D conversion of the user's female reference upload.
    remoteUrl: undefined,
    height: 1.55,
  },
  {
    id: 'he',
    label: 'him — the felted guide',
    localPath: './models/soena-he.glb',
    // Interim placeholder from the first Higgsfield run; will be replaced
    // by the conversion of the user's male reference upload.
    remoteUrl:
      'https://d8j0ntlcm91z4.cloudfront.net/user_3ExYiHyupSF2psOwNiJ4aHe340s/hf_20260821_105336_5c16bb86-3c4d-4c71-8432-8aef0e9b4eb5.glb',
    height: 1.55,
  },
];

export function formById(id: string | undefined): CompanionForm {
  return COMPANION_FORMS.find((f) => f.id === id) ?? COMPANION_FORMS[0];
}
