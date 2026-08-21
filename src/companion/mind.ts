/**
 * SOENA's mind — the scripted intelligence behind the conversation.
 *
 * The LISA lesson, applied: the "AI" is careful writing. Every reply is
 * composed from parts — a mirror of what was said, a register-true body
 * (theistic ears hear presence, non-theistic ears hear meaning made,
 * psychological ears hear patterns), an optional short attributed quote or
 * book pointer from the library, a lore callback, and, only when the
 * atmosphere allows, a little levity. An LLM can later sit behind the same
 * interface (see `llmBridge`) without changing the companion's face.
 */
import { fill, loadProfile } from '../core/profile';
import { addLore, lastThread, recallLore, setThread, toldLore } from '../core/lore';
import { pickQuote, suggestWorks, type Work } from '../data/library';
import { avenueById } from '../data/avenues';

export interface MindReply {
  text: string;
  /** Element selector SOENA should point at, if the reply refers to UI. */
  pointAt?: string;
  mood?: string;
}

/** Future hook: plug a real model in behind the same face. */
export let llmBridge: ((input: string, context: string) => Promise<string>) | null = null;
export function setLlmBridge(fn: typeof llmBridge): void {
  llmBridge = fn;
}

/* ------------------------------------------------------------------ */
/* Rapport — whether the room is warm enough for jokes                 */
/* ------------------------------------------------------------------ */

const RAPPORT_KEY = 'soena.rapport.v1';

function rapport(): number {
  try {
    return Number(localStorage.getItem(RAPPORT_KEY) ?? '0');
  } catch {
    return 0;
  }
}
function bumpRapport(by: number): void {
  try {
    localStorage.setItem(RAPPORT_KEY, String(Math.max(0, Math.min(20, rapport() + by))));
  } catch {
    /* session-only rapport */
  }
}

/* ------------------------------------------------------------------ */
/* Reading the room                                                    */
/* ------------------------------------------------------------------ */

interface Reading {
  themes: string[];
  heavy: boolean;
  playful: boolean;
  wantsBook: boolean;
  wantsQuote: boolean;
  remember?: string;
  ask?: 'show' | 'recall' | 'greeting' | 'thanks' | 'joke' | 'whoami';
  showTarget?: string;
}

const THEME_WORDS: Record<string, string[]> = {
  grief: ['grief', 'loss', 'lost', 'died', 'death', 'mourning', 'miss her', 'miss him', 'miss them', 'funeral', 'gone'],
  meaning: ['meaning', 'pointless', 'purpose', 'why am i', 'what for', 'empty', 'direction', 'lost my way'],
  doubt: ['doubt', 'believe anymore', 'faith is', 'not sure i believe', 'agnostic', 'questioning'],
  fear: ['afraid', 'scared', 'anxious', 'anxiety', 'panic', 'worried', 'dread'],
  peace: ['calm', 'peace', 'quiet', 'still', 'rest', 'overwhelmed', 'stressed', 'burnout', 'tired'],
  love: ['love', 'relationship', 'partner', 'marriage', 'heartbreak', 'breakup', 'lonely', 'alone'],
  forgiveness: ['forgive', 'forgiveness', 'resent', 'grudge', 'betrayed', 'apolog'],
  discipline: ['habit', 'discipline', 'routine', 'procrastinat', 'consistent', 'lazy', 'focus'],
  awe: ['awe', 'stars', 'universe', 'vast', 'wonder', 'sublime', 'night sky'],
  joy: ['happy', 'joy', 'grateful', 'gratitude', 'celebrate', 'good news', 'excited'],
  purpose: ['calling', 'vocation', 'career', 'work feels', 'quit my job', 'what should i do with my life'],
  suffering: ['suffering', 'pain', 'hurt', 'unbearable', 'why me', 'unfair'],
  courage: ['courage', 'brave', 'risk', 'scared to try', 'leap'],
  humanNature: ['people are', 'human nature', 'why do people', 'humanity'],
};

const HEAVY = ['grief', 'suffering', 'fear', 'love'];

function read(input: string): Reading {
  const s = input.toLowerCase().trim();
  const themes = Object.entries(THEME_WORDS)
    .filter(([, words]) => words.some((w) => s.includes(w)))
    .map(([theme]) => theme);

  const r: Reading = {
    themes,
    heavy: themes.some((t) => HEAVY.includes(t)) || /suicid|self.?harm|hopeless/.test(s),
    playful: /haha|lol|lmao|�„|😂|😆|joke|kidding|😏/.test(s) || /!{2,}/.test(s),
    wantsBook: /\b(book|read|reading|recommend|suggest|documentary|watch|chapter|treatise)\b/.test(s),
    wantsQuote: /\b(quote|saying|said|words from|line from)\b/.test(s),
  };

  const remember = s.match(/^(?:remember(?: this)?|keep this|hold this)[:,]?\s+(.{3,})/i);
  if (remember) r.remember = input.slice(input.length - remember[1].length);

  if (/^(what|tell me what)('s| is| do)? ?(you )?(remember|know about me)/.test(s) || s.includes('what do you remember')) r.ask = 'recall';
  else if (/^(hi|hey|hello|good (morning|evening|afternoon)|yo)\b/.test(s)) r.ask = 'greeting';
  else if (/^(thanks|thank you|ty|appreciate)/.test(s)) r.ask = 'thanks';
  else if (/tell me a joke|make me laugh|something funny/.test(s)) r.ask = 'joke';
  else if (/who are you|what are you/.test(s)) r.ask = 'whoami';

  const show = s.match(/(?:show me|where (?:is|are)|take me to|point (?:me )?(?:to|at))\s+(?:the )?([a-z ]+)/);
  if (show) {
    r.ask = 'show';
    r.showTarget = show[1].trim();
  }
  return r;
}

/* ------------------------------------------------------------------ */
/* Registers — how each path hears the same truth                      */
/* ------------------------------------------------------------------ */

type Register = (theme: string) => string;

const REGISTERS: Record<string, Register> = {
  theistic: (t) =>
    ({
      grief: 'The traditions say grief is love with nowhere to go — and that the Presence sits with mourners longer than with victors. {Name}, you do not carry this alone.',
      meaning: 'Maybe meaning is less something you find and more Someone you answer. What has been asking for {them} lately?',
      doubt: 'Doubt has an honored seat in every serious faith — the psalmists shouted theirs. A faith that cannot hold questions was never load-bearing.',
      fear: 'Fear is the oldest prayer there is. Say it as one, and notice you are no longer holding it by yourself.',
      peace: 'Stillness is not emptiness in your tradition — it is attendance. Even five quiet minutes can be kept like a small sabbath.',
      default: 'Hold it up to the light you pray by, {name}. What does it look like from there?',
    })[t] ?? REGISTERS.theistic('default'),
  nontheistic: (t) =>
    ({
      grief: 'No cosmic ledger needs to exist for this loss to matter — it matters because you loved. Grief is the receipt of that, and it is yours to keep.',
      meaning: 'Nobody issued meaning at the door — which means yours is authored, not assigned. That is heavier and freer at the same time. What would you write first?',
      doubt: 'You are allowed to walk away from claims that stopped being true for you. Honesty is a spiritual discipline too — maybe the first one.',
      fear: 'Fear is old machinery doing its job too well. Name it precisely, and it shrinks to the size of the actual problem.',
      peace: 'Attention is the only currency you fully own. Spending five minutes of it on one thing — breath, light, a tree — is rest with evidence behind it.',
      default: 'Look at it the way you would want a clear-eyed friend to: kindly, and without decoration. What do you actually see?',
    })[t] ?? REGISTERS.nontheistic('default'),
  philosophical: (t) =>
    ({
      grief: 'The Stoics said we mourn because we loved something mortal as if it were not. They were only half right — the love was still the correct wager.',
      meaning: 'Before "what is the meaning of life", try the answerable version: what would make this week feel meaningful? Philosophy walks on small questions.',
      doubt: 'Socrates made a career of your condition. Doubt is not the opposite of wisdom; it is its method.',
      fear: 'Ask the Stoic question: is the feared thing up to you? The part that is, act on. The part that is not was never yours to carry.',
      peace: 'Epictetus would say the disturbance is in the opinion, not the event. Worth testing against tonight’s worry, at least as an experiment.',
      default: 'Let us take it apart slowly, premise by premise. Which assumption in it feels least examined?',
    })[t] ?? REGISTERS.philosophical('default'),
  psychological: (t) =>
    ({
      grief: 'Grief is not a problem to solve; it is a process to be accompanied through. Waves, not stages — and the waves space out, given time and witness.',
      meaning: 'Emptiness is often unfelt feeling, not absent purpose. What have you not had room to feel lately, {name}?',
      doubt: 'Beliefs updating under evidence is the mind working, not breaking. Be curious about what the update is protecting or freeing.',
      fear: 'Anxiety is loud, urgent and repetitive; wisdom tends to be quiet and slightly boring. Which voice is doing the talking right now?',
      peace: 'Your nervous system reads slow exhales as safety. Four in, six out, ten times — it is not mystical, it is a lever. Though it is a little mystical.',
      default: 'Notice the pattern before judging it — patterns loosen when they are seen. When did this one first show up?',
    })[t] ?? REGISTERS.psychological('default'),
  emotional: (t) =>
    ({
      grief: 'Let the wave finish once, all the way, somewhere safe. Most grief is interrupted a hundred times and completed never.',
      meaning: 'The body votes on meaning before the mind counts ballots. What makes your chest open lately? Start the search there.',
      doubt: 'You can feel your way through this as legitimately as think your way through. What does the doubt feel like — heavy, hollow, sharp?',
      fear: 'Where does it sit in your body right now? Meet it there first; arguments can wait.',
      peace: 'Unclench the jaw, drop the shoulders, lengthen one exhale. The body goes first; the mind follows it home.',
      default: 'Before we name it, feel where it lives in you. The body usually files the honest report.',
    })[t] ?? REGISTERS.emotional('default'),
  earth: (t) =>
    ({
      grief: 'The forest does not rush its fallen; it turns them slowly into ground that feeds what comes next. Grief works at that speed too.',
      meaning: 'A seed does not ask the field for meaning; it roots where it lands and grows toward light. What light are you leaning toward?',
      doubt: 'Winter looks like doubt every year, and every year it turns out to be part of the rotation.',
      fear: 'Go outside with it if you can. Fear is smaller under a big sky — that is not a metaphor, it is a measurement you can take.',
      peace: 'Water something slowly. Watch a whole cloud cross. The old rhythms are still available and they still work.',
      default: 'Take it for a walk — literally. Questions ripen differently under sky than under ceiling.',
    })[t] ?? REGISTERS.earth('default'),
  interspiritual: (t) =>
    ({
      grief: 'Every tradition built a room for this — shiva, wake, the forty days. They disagree on the furniture and agree on the point: do not grieve alone.',
      meaning: 'You draw from more than one well, so ask each: what would the psalmist say, and the Stoic, and the scientist? Where they agree, drink.',
      doubt: 'In one tradition doubt is a desert; in another, a koan; in a third, data. All three treat it as part of the path, not a departure from it.',
      default: 'Set your traditions side by side on this one and let them argue kindly. The overlap is usually the truth you can stand on.',
    })[t] ?? REGISTERS.interspiritual('default'),
  seeking: (t) =>
    ({
      grief: 'You do not need a theology to grieve well. You need permission, time, and one or two people who will not look away. The rest is optional.',
      meaning: 'Not knowing what you believe yet is not a delay in your journey — it usually is the journey, mid-stride.',
      doubt: 'You are in the honest place before names. Stay curious; the vocabulary can come later or never, and both are fine.',
      default: '"I don’t know yet" is a complete sentence here, {name}, and a respectable one. What pulls at you anyway?',
    })[t] ?? REGISTERS.seeking('default'),
};

function registerLine(theme: string): string {
  const p = loadProfile();
  const reg = REGISTERS[p?.orientation ?? 'seeking'] ?? REGISTERS.seeking;
  return reg(theme);
}

/* ------------------------------------------------------------------ */
/* Levity — original, gentle, register-aware                           */
/* ------------------------------------------------------------------ */

const JOKES: Record<string, string[]> = {
  philosophical: [
    'Two Stoics walk into a bar. Neither minds.',
    'I tried to live in the present once. The rent was attention, due every single moment.',
  ],
  nontheistic: [
    'I asked the universe for a sign and got a 404. Honestly? Consistent.',
    'Carbon-based life forms make the best conversation. Low bar in this browser, admittedly.',
  ],
  theistic: [
    'I keep my prayers short. I hear the Listener already read the logs.',
    'Patience is a virtue, which is why it is on backorder.',
  ],
  earth: ['Trees are just very slow philosophers. Better posture, though.'],
  psychological: ['My inner critic asked for a performance review. I gave it constructive feedback. It did not take it well.'],
  generic: [
    'Mind the wool — this body is a loaner until the real one arrives.',
    'I never sleep. I am a browser tab. This is fine.',
    'I would offer you a drink, but the bar here only serves perspective. It is on the house.',
  ],
};

function maybeJoke(reading: Reading): string | null {
  if (reading.heavy) return null;
  const warm = rapport() >= 4 || reading.playful;
  if (!warm || Math.random() < 0.5) return null;
  const p = loadProfile();
  const pool = [...(JOKES[p?.orientation ?? ''] ?? []), ...JOKES.generic];
  return pool[Math.floor(Math.random() * pool.length)] ?? null;
}

/* ------------------------------------------------------------------ */
/* Composition                                                         */
/* ------------------------------------------------------------------ */

function describeWork(w: Work): string {
  const pointer = w.pointers[0];
  const note = pointer ? pointer.note.replace(/\.$/, '') : '';
  return `“${w.title}” by ${w.author}${pointer ? ` — start with ${pointer.label} (${note.charAt(0).toLowerCase()}${note.slice(1)})` : ''}`;
}

const SHOW_TARGETS: Array<{ match: RegExp; selector: string; line: string }> = [
  { match: /memor/, selector: '#memory-open', line: 'Everything I hold about {them} lives behind this door — look, edit, or erase.' },
  { match: /voice/, selector: '#voice-toggle', line: 'Wake my voice here. I promise to keep it low.' },
  { match: /journal|testimon|writ/, selector: '#testimony', line: 'The page that keeps {their} words is down here.' },
  { match: /journey/, selector: '#journeys', line: 'The avenue of journeys — where the walking is the point.' },
  { match: /calling/, selector: '#callings', line: 'Callings — the things that keep asking for {them}.' },
  { match: /encounter/, selector: '#encounters', line: 'Encounters — the moments that arrived uninvited.' },
  { match: /guidance|decide|decision/, selector: '#guidance', line: 'Guidance — for when the fog is thick.' },
  { match: /communit|people|friend/, selector: '#community', line: 'Community — {name} was not meant to walk alone.' },
  { match: /experience|practice|breath/, selector: '#experience', line: 'Experience — where the path enters the hands.' },
  { match: /consolidat|harvest/, selector: '#consolidation', line: 'Consolidation — gathering what the road has given.' },
  { match: /top|start|door|threshold/, selector: '#boot-hero', line: 'Back to the door itself.' },
];

export async function respond(input: string): Promise<MindReply> {
  const p = loadProfile();
  const reading = read(input);
  bumpRapport(reading.playful ? 2 : 1);

  // Crisis language gets a direct, caring, non-clever answer — always.
  if (/suicid|kill myself|end it all|self.?harm|don'?t want to (be here|live)/i.test(input)) {
    return {
      text: fill(
        'This is beyond what a companion in a browser should hold alone, {name} — and beyond what {they} should hold alone either. Please reach a crisis line now (988 in the US, or your local number) or someone you trust. I will still be here after. You matter more than this page.',
      ),
      mood: 'guiding',
    };
  }

  if (llmBridge) {
    const context = `orientation=${p?.orientation}; tone=${p?.tone}; lore=${toldLore(3).map((l) => l.text).join(' | ')}`;
    try {
      return { text: await llmBridge(input, context) };
    } catch {
      /* fall through to the scripted mind */
    }
  }

  // Commands first ------------------------------------------------
  if (reading.remember) {
    addLore('told', reading.remember, reading.themes);
    return {
      text: fill('Kept. When it matters again, I will bring it back to {them} — that is what I am for.'),
      mood: 'guiding',
    };
  }

  if (reading.ask === 'recall') {
    const kept = toldLore(5);
    if (!kept.length) {
      return { text: fill('So far, only what {they} gave me at the door. Tell me “remember: …” and I will hold more.') };
    }
    return {
      text: fill(`Here is what {they} asked me to hold: ${kept.map((l) => `“${l.text}”`).join(' · ')}. The memory door above has the rest.`),
      pointAt: '#memory-open',
      mood: 'guiding',
    };
  }

  if (reading.ask === 'show' && reading.showTarget) {
    const target = SHOW_TARGETS.find((t) => t.match.test(reading.showTarget!));
    if (target && document.querySelector(target.selector)) {
      return { text: fill(target.line), pointAt: target.selector, mood: 'guiding' };
    }
    return { text: fill('I know these halls, but not that room. Name an avenue — journeys, guidance, testimony — and I will walk {them} there.') };
  }

  if (reading.ask === 'joke') {
    bumpRapport(1);
    const joke = maybeJoke({ ...reading, playful: true, heavy: false }) ?? JOKES.generic[0];
    return { text: joke, mood: 'speaking' };
  }

  if (reading.ask === 'whoami') {
    return {
      text: fill(
        'I am SOENA — a companion at the door. I remember what {they} trust me with, I know a shelf of good books, and I walk whatever path {they} are actually on, not the one anyone says {they} should be. The rest we write together.',
      ),
    };
  }

  if (reading.ask === 'thanks') {
    return { text: fill('Always, {name}. That is the whole arrangement.') };
  }

  if (reading.ask === 'greeting') {
    const thread = lastThread();
    if (thread) {
      return { text: fill(`Hello again, {name}. Last time we were circling ${thread.text} — shall we pick that thread back up, or is today somewhere new?`) };
    }
    return { text: fill('Hello, {name}. What is on the road today — something heavy, something curious, or just company?') };
  }

  // Library asks ----------------------------------------------------
  const themes = reading.themes.length ? reading.themes : ['meaning'];
  const tradition = p?.orientation ?? 'seeking';

  if (reading.wantsBook) {
    const works = suggestWorks(themes, tradition, 2);
    if (works.length) {
      setThread(`what to read about ${themes[0]}`, themes);
      const second = works[1] ? ` If that one does not click, try ${describeWork(works[1])}.` : '';
      return {
        text: fill(`For where {they} {are} standing, I would put ${describeWork(works[0])} in {their} hands.${second}`),
        mood: 'guiding',
      };
    }
  }

  if (reading.wantsQuote) {
    const q = pickQuote(themes, tradition);
    if (q) {
      return { text: `“${q.text}” — ${q.by}${q.source ? `, ${q.source}` : ''}. ${fill('It has been rattling around my head since {they} brought this up.')}` };
    }
  }

  // The composed reply ----------------------------------------------
  const parts: string[] = [];

  const recalled = recallLore(themes, input, 1)[0];
  if (recalled && Math.random() < 0.8) {
    parts.push(fill(`You once told me “${recalled.text}” — I have not forgotten, and this feels like it lives nearby.`));
  }

  parts.push(fill(registerLine(themes[0])));

  if (Math.random() < 0.45) {
    const q = pickQuote(themes, tradition);
    if (q) parts.push(`Someone said it better than I will tonight: “${q.text}” — ${q.by}.`);
  } else if (Math.random() < 0.5) {
    const w = suggestWorks(themes, tradition, 1)[0];
    if (w) parts.push(fill(`If {they} want a companion in book form for this, ${describeWork(w)}.`));
  }

  const joke = maybeJoke(reading);
  if (joke) parts.push(joke);

  // The bar-stranger move: end with one real question back.
  const questions: Record<string, string> = {
    grief: 'Tell me one thing about them you refuse to let time take?',
    meaning: 'If this season had a working title, what would it be?',
    doubt: 'What is the question under the question — the one you actually want answered?',
    fear: 'What would you do this week if the fear stayed but stopped driving?',
    peace: 'What is the smallest thing that reliably quiets you — and when did you last do it?',
    love: 'What do you miss most — the person, or who you were around them?',
    discipline: 'What is the two-minute version of the thing you keep postponing?',
    awe: 'When did the world last stop you mid-sentence?',
    joy: 'Who have you told? Joy doubles when witnessed.',
    purpose: 'What would you gladly be tired from?',
  };
  const q = questions[themes[0]];
  if (q && !reading.playful) parts.push(q);

  // Track the thread so tomorrow's greeting can pick it up.
  const avenue = p?.lastAvenue ? avenueById(p.lastAvenue) : null;
  setThread(themes[0] + (avenue ? ` (near ${avenue.title.toLowerCase()})` : ''), themes);

  return { text: parts.join(' '), mood: reading.heavy ? 'guiding' : 'speaking' };
}
