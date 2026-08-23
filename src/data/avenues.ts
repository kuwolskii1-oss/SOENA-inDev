/**
 * The eight avenues SOENA ushers a person through.
 *
 * Every avenue speaks to every kind of path. `framings` re-voices the same
 * avenue for each orientation — a theist hears "calling", a non-theist
 * hears "what your life keeps asking of you" — without ranking either.
 * Tokens like {name}, {their}, {are} are filled by the pronoun engine.
 */
import type { EmblemName } from '../ui/icons';

export interface Door {
  title: string;
  body: string;
  /** Optional interactive kind rendered by the UI layer. */
  kind?: 'journal' | 'breath' | 'prompt';
}

export interface Avenue {
  id: string;
  title: string;
  tagline: string;
  /** Hue accents for the companion when this avenue is active. [h1, h2] in degrees. */
  hues: [number, number];
  /** Phosphor duotone emblem that marks this avenue. */
  emblem: EmblemName;
  intro: string;
  framings: Record<string, string>;
  companionLine: string;
  doors: Door[];
}

export const AVENUES: Avenue[] = [
  {
    id: 'journeys',
    title: 'Journeys',
    tagline: 'where you have been, where you are going',
    hues: [255, 205],
    emblem: 'path',
    intro:
      'A journey is not a route. It is the shape your life makes when you look back at it kindly, and the direction it leans when you stop steering for a moment.',
    framings: {
      theistic: 'Pilgrims call this the road walked with God — every stretch of it, even the deserts.',
      nontheistic: 'No map was issued at birth. The journey is the one you author — that is its weight and its freedom.',
      philosophical: 'Think of it as your examined life in motion: each stage a premise, revised by the next.',
      psychological: 'Your history is not a verdict. It is material — patterns that can be seen, named, and rewoven.',
      emotional: 'A journey is remembered by the body before the mind: places that still warm you, thresholds that still ache.',
      earth: 'Seasons journey without hurry. Yours may be allowed the same rhythm.',
      interspiritual: 'Many traditions, one walking. Your journey may braid rivers that never met before you.',
      seeking: 'Not knowing the destination does not disqualify the journey. It usually begins it.',
    },
    companionLine: 'This is the avenue of journeys, {name}. Walk it at {their} own pace — I will keep alongside.',
    doors: [
      { title: 'Milestones', body: 'Name three moments your path bent — a meeting, a loss, a book, a dawn. Do not explain them yet. Just set them down where you can see them.', kind: 'prompt' },
      { title: 'The present mile', body: 'Describe the stretch you are walking right now in one honest sentence. Flat? Uphill? Fogged? The naming is the work.', kind: 'prompt' },
      { title: 'Direction, not distance', body: 'A journey is measured by orientation, not speed. What are you turned toward this season — even approximately?', kind: 'prompt' },
    ],
  },
  {
    id: 'callings',
    title: 'Callings',
    tagline: 'what keeps asking for you',
    hues: [35, 55],
    emblem: 'bell-simple-ringing',
    intro:
      'A calling is anything that keeps returning to you when the noise dies down — a work, a person, a question, a repair the world seems to have addressed to you by name.',
    framings: {
      theistic: 'Vocation, in the old sense: a voice. What have you been asked to tend?',
      nontheistic: 'No one needs to call for something to be calling. Aptitude meeting need makes a summons of its own.',
      philosophical: 'Call it your daimon or your duty — the task you cannot delegate without losing something of yourself.',
      psychological: 'Notice what you envy and what you grieve; both are fingers pointing at unlived callings.',
      emotional: 'A calling often arrives as a feeling with no sentence attached — a pull, a heat, a homesickness for a place you have not been.',
      earth: 'The land calls quietly: a garden untended, a river unclean, a species unnoticed. Some callings have roots.',
      interspiritual: 'Every tradition has a word for it — dharma, vocation, purpose. The word matters less than the answering.',
      seeking: 'If nothing calls yet, listen longer, not harder. Callings tend to whisper first.',
    },
    companionLine: 'Callings, {name}. Something here may already know {them} by name.',
    doors: [
      { title: 'The returning thing', body: 'What thought, work or care keeps coming back uninvited — in the shower, on walks, at 3am? Write it plainly, without deciding anything about it.', kind: 'prompt' },
      { title: 'One small answer', body: 'A calling never asks for your whole life at once. What is the smallest faithful step you could take this week — one call, one hour, one page?', kind: 'prompt' },
      { title: 'The cost you would pay', body: 'What would you gladly be tired from? The fatigue you would choose is a compass.', kind: 'prompt' },
    ],
  },
  {
    id: 'encounters',
    title: 'Encounters',
    tagline: 'the moments that met you',
    hues: [300, 340],
    emblem: 'sparkle',
    intro:
      'An encounter is a moment that arrived from outside your plans — awe under a night sky, a stranger’s uncanny kindness, a silence that felt inhabited, a coincidence that would not stay small.',
    framings: {
      theistic: 'Some call these visitations, graces, answered prayer. You are allowed to receive them as address.',
      nontheistic: 'No supernatural claim is required. Awe is a documented human capacity — and it is still allowed to change you.',
      philosophical: 'The sublime, the numinous, the limit-experience: philosophy has spent centuries at this door without exhausting it.',
      psychological: 'Peak experiences and moments of flow leave real traces. They deserve integration, not dismissal.',
      emotional: 'Sometimes the encounter is simply being moved to tears without knowing why. That counts. It has always counted.',
      earth: 'A murmuration, a storm front, old-growth silence — the earth is generous with encounters for those who go outside.',
      interspiritual: 'Traditions disagree on the sender; they agree on the mail. Keep what arrived.',
      seeking: 'You may have had encounters you filed away as "weird". This is a safe shelf to take them back down from.',
    },
    companionLine: 'The avenue of encounters. Nothing {name} has felt here needs defending — only remembering.',
    doors: [
      { title: 'The unfiled moment', body: 'Recall one experience you never told anyone because it did not fit your vocabulary. Give it three sentences of honest description — no interpretation yet.', kind: 'prompt' },
      { title: 'Conditions of meeting', body: 'Encounters cannot be manufactured, but they can be made likelier: dark skies, long walks, real silence, undivided attention. Which condition could you restore?', kind: 'prompt' },
      { title: 'What it asked', body: 'Return to one encounter. If it had been a question addressed to you, what was it asking?', kind: 'prompt' },
    ],
  },
  {
    id: 'guidance',
    title: 'Guidance',
    tagline: 'ways of choosing when the fog is thick',
    hues: [190, 220],
    emblem: 'compass',
    intro:
      'Guidance is not being told what to do. It is widening the council you consult — conscience, tradition, reason, body, trusted friends, time — until a direction becomes honest.',
    framings: {
      theistic: 'Discernment is an old craft: prayer, scripture, counsel, and the peace that outlasts the asking.',
      nontheistic: 'Your values are a compass you built yourself. Guidance is checking the needle against your best evidence and your best people.',
      philosophical: 'When in fog, return to first principles: What is good? What is mine to do? What would the person I intend to become choose?',
      psychological: 'Distinguish the anxious voice from the quiet one. Anxiety is loud and urgent; wisdom is usually calm and slightly boring.',
      emotional: 'The body votes early. Where do you feel the yes, and where the dread? Include those ballots.',
      earth: 'Walk the question. Decisions ripen differently under sky than under ceiling.',
      interspiritual: 'Set your councils side by side — the psalm and the study, the elder and the evidence. Let them argue kindly.',
      seeking: 'Not knowing what you believe does not strand you: honesty, patience and counsel work on every path.',
    },
    companionLine: 'Guidance, {name}. Bring the question as it actually is — unpolished is welcome.',
    doors: [
      { title: 'The question, plainly', body: 'Write the decision you are actually facing in one sentence, without softening it. Fog is often just an unasked question.', kind: 'prompt' },
      { title: 'Council of six', body: 'Consult six advisors: your reason, your body, your dearest tradition or principle, a trusted friend, your future self at eighty, and time itself (wait three days). Note each vote.', kind: 'prompt' },
      { title: 'A breath before choosing', body: 'Sixty seconds of slow breathing lowers the noise floor. Four counts in, six counts out. Then read your question again.', kind: 'breath' },
    ],
  },
  {
    id: 'community',
    title: 'Community',
    tagline: 'you were not meant to walk alone',
    hues: [140, 100],
    emblem: 'users-three',
    intro:
      'Every path — monastic or secular, ancient or self-made — eventually says the same thing: find your people. Community is where a private path gains witnesses, correction and warmth.',
    framings: {
      theistic: 'Congregation, sangha, ummah, minyan — the traditions insist on gathering because presence is half the practice.',
      nontheistic: 'Meaning is social. Book circles, volunteer crews, grief groups: secular communion is still communion.',
      philosophical: 'Even Socrates needed an agora; dialogue is how thinking breathes.',
      psychological: 'Attachment is not weakness. Being accurately seen by safe people is one of the strongest interventions we know.',
      emotional: 'Joy shared doubles; sorrow shared halves. The arithmetic is old but it holds.',
      earth: 'A community can include more than humans: the dog, the garden, the watershed you tend with neighbours.',
      interspiritual: 'You may need two tables — one that shares your practice, one that shares your questions. Both are yours to set.',
      seeking: 'Seekers make the best company. Look for rooms where "I don’t know" is said out loud and nobody flinches.',
    },
    companionLine: 'Community. Even with me beside {them}, {name} deserves human voices too.',
    doors: [
      { title: 'Name your two tables', body: 'Who shares your practice (or would)? Who shares your questions? Write actual names. Notice which table is emptier — that is your invitation list.', kind: 'prompt' },
      { title: 'The smaller ask', body: 'Community begins embarrassingly small: one message, one walk, one "want to come with me?". Send one this week.', kind: 'prompt' },
      { title: 'Being findable', body: 'Others are looking for you, too. Where would a person on your path expect to find someone like you — and are you ever there?', kind: 'prompt' },
    ],
  },
  {
    id: 'testimony',
    title: 'Testimony',
    tagline: 'saying what happened, in your own words',
    hues: [15, 350],
    emblem: 'feather',
    intro:
      'Testimony is the practice of telling the truth about your inner life — first to yourself, on a page, and someday, if you choose, to another. What is written here stays in this device. I keep it; I do not send it.',
    framings: {
      theistic: 'Witness is worship in the first person: this happened, and I was there, and so — I believe — was More.',
      nontheistic: 'No belief required to bear witness. "This happened and it mattered" is a complete testimony.',
      philosophical: 'The unexamined life is unlived; the unrecorded examination evaporates. Write to think.',
      psychological: 'Expressive writing is among the best-studied practices we have: naming an experience changes how the mind holds it.',
      emotional: 'Some things stop hurting differently once they are said. The page can bear what a room cannot yet.',
      earth: 'Field notes are testimony: the first frost, the last swallow, what the river did this year — and what you did.',
      interspiritual: 'Your account may quote many languages of the sacred. It is still one voice: yours.',
      seeking: 'Testify to the questions. "I do not know, and here is exactly what I do not know" is a sacred text of its own.',
    },
    companionLine: 'This is the avenue of testimony, {name}. {Their} words stay on {their} own device — I only hold them.',
    doors: [
      { title: 'Write it down', body: 'One true paragraph about where your path is right now. No style points. Begin with "Right now" if the page stares back.', kind: 'journal' },
    ],
  },
  {
    id: 'experience',
    title: 'Experience',
    tagline: 'practices, not just ideas',
    hues: [265, 285],
    emblem: 'wind',
    intro:
      'A path becomes real in the body and the calendar or not at all. Experience is the avenue of practice: small, repeatable acts of attention that any tradition — or none — can carry.',
    framings: {
      theistic: 'Prayer, liturgy, fasting, sabbath: the old technologies of attention, still in working order.',
      nontheistic: 'Meditation without metaphysics, gratitude without an addressee, awe walks with both feet on the ground — all fully functional.',
      philosophical: 'The Stoics journaled at dawn and reviewed at dusk; philosophy was a set of exercises long before it was a syllabus.',
      psychological: 'Attention training, breathwork, savouring — practices with an evidence base as well as a lineage.',
      emotional: 'Practice can be as simple as letting one feeling finish. Most are interrupted; few are completed.',
      earth: 'Tend something living daily. Watering a plant slowly enough is indistinguishable from prayer.',
      interspiritual: 'Borrow practices with respect: learn where they come from, keep their names, honour their depth.',
      seeking: 'Sample honestly: two minutes of stillness today. Data first, doctrine later — or never. Both are allowed.',
    },
    companionLine: 'Experience — where the path enters the hands. Two minutes, {name}; that is enough to begin.',
    doors: [
      { title: 'A breath together', body: 'Stay with me for a few slow breaths. In for four, out for six. I will hold the count with you.', kind: 'breath' },
      { title: 'The two-minute rule', body: 'Choose one practice small enough to survive your worst day — two minutes of stillness, one line of gratitude, one look at the sky. Anchor it to something you already do.', kind: 'prompt' },
      { title: 'Savour one thing', body: 'Pick one ordinary thing today — tea, light on a wall, a voice — and give it your full attention until it finishes. Report nothing. Just attend.', kind: 'prompt' },
    ],
  },
  {
    id: 'consolidation',
    title: 'Consolidation',
    tagline: 'gathering what the road has given',
    hues: [45, 25],
    emblem: 'basket',
    intro:
      'Every so often a path asks to be gathered: what has held, what has fallen away, what deserves to be carried forward on purpose. Consolidation is harvest, not conclusion.',
    framings: {
      theistic: 'Call it an examen over a season: where was I met? Where did I hide? What is being asked next?',
      nontheistic: 'A life audit without judgment: which practices earned their place? Which beliefs retired honourably?',
      philosophical: 'Revisit your premises annually; a worldview, like a ship, needs its hull inspected.',
      psychological: 'Integration is where change becomes character. Slow is not a failure mode here; slow is the mechanism.',
      emotional: 'Some seasons only make sense at their funeral. Grieve what ended; thank it; keep its gift.',
      earth: 'The orchard does not apologize for winter. Fallow is part of the rotation.',
      interspiritual: 'Weave the year’s threads into one cloth and notice: it is a pattern no single tradition could have made.',
      seeking: 'Consolidate the search itself: what have you ruled out? That, too, is hard-won ground.',
    },
    companionLine: 'Consolidation, {name}. Let {them} gather slowly — nothing here is graded.',
    doors: [
      { title: 'Kept, released, carried', body: 'Three short lists for this season: what you are keeping, what you are releasing, what you are carrying forward deliberately.', kind: 'prompt' },
      { title: 'One sentence of ground', body: 'Finish this sentence so it is true enough to stand on: "Whatever else, I have come to trust that…"', kind: 'prompt' },
      { title: 'Read your testimony', body: 'If you have written in the avenue of testimony, return and reread the oldest entry. Notice who wrote it. Notice who is reading it.', kind: 'prompt' },
    ],
  },
];

export function avenueById(id: string): Avenue | undefined {
  return AVENUES.find((a) => a.id === id);
}
