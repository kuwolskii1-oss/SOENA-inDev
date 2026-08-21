/**
 * Which body SOENA wears.
 *
 * The character models are placeholders generated through Higgsfield
 * (image → Meshy image_to_3d, textured + rigged + idle clip). The loader
 * prefers a local file in /models (committed to the repo once downloaded),
 * then the CDN URL, and if both fail the procedural light-orb takes over —
 * the page never breaks over a missing body.
 */
export type CompanionFormId = 'orb' | 'she' | 'he' | 'crt-she' | 'crt-he';

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
    id: 'crt-she',
    label: 'her — the seer (TV head)',
    localPath: './models/soena-crt-she.glb',
    localAvailable: true,
    remoteUrl:
      'https://d8j0ntlcm91z4.cloudfront.net/user_3ExYiHyupSF2psOwNiJ4aHe340s/hf_20260821_121820_34173f1b-87ce-4615-8cd5-814f9722230b.glb',
    height: 1.65,
  },
  {
    id: 'crt-he',
    label: 'him — the seer (TV head)',
    localPath: './models/soena-crt-he.glb',
    localAvailable: true,
    remoteUrl:
      'https://d8j0ntlcm91z4.cloudfront.net/user_3ExYiHyupSF2psOwNiJ4aHe340s/hf_20260821_121835_668a2687-a9e9-40f7-84e6-25c8b33024a6.glb',
    height: 1.65,
  },
  { id: 'orb', label: 'a living light', height: 1.4 },
  {
    id: 'she',
    label: 'her — the felted guide',
    // The deploy workflow vendors the GLB into /models as a same-origin
    // file; the CDN URL remains as a fallback for other hosts.
    localPath: './models/soena-she.glb',
    localAvailable: true,
    // Converted from the supplied felted female reference (Meshy rig + idle).
    remoteUrl:
      'https://d8j0ntlcm91z4.cloudfront.net/user_3ExYiHyupSF2psOwNiJ4aHe340s/hf_20260821_112506_1b5e07e1-81d4-4880-9c98-e8299740e629.glb',
    height: 1.55,
  },
  {
    id: 'he',
    label: 'him — the felted guide',
    localPath: './models/soena-he.glb',
    localAvailable: true,
    // Converted from the supplied felted male reference (Meshy rig + idle).
    remoteUrl:
      'https://d8j0ntlcm91z4.cloudfront.net/user_3ExYiHyupSF2psOwNiJ4aHe340s/hf_20260821_112515_2a39dd17-65e7-49c1-a736-331e52226e4e.glb',
    height: 1.55,
  },
];

/** Guests and unset profiles meet the seer first — the door's face. */
export function formById(id: string | undefined): CompanionForm {
  return COMPANION_FORMS.find((f) => f.id === id) ?? COMPANION_FORMS[0];
}
