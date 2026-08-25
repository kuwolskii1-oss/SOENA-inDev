/**
 * The eleven support paths — SOENA's "Find your path".
 *
 * SOENA is a tailored support companion for people navigating spiritual
 * manipulation, spiritual fatigue, religious trauma and difficult
 * spiritual transitions. The founding principle: nobody should have to
 * figure out where they belong before they can receive support. So the
 * product begins from the person's situation, not from a category.
 *
 * Each path carries three layers, in this order on purpose:
 *   1. "You might be feeling…"  — validation FIRST. This audience
 *      expects judgment; recognition is what builds trust.
 *   2. "Steady steps"           — small, concrete, non-prescriptive.
 *   3. "Talk to SOENA about this" — the chat opens with a greeting
 *      written for this exact situation, and the context travels.
 *
 * Design principles honoured throughout (see the product overview):
 *   · validation before instruction     · belief neutrality
 *   · cultural respect                  · user-led goals
 *   · no reinforcement of unverifiable threats (the fear is real and
 *     treated as real; the threat is neither confirmed nor mocked)
 *   · safety before progress            · context continuity
 */
import type { IconName } from '../ui/icons';

export interface PathOption {
  id: string;
  label: string;
  /** Routes the summary to urgent guidance (e.g. payments still leaving). */
  urgent?: boolean;
}

export interface SupportPath {
  id: string;
  title: string;
  /** Who this is for — one honest line under the title. */
  who: string;
  icon: IconName;
  /** "You might be feeling…" — in the person's own likely words. */
  feelings: string[];
  /** "Steady steps" — concrete, small, immediately possible. */
  steps: string[];
  /** A special-care framing note, shown quietly on the path. */
  note?: string;
  /** The chat greeting for this exact situation. */
  greeting: string;
  /** Layer 1 of the guided pathway: where they are in it. */
  stages: PathOption[];
  /** Layer 2: the path-tailored dissection. */
  specifics: { question: string; options: PathOption[] };
  /** Urgent guidance, shown on the summary when an urgent option was chosen. */
  urgentGuidance?: string;
}

export const PATHS: SupportPath[] = [
  {
    id: 'leaving-group',
    title: 'Leaving a cult or high-control group',
    who: 'For those inside, thinking of leaving, or recently left.',
    icon: 'door-open',
    feelings: [
      'Afraid of what happens if they find out',
      'Guilty for even thinking about leaving',
      'Unsure what was real and what was control',
      'Grieving people who are still inside',
      'Free and lost at the same time',
      'Angry that the good memories are tangled up in it',
    ],
    steps: [
      'You do not have to decide everything today. "Still deciding" is a legitimate place to stand.',
      'Write down, somewhere only you can reach, one thing you were told that turned out not to be true. One is enough to start.',
      'Keep one relationship that has nothing to do with the group — a colleague, a cousin, an old friend. One outside voice changes the acoustics.',
      'If you have left: expect the pull to return in lonely weeks, not strong ones. That pull is a habit, not a verdict.',
      'Leaving in stages is still leaving. Quietly skipping one meeting counts.',
    ],
    greeting:
      'You found this path — the one about leaving a group that held too much of you. Wherever you are with it, inside or out or somewhere between, you can say it plainly here. Nothing you say leaves this device. Where are you standing today?',
    stages: [
      { id: 'inside-thinking', label: 'Still inside, thinking about leaving' },
      { id: 'planning', label: 'Quietly planning my way out' },
      { id: 'recent', label: 'Left recently — still shaky' },
      { id: 'while-ago', label: 'Left a while ago, still untangling' },
    ],
    specifics: {
      question: 'What did the group control most?',
      options: [
        { id: 'time', label: 'My time and daily life' },
        { id: 'people', label: 'Who I could see and love' },
        { id: 'money', label: 'My money or work' },
        { id: 'thoughts', label: 'What I was allowed to think or doubt' },
      ],
    },
  },
  {
    id: 'raised-inside',
    title: 'Raised inside it',
    who: 'For those who experienced indoctrination in childhood.',
    icon: 'home',
    feelings: [
      'Like I never chose any of this — it chose me',
      'Homesick for something that also hurt me',
      'Behind everyone who grew up "normal"',
      'Guilty toward my family for questioning',
      'Unsure which parts of me are mine',
      'Angry at how early it started',
    ],
    steps: [
      'You were a child. Whatever you believed, repeated or did back then was survival and belonging, not a choice you owe anyone an apology for.',
      'Make a small list titled "mine anyway" — tastes, jokes, instincts that survived from before anyone shaped you. It is longer than you think.',
      'You are allowed to learn the ordinary things late — how money works, how dating works, what a weekend is for. Late is not less.',
      'Questioning your upbringing is not betraying your family. Two things can be true: they meant love, and it still cost you.',
      'Find one story of someone raised the same way who built a life. Proof of possibility beats advice.',
    ],
    greeting:
      'This is the path for people who did not walk in — they were born inside. That changes everything: the leaving, the guilt, the family. I will not talk about your childhood as if it were a mistake you made. Where does it sit with you today?',
    stages: [
      { id: 'still-in', label: 'Still in it — it is all I know' },
      { id: 'doubting', label: 'Beginning to doubt what I was raised in' },
      { id: 'one-foot', label: 'One foot out, family still in' },
      { id: 'out', label: 'Out — rebuilding from the ground up' },
    ],
    specifics: {
      question: 'What shaped you most, growing up inside?',
      options: [
        { id: 'fear', label: 'Fear — of punishment, hell, or outside' },
        { id: 'separateness', label: 'Being kept separate from other kids' },
        { id: 'roles', label: 'The role I was given before I could choose' },
        { id: 'silence', label: 'Questions being unwelcome or dangerous' },
      ],
    },
  },
  {
    id: 'manipulated',
    title: 'Manipulated by a prophet, psychic, medium, or healer',
    who: 'For those who were deceived, controlled, or spiritually manipulated.',
    icon: 'eye',
    feelings: [
      'Stupid for having believed — though you were not',
      'Ashamed to tell anyone what happened',
      'Confused, because some of it felt so real',
      'Watched, even now',
      'Angry at them and at myself in the same breath',
      'Afraid of what they might still "see" or do',
    ],
    steps: [
      'Being deceived by a skilled operator is not gullibility. These techniques are old, rehearsed and effective on intelligent people — that is why they persist.',
      'Stop explaining the experience to yourself in their vocabulary. Describe what happened in plain words: what was said, what was paid, what was promised.',
      'Cut the channel, not just the belief: block the numbers, mute the pages. Influence needs contact.',
      'Write down two predictions or claims they made that did not come true. The record is your ally; memory alone bends toward fear.',
      'If money moved, keep every receipt and message. You do not have to decide today what to do with them — just keep them.',
    ],
    greeting:
      'This path is for people who put their trust in someone who claimed to see more — and were used through it. That trust was not foolishness; it was the most human thing about the whole story. You can tell me what happened in plain words, or not yet. What weighs most right now?',
    stages: [
      { id: 'still-seeing', label: 'Still seeing or paying them' },
      { id: 'doubting', label: 'Doubting, but afraid to break away' },
      { id: 'broke-away', label: 'Broke away recently' },
      { id: 'long-out', label: 'Out for a while — still carrying it' },
    ],
    specifics: {
      question: 'What did they use most to hold you?',
      options: [
        { id: 'hope', label: 'Hope — healing, love, a breakthrough' },
        { id: 'fear', label: 'Fear — warnings of what would happen if I left' },
        { id: 'secrets', label: 'What I had confided in them' },
        { id: 'authority', label: 'Their spiritual authority — who I was to question it' },
      ],
    },
  },
  {
    id: 'financial',
    title: 'Financially exploited',
    who: 'For those who experienced financial pressure, coercion, or exploitation.',
    icon: 'banknote',
    feelings: [
      'Sick when I think about the amounts',
      'Ashamed to tell anyone how much',
      'Afraid of what stopping the payments will bring',
      'Trapped — the giving is tangled with belonging',
      'Angry, with nowhere to put it',
      'Worried it is too late to matter',
    ],
    steps: [
      'The shame belongs to the person who engineered the giving, not the one who gave. Generosity was the quality they exploited; it is still a quality.',
      'Add it up once, privately, and then stop re-counting it. You need the number to make decisions — not to punish yourself with.',
      'Gather the paper: statements, transfers, messages that asked for money. Evidence keeps options open, even options you never use.',
      'If payments still leave your account, the first step is mechanical, not spiritual: cancel the order, move the account, tell the bank. It can be done before any conversation.',
      'Sums do not measure worth. People have given houses. The size of what you gave proves the size of the pressure, nothing else.',
    ],
    greeting:
      'This is the path where money and faith got tangled — where giving stopped being a choice. However much it was, you will hear no judgment from me about the amount, in either direction. Is money still moving, or are you carrying what already went?',
    stages: [
      { id: 'still-paying', label: 'Still paying — I cannot see how to stop', urgent: true },
      { id: 'pressured', label: 'Being pressured to give more', urgent: true },
      { id: 'stopped-recent', label: 'Stopped recently — bracing for the fallout' },
      { id: 'stopped-ago', label: 'Stopped a while ago — the shame stayed' },
    ],
    specifics: {
      question: 'How was the giving held in place?',
      options: [
        { id: 'blessing', label: 'Promises — blessing, healing, breakthrough' },
        { id: 'threat', label: 'Warnings about what withholding would cost me' },
        { id: 'status', label: 'Standing — my place in the community depended on it' },
        { id: 'automatic', label: 'It became automatic — orders, debits, habits' },
      ],
    },
    urgentGuidance:
      'Because money is still moving: the stopping is practical before it is spiritual. A standing order can be cancelled at the bank without any conversation with the group or leader — the bank acts on your instruction alone, and you can ask them about disputing pressured payments. If you fear retaliation, do the mechanical steps first and the conversations later, with someone beside you. If threats follow, that is no longer a spiritual matter; it is one for the authorities.',
  },
  {
    id: 'curses-fear',
    title: 'Afraid after curses, hexes, or prophecies',
    who: 'For those living in fear after spiritual threats or warnings.',
    icon: 'moon-star',
    feelings: [
      'Scared something is coming for me or my family',
      'Unable to sleep since the words were spoken',
      'Watching for signs in everything',
      'Foolish for being afraid, and afraid anyway',
      'Alone with it — people would laugh or worry',
      'Tired of bracing all the time',
    ],
    steps: [
      'Your fear is real and it is doing real things to your body and sleep. That is what needs tending first — no position on the curse itself is required to begin.',
      'Notice who benefits from your fear. Spoken threats that keep you paying, returning, or obedient are a technique with a long history, whatever else they are.',
      'Keep a simple two-column record: what was predicted, what actually happened. Fear tells you the record is dangerous to keep. It is the opposite.',
      'The body cannot out-think dread at 3am. Give it something bodily instead: the long exhale, cold water on the wrists, a lit room. Small, unglamorous, effective.',
      'A frightening word said over you is not consent. You did not agree to carry it, and carrying it is not loyalty to anyone.',
    ],
    note: 'SOENA takes your fear seriously without ruling on what stands behind it. The fear is treated as real — because it is — and the threat is neither confirmed nor mocked.',
    greeting:
      'Someone spoke something over you, and it has been living in your chest since. I will not laugh at that, and I will not feed it either. Your fear is real and we will treat it with respect. When is it loudest — nights, or all through the day?',
    stages: [
      { id: 'fresh', label: 'It was said recently — the fear is fresh' },
      { id: 'months', label: 'I have carried it for months' },
      { id: 'years', label: 'Years — it surfaces when life goes wrong' },
      { id: 'for-family', label: 'The threat was aimed at someone I love' },
    ],
    specifics: {
      question: 'Who spoke the curse or warning?',
      options: [
        { id: 'leader', label: 'A spiritual leader or healer' },
        { id: 'family', label: 'Someone in my own family' },
        { id: 'practitioner', label: 'A practitioner I once consulted' },
        { id: 'community', label: 'The community I left or crossed' },
      ],
    },
  },
  {
    id: 'african-traditional',
    title: 'Stepping away from African traditional practices',
    who: 'Culture stays yours; only the practice is being reevaluated.',
    icon: 'leaf',
    feelings: [
      'Guilty — as if leaving the practice betrays my people',
      'Afraid of ancestral consequences',
      'Torn between elders I love and a practice I need distance from',
      'Judged from both directions — traditional and modern',
      'Unsure what I am allowed to keep',
      'Lonely in a decision nobody around me understands',
    ],
    steps: [
      'Hold this distinction where you can see it: your culture is not on trial. Language, food, music, respect for elders, the names of your people — all of it stays yours. Only a practice is being reevaluated.',
      'You can honour your grandmother and decline the ritual. Love for your people and distance from a practice can live in the same person; you may be the first in your family to hold both, which is hard, not wrong.',
      'Decide your boundary before the next family gathering, in one sentence you can actually say. A prepared sentence beats a cornered improvisation.',
      'Expect grief as well as relief. Practices carry memory — stepping back can feel like losing people who are still alive. That grief deserves room, not shame.',
      'Keep what is yours to keep: the stories, the values under the rituals, the sense of lineage. Reverence for where you come from does not require any particular ceremony.',
    ],
    note: 'SOENA will never frame this path as rejecting your heritage. Culture stays yours; only the practice is being reevaluated. That distinction is the whole spirit of this path.',
    greeting:
      'This path holds a careful distinction, and I will hold it with you: your culture is yours and stays yours — the language, the people, the pride. What is being reevaluated is a practice, not a heritage. Where does the pull feel strongest — the family, the fear, or the guilt?',
    stages: [
      { id: 'practicing', label: 'Still practicing, but questioning' },
      { id: 'quiet-distance', label: 'Quietly keeping distance, family does not know' },
      { id: 'open', label: 'Openly stepped back — managing the reaction' },
      { id: 'long-back', label: 'Stepped back long ago — the guilt remains' },
    ],
    specifics: {
      question: 'What makes the stepping away heaviest?',
      options: [
        { id: 'elders', label: 'The elders and family it may wound' },
        { id: 'consequences', label: 'Fear of ancestral or spiritual consequences' },
        { id: 'identity', label: 'Feeling less connected to my people' },
        { id: 'obligations', label: 'Obligations and ceremonies still expected of me' },
      ],
    },
  },
  {
    id: 'leaving-religion',
    title: 'Leaving a religion',
    who: 'For those leaving or questioning Christianity, Islam, Hinduism, New Age, or any faith.',
    icon: 'signpost',
    feelings: [
      'Afraid of hell, karma, or whatever was promised to leavers',
      'Grieving a certainty that used to hold me',
      'Dreading the conversation with my family',
      'Free on some days, hollow on others',
      'Unsure what I believe now — and rushed to decide',
      'Missing the community more than the doctrine',
    ],
    steps: [
      'You do not need a finished worldview to take a step. "I no longer believe that" can stand alone for a long time before "I now believe this" arrives — if it ever needs to.',
      'Separate the three losses: the belief, the community, the rhythm of the week. They heal on different schedules, and naming which one aches today makes the ache tractable.',
      'The fear of punishment usually outlives the belief in it. That is conditioning doing its work, not evidence. It fades with time and honest company.',
      'You choose the pace of disclosure. Nobody is owed your deconversion on their schedule — a quiet season of privacy is not dishonesty.',
      'Keep or rebuild one ritual that is yours alone — a walk, a candle, a morning page. The shape of practice can survive the change of its content.',
    ],
    greeting:
      'Leaving a faith — or standing in the doorway wondering — loses you three things at once: the beliefs, the people, and the shape of your weeks. Whichever of those aches most today is where we can start. And if you do not know what you believe now, that is a fine place to stand.',
    stages: [
      { id: 'doubting', label: 'Still in, quietly doubting' },
      { id: 'one-foot-out', label: 'One foot out — attending but absent' },
      { id: 'left-private', label: 'Left, but few people know' },
      { id: 'left-open', label: 'Left openly — living the consequences' },
    ],
    specifics: {
      question: 'What holds the most weight in the leaving?',
      options: [
        { id: 'punishment', label: 'Fear of what leaving is said to bring' },
        { id: 'family', label: 'What it does to my family' },
        { id: 'community', label: 'Losing my community and belonging' },
        { id: 'meaning', label: 'The hole where certainty used to be' },
      ],
    },
  },
  {
    id: 'the-gift',
    title: '“I no longer want the gift”',
    who: 'For mediums, seers, prophets, preachers, and traditional healers who want out.',
    icon: 'wand-sparkles',
    feelings: [
      'Exhausted by being everyone’s access to the divine',
      'Trapped in a role I never fully chose',
      'Afraid of what leaving does to my income and standing',
      'Guilty toward the people who depend on me',
      'Unsure who I am if I am not "the gifted one"',
      'Afraid the gift itself will not let me go',
    ],
    steps: [
      'Call this what it is: a vocational exit. You are leaving a role that carried identity, income and community at once — of course it is heavy. Treat it with the seriousness of leaving any consuming vocation.',
      'Separate the three strands on paper: what leaving costs in identity, in income, in community. Each strand has practical moves the others do not.',
      'You are allowed to stop being the door other people walk through to reach meaning. Their access was never meant to cost you yourself.',
      'Plan the income bridge like any career change: what you can do, who would pay for it, how many months of runway. The mundane plan is what makes the spiritual exit possible.',
      'Step down in stages if you need to: fewer sittings, fewer services, longer gaps. A role can be left the way it was entered — gradually.',
    ],
    note: 'SOENA treats leaving as a real vocational exit — identity, income, and community loss all at once — not as a small change of mind.',
    greeting:
      'This path is for the person everyone else brings their questions to — the one with the gift, who wants to set it down. That is a vocational exit: identity, income and community all at once, and almost nobody around you can hear it said aloud. Here you can say it. Which strand is pulling hardest?',
    stages: [
      { id: 'practicing-out', label: 'Still practicing, but I want out' },
      { id: 'reducing', label: 'Quietly reducing — fewer sittings, fewer services' },
      { id: 'stopped-backlash', label: 'Stopped — facing the backlash' },
      { id: 'stopped-rebuilding', label: 'Stopped — rebuilding who I am without it' },
    ],
    specifics: {
      question: 'What holds you in the role most?',
      options: [
        { id: 'income', label: 'The income — it feeds my household' },
        { id: 'dependents', label: 'The people who depend on me spiritually' },
        { id: 'identity', label: 'It is who I have been my whole life' },
        { id: 'fear-gift', label: 'Fear of what refusing the gift may bring' },
      ],
    },
  },
  {
    id: 'questioning',
    title: 'Questioning, confused, or seeking meaning',
    who: 'For those unsure what’s wrong but know they are questioning, seeking answers, or trying to understand.',
    icon: 'help-circle',
    feelings: [
      'Unsettled, without being able to say why',
      'Like the old answers stopped working',
      'Envious of people who seem certain',
      'Afraid of where the questions lead',
      'Restless — searching without a name for what I seek',
      'Quietly hopeful, underneath it all',
    ],
    steps: [
      'Nothing needs to be wrong for you to be here. Questioning is not a malfunction; it is often the first honest breath after a long time holding one.',
      'Write the actual question down. "What do I believe about death?" is workable; a vague dread is not. Precision drains fear.',
      'Resist the rush to a new certainty. The space between worldviews is uncomfortable and fertile — most people bolt from it too early.',
      'Follow what genuinely moves you — a book, a landscape, a conversation — rather than what you feel you ought to explore. Curiosity is better navigation than duty.',
      'Talk to one person who handles your questions without flinching or recruiting. One is enough.',
    ],
    greeting:
      'You do not need a crisis to deserve company — questioning is reason enough. Whatever is stirring, we can look at it slowly, without rushing you to any conclusion. I have no side in what you end up believing. What has been circling lately?',
    stages: [
      { id: 'start', label: 'The questions have just started' },
      { id: 'while', label: 'I have been circling them for a while' },
      { id: 'shaken', label: 'Something happened that shook what I believed' },
      { id: 'seeking', label: 'Actively seeking — reading, visiting, asking' },
    ],
    specifics: {
      question: 'Where do the questions press hardest?',
      options: [
        { id: 'meaning', label: 'Meaning — what any of it is for' },
        { id: 'belief', label: 'Belief — what is actually true' },
        { id: 'belonging', label: 'Belonging — where my people are' },
        { id: 'mortality', label: 'Mortality — what death makes of life' },
      ],
    },
  },
  {
    id: 'loved-one',
    title: 'Supporting a loved one',
    who: 'For family and friends supporting someone through a difficult spiritual journey.',
    icon: 'heart-handshake',
    feelings: [
      'Helpless watching someone I love be pulled away',
      'Afraid of pushing them further in by saying the wrong thing',
      'Angry at the people influencing them',
      'Grieving someone who is still alive',
      'Exhausted by being careful all the time',
      'Guilty whenever I take a break from worrying',
    ],
    steps: [
      'Keep the bridge open. Ultimatums and debates close it; ordinary love — birthdays remembered, meals shared, jokes kept — keeps it crossable for the day they look for a way back.',
      'Do not argue with the doctrine; stay curious about their experience. "What is it giving you?" opens more doors than "How can you believe that?"',
      'Be the person who never humiliates them. If they leave one day, they will walk toward whoever made room for their dignity.',
      'Set your own limits without theatre: what you will not fund, host or attend — said once, kindly, and kept.',
      'Tend your own life. Your steadiness is the argument no one can rebut, and you cannot pour from an empty vessel.',
    ],
    greeting:
      'This path is yours, not theirs — the one for the person standing on the shore. Loving someone through a difficult spiritual passage is its own long walk, and your exhaustion counts too. Tell me about them, or about you; both belong here.',
    stages: [
      { id: 'drifting', label: 'They are drifting in — I am watching it start' },
      { id: 'deep', label: 'They are deep inside — contact is strained' },
      { id: 'leaving', label: 'They are trying to leave — I want to help right' },
      { id: 'aftermath', label: 'They are out — we are both in the aftermath' },
    ],
    specifics: {
      question: 'What is hardest for you right now?',
      options: [
        { id: 'contact', label: 'Keeping contact without conflict' },
        { id: 'watching', label: 'Watching choices I cannot influence' },
        { id: 'household', label: 'The strain inside our own household' },
        { id: 'own-grief', label: 'My own grief and exhaustion' },
      ],
    },
  },
  {
    id: 'religious-trauma',
    title: 'Healing religious trauma',
    who: 'For those wanting to heal the impact of religious or spiritual trauma.',
    icon: 'hand-heart',
    feelings: [
      'Flinching at things that are supposed to be comforting',
      'Struggling to trust anyone who sounds certain',
      'Ashamed of how long the wounds are taking',
      'Angry at what was done in the name of the sacred',
      'Numb where feeling used to be',
      'Hoping healing is possible, and afraid to hope',
    ],
    steps: [
      'What happened to you has a name, and reacting to it is not weakness — it is a nervous system doing exactly what nervous systems do after harm.',
      'Healing is not linear and its length is not a grade. A hard week after three good ones is a wave, not a relapse.',
      'You are allowed to avoid what activates you — the buildings, the music, the phrases — for as long as avoidance serves you. Exposure is a choice, made when you are resourced, never an obligation.',
      'Grieve what was taken alongside what was done: years, ease, a first innocence about the sacred. Loss unnamed becomes weight; named, it becomes grief, and grief moves.',
      'A trauma-informed therapist who respects your pace — and your beliefs, whatever they now are — is worth the search. SOENA walks beside that work; it does not replace it.',
    ],
    greeting:
      'This path is for the wounds that came dressed as holiness. They are real wounds, and none of what you feel about them is too much. We go at your pace here — slow is welcome, and stopping is always allowed. What does today feel like?',
    stages: [
      { id: 'naming', label: 'Just beginning to call it what it was' },
      { id: 'active', label: 'In the thick of it — symptoms are loud' },
      { id: 'working', label: 'Actively working on healing' },
      { id: 'far-along', label: 'Far along — tending what remains' },
    ],
    specifics: {
      question: 'Where does the impact show most?',
      options: [
        { id: 'body', label: 'My body — sleep, panic, flinches' },
        { id: 'trust', label: 'Trust — in people, groups, my own judgment' },
        { id: 'worth', label: 'Worth — the old messages about being bad' },
        { id: 'meaning', label: 'Meaning — the sacred itself feels unsafe' },
      ],
    },
  },
];

/* ---------------------------------------------------------------- */
/* The shared pathway layers (3–6): feelings, impact, support, goal  */
/* ---------------------------------------------------------------- */

/** Layer 3 — the strongest emotion right now, in likely words. */
export const FEELING_OPTIONS: PathOption[] = [
  { id: 'scared', label: 'I’m scared' },
  { id: 'confused', label: 'I’m confused' },
  { id: 'guilty', label: 'I feel guilty' },
  { id: 'angry', label: 'I’m angry' },
  { id: 'trapped', label: 'I feel trapped' },
  { id: 'unsure', label: 'I don’t know what to believe' },
];

/** Layer 4 — which areas of life are affected (multi-select). */
export const IMPACT_OPTIONS: PathOption[] = [
  { id: 'sleep', label: 'Sleep' },
  { id: 'money', label: 'Money' },
  { id: 'family', label: 'Family' },
  { id: 'identity', label: 'Identity' },
  { id: 'community', label: 'Community' },
  { id: 'fear', label: 'Fear' },
];

/** Layer 5 — who knows what's happening. The unsafe option raises the
 *  safety card immediately: safety before progress. */
export const SUPPORT_OPTIONS: PathOption[] = [
  { id: 'family', label: 'A family member' },
  { id: 'friend', label: 'A friend' },
  { id: 'leader', label: 'A spiritual leader' },
  { id: 'no-one', label: 'No one' },
  { id: 'unsafe', label: 'I don’t feel safe right now', urgent: true },
];

/** Layer 6 — what they want from SOENA right now. Maps onto the five
 *  7-day journeys. */
export const GOAL_OPTIONS: Array<PathOption & { journey: string; closing: string }> = [
  {
    id: 'understand',
    label: 'Understand what happened',
    journey: 'clarity',
    closing: 'Understanding is the slowest door and the one that stays open. We will take it apart piece by piece, at your pace.',
  },
  {
    id: 'calm',
    label: 'Calm the fear',
    journey: 'steady',
    closing: 'The fear gets tended first — body first, explanations later. Small practices, done gently, most days.',
  },
  {
    id: 'exit',
    label: 'Plan an exit',
    journey: 'doorway',
    closing: 'An exit is a plan, not a leap. We will draw the map together — quietly, safely, one rung at a time.',
  },
  {
    id: 'rebuild',
    label: 'Rebuild',
    journey: 'roots',
    closing: 'Rebuilding starts with what survived. There is more standing than it feels like from inside.',
  },
  {
    id: 'talk',
    label: 'Just talk',
    journey: 'company',
    closing: 'Then no tasks and no program — just company, whenever you want it. That is a complete answer.',
  },
];

export function pathById(id: string): SupportPath | undefined {
  return PATHS.find((p) => p.id === id);
}
