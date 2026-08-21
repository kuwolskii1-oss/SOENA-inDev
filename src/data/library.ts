/**
 * SOENA's library — works it can suggest and short lines it can quote.
 *
 * Quote policy (enforced editorially, by design):
 *  - Works still under copyright: at most 1-2 genuinely famous lines,
 *    each 25 words or fewer, always attributed. Never passages.
 *  - Public-domain works (ancient texts and pre-1929 translations such as
 *    the KJV, Long's Marcus Aurelius, Legge's Tao Te Ching, Müller's
 *    Dhammapada): quotes may run a little longer, still attributed.
 *  - Every description and chapter note is SOENA's own prose.
 *  - Misattribution hygiene: nothing enters this file marked verified
 *    unless the sourcing is well documented; paraphrase-culture "quotes"
 *    (fake Buddha, fake Einstein, disputed Gandhi) are excluded.
 *
 * This seed set ships with the app; `library.generated.ts` (produced by
 * the curation workflow) extends it at build time when present.
 */

export interface WorkPointer {
  label: string;
  note: string;
}

export interface WorkQuote {
  text: string;
  source?: string;
  confidence: 'verified' | 'strong' | 'uncertain';
}

export interface Work {
  id: string;
  title: string;
  author: string;
  year?: string;
  kind: 'book' | 'documentary' | 'lectures' | 'poetry' | 'scripture' | 'treatise';
  tradition:
    | 'theistic'
    | 'nontheistic'
    | 'philosophical'
    | 'psychological'
    | 'emotional'
    | 'earth'
    | 'interspiritual'
    | 'seeking'
    | 'universal';
  themes: string[];
  whySuggest: string;
  pointers: WorkPointer[];
  quotes: WorkQuote[];
  isPublicDomain: boolean;
}

export interface FigureQuote {
  figure: string;
  era?: string;
  text: string;
  source?: string;
  confidence: 'verified' | 'strong' | 'uncertain';
  themes: string[];
}

export const SEED_WORKS: Work[] = [
  {
    id: 'meditations',
    title: 'Meditations',
    author: 'Marcus Aurelius (tr. George Long)',
    year: '2nd c. CE',
    kind: 'treatise',
    tradition: 'philosophical',
    themes: ['peace', 'discipline', 'death', 'meaning', 'courage'],
    whySuggest:
      'A Roman emperor writing notes to himself, never meant for us — which is exactly why it still lands. Good for when the world feels loud and you need a steadier interior voice.',
    pointers: [
      { label: 'Book II, opening', note: 'The famous morning preparation — how to meet difficult people before you have met them.' },
      { label: 'Book IV', note: 'The retreat into oneself; why you never need a quieter place than your own mind.' },
    ],
    quotes: [
      { text: 'The universe is transformation: life is opinion.', source: 'Meditations IV (Long translation)', confidence: 'verified' },
      { text: 'Confine thyself to the present.', source: 'Meditations VII (Long translation)', confidence: 'verified' },
    ],
    isPublicDomain: true,
  },
  {
    id: 'enchiridion',
    title: 'Enchiridion',
    author: 'Epictetus (tr. George Long)',
    year: 'c. 125 CE',
    kind: 'treatise',
    tradition: 'philosophical',
    themes: ['peace', 'discipline', 'doubt', 'suffering'],
    whySuggest:
      'A short field manual on the one distinction that changes everything: what is up to you versus what is not. You can read it in an evening and chew on it for a decade.',
    pointers: [
      { label: 'Chapter 1', note: 'The whole philosophy in a page — the division of things into ours and not-ours.' },
      { label: 'Chapter 5', note: 'On being disturbed by opinions about events rather than events themselves.' },
    ],
    quotes: [
      {
        text: 'Men are disturbed not by the things which happen, but by the opinions about the things.',
        source: 'Enchiridion 5 (Long translation)',
        confidence: 'verified',
      },
    ],
    isPublicDomain: true,
  },
  {
    id: 'tao-te-ching',
    title: 'Tao Te Ching',
    author: 'Laozi (tr. James Legge)',
    year: 'c. 4th c. BCE',
    kind: 'scripture',
    tradition: 'earth',
    themes: ['peace', 'meaning', 'awe', 'discipline'],
    whySuggest:
      'Eighty-one short chapters about water, valleys, and doing less on purpose. It resists being understood in a straight line, which is part of the teaching.',
    pointers: [
      { label: 'Chapter 8', note: 'The highest good is like water — the most quoted image, worth sitting with slowly.' },
      { label: 'Chapter 64', note: 'On beginnings: the tree, the tower, and the single step.' },
    ],
    quotes: [
      {
        text: 'The journey of a thousand li commenced with a single step.',
        source: 'Tao Te Ching 64 (Legge translation)',
        confidence: 'verified',
      },
    ],
    isPublicDomain: true,
  },
  {
    id: 'dhammapada',
    title: 'The Dhammapada',
    author: 'attr. the Buddha (tr. F. Max Müller)',
    year: 'c. 3rd c. BCE',
    kind: 'scripture',
    tradition: 'interspiritual',
    themes: ['peace', 'discipline', 'suffering', 'joy'],
    whySuggest:
      'Verse pairs on the trained and untrained mind. If you have only ever met "Buddha quotes" on the internet, this is where the real ones live.',
    pointers: [
      { label: 'Chapter 1 — The Twin Verses', note: 'Mind as forerunner of everything; the foundation of the whole collection.' },
    ],
    quotes: [
      {
        text: 'All that we are is the result of what we have thought.',
        source: 'Dhammapada 1 (Müller translation)',
        confidence: 'verified',
      },
    ],
    isPublicDomain: true,
  },
  {
    id: 'psalms',
    title: 'The Book of Psalms',
    author: 'Hebrew scripture (KJV)',
    kind: 'scripture',
    tradition: 'theistic',
    themes: ['grief', 'peace', 'awe', 'doubt', 'gratitude'],
    whySuggest:
      'The most honest prayer book ever assembled — praise, fury, despair and trust, often in the same poem. Permission, in ancient form, to bring your whole state to the sacred.',
    pointers: [
      { label: 'Psalm 23', note: 'The shepherd psalm; companionship through the valley.' },
      { label: 'Psalm 46', note: 'Stillness as a form of knowing.' },
      { label: 'Psalm 88', note: 'The one psalm with no happy turn — proof that unresolved grief belongs in prayer too.' },
    ],
    quotes: [
      { text: 'Be still, and know that I am God.', source: 'Psalm 46:10 (KJV)', confidence: 'verified' },
    ],
    isPublicDomain: true,
  },
  {
    id: 'ecclesiastes',
    title: 'Ecclesiastes',
    author: 'Hebrew scripture (KJV)',
    kind: 'scripture',
    tradition: 'seeking',
    themes: ['meaning', 'death', 'doubt', 'joy'],
    whySuggest:
      'Scripture for doubters: a voice inside the canon saying "I looked at everything under the sun and much of it is vapor." Strangely comforting company for honest uncertainty.',
    pointers: [{ label: 'Chapter 3', note: 'A time for everything — read past the famous lines to the questions underneath them.' }],
    quotes: [
      {
        text: 'To every thing there is a season, and a time to every purpose under the heaven.',
        source: 'Ecclesiastes 3:1 (KJV)',
        confidence: 'verified',
      },
    ],
    isPublicDomain: true,
  },
  {
    id: 'walden',
    title: 'Walden',
    author: 'Henry David Thoreau',
    year: '1854',
    kind: 'book',
    tradition: 'earth',
    themes: ['meaning', 'discipline', 'awe', 'peace'],
    whySuggest:
      'Two years by a pond, conducted as an experiment: how much of life is essential, and how much is furniture? Read it as a question rather than a lifestyle.',
    pointers: [
      { label: 'Where I Lived, and What I Lived For', note: 'The deliberate-living chapter — the heart of the book.' },
      { label: 'Conclusion', note: 'The different drummer, and why castles in the air deserve foundations.' },
    ],
    quotes: [
      {
        text: 'I went to the woods because I wished to live deliberately, to front only the essential facts of life.',
        source: 'Walden, "Where I Lived, and What I Lived For"',
        confidence: 'verified',
      },
    ],
    isPublicDomain: true,
  },
  {
    id: 'song-of-myself',
    title: 'Song of Myself',
    author: 'Walt Whitman',
    year: '1855',
    kind: 'poetry',
    tradition: 'nontheistic',
    themes: ['awe', 'joy', 'connection', 'humanNature'],
    whySuggest:
      'A poem so large it has room for your contradictions. Whitman treats an ordinary self as a subject worthy of scripture-scale wonder — no deity required.',
    pointers: [{ label: 'Section 51', note: 'Where the famous multitudes line lives, and the argument for outgrowing consistency.' }],
    quotes: [
      { text: 'I am large, I contain multitudes.', source: 'Song of Myself, 51', confidence: 'verified' },
    ],
    isPublicDomain: true,
  },
  {
    id: 'hope-feathers',
    title: '“Hope” is the thing with feathers',
    author: 'Emily Dickinson',
    year: 'c. 1861',
    kind: 'poetry',
    tradition: 'emotional',
    themes: ['grief', 'courage', 'joy'],
    whySuggest:
      'Twelve lines that give hope a body — small, stubborn, weather-proof. Worth memorizing for days when abstractions fail.',
    pointers: [{ label: 'The poem itself', note: 'Short enough to read three times; notice it never asks anything of you.' }],
    quotes: [
      {
        text: '“Hope” is the thing with feathers - That perches in the soul.',
        source: 'Poem 314 (Franklin numbering)',
        confidence: 'verified',
      },
    ],
    isPublicDomain: true,
  },
  {
    id: 'mans-search',
    title: "Man's Search for Meaning",
    author: 'Viktor E. Frankl',
    year: '1946',
    kind: 'book',
    tradition: 'psychological',
    themes: ['meaning', 'suffering', 'courage', 'purpose'],
    whySuggest:
      'A psychiatrist who survived the camps and came out insisting meaning is findable inside any circumstance. Half memoir, half method; wholly serious about hope.',
    pointers: [
      { label: 'Part One', note: 'The camp account — read slowly; it earns everything Part Two claims.' },
      { label: 'Part Two: Logotherapy in a Nutshell', note: 'The three roads to meaning: work, love, and unavoidable suffering.' },
    ],
    quotes: [
      {
        text: 'The last of the human freedoms — to choose one’s attitude in any given set of circumstances.',
        source: "Man's Search for Meaning",
        confidence: 'verified',
      },
    ],
    isPublicDomain: false,
  },
  {
    id: 'pale-blue-dot',
    title: 'Pale Blue Dot',
    author: 'Carl Sagan',
    year: '1994',
    kind: 'book',
    tradition: 'nontheistic',
    themes: ['awe', 'meaning', 'connection', 'humanNature'],
    whySuggest:
      'Sagan looks back at Earth from four billion miles and turns a photograph into the most quoted secular sermon of the century. Perspective as a spiritual practice.',
    pointers: [
      { label: 'Chapter 1: You Are Here', note: 'The reflection on the photograph — the passage everyone means when they cite this book.' },
    ],
    quotes: [
      {
        text: 'Look again at that dot. That’s here. That’s home. That’s us.',
        source: 'Pale Blue Dot, ch. 1',
        confidence: 'verified',
      },
    ],
    isPublicDomain: false,
  },
  {
    id: 'cosmos-series',
    title: 'Cosmos: A Personal Voyage',
    author: 'Carl Sagan (documentary series)',
    year: '1980',
    kind: 'documentary',
    tradition: 'nontheistic',
    themes: ['awe', 'meaning', 'humanNature'],
    whySuggest:
      'Thirteen episodes of a scientist treating wonder as a discipline. If your path runs through telescopes rather than temples, this is a liturgy.',
    pointers: [
      { label: 'Episode 1: The Shores of the Cosmic Ocean', note: 'The calendar of the universe — humility by timescale.' },
      { label: 'Episode 13: Who Speaks for Earth?', note: 'The moral turn; science arriving at reverence.' },
    ],
    quotes: [],
    isPublicDomain: false,
  },
  {
    id: 'when-things-fall-apart',
    title: 'When Things Fall Apart',
    author: 'Pema Chödrön',
    year: '1997',
    kind: 'book',
    tradition: 'interspiritual',
    themes: ['grief', 'suffering', 'fear', 'peace'],
    whySuggest:
      'A Buddhist teacher’s field notes for the exact moment the ground gives way. Not a fix-it book — a stay-with-it book, which turns out to be rarer and more useful.',
    pointers: [
      { label: 'Chapter 1: Intimacy with Fear', note: 'Meeting fear as information rather than emergency.' },
      { label: 'Chapter on hopelessness', note: 'Her most counterintuitive move: giving up hope of rescue as a doorway to relief.' },
    ],
    quotes: [],
    isPublicDomain: false,
  },
  {
    id: 'atomic-habits',
    title: 'Atomic Habits',
    author: 'James Clear',
    year: '2018',
    kind: 'book',
    tradition: 'psychological',
    themes: ['habit', 'discipline', 'purpose'],
    whySuggest:
      'The mechanics of becoming someone: identity first, systems second, outcomes last. Practical enough to start tonight, which is the entire point.',
    pointers: [
      { label: 'Chapter 2', note: 'Identity-based habits — voting for the person you intend to become.' },
      { label: 'Chapter 11', note: 'Motion versus action; why preparing can be a form of hiding.' },
    ],
    quotes: [
      {
        text: 'You do not rise to the level of your goals. You fall to the level of your systems.',
        source: 'Atomic Habits, ch. 1',
        confidence: 'verified',
      },
    ],
    isPublicDomain: false,
  },
  {
    id: 'year-magical-thinking',
    title: 'The Year of Magical Thinking',
    author: 'Joan Didion',
    year: '2005',
    kind: 'book',
    tradition: 'emotional',
    themes: ['grief', 'love', 'death'],
    whySuggest:
      'Grief examined by one of the coldest-eyed writers alive while it was happening to her. If you are inside loss and tired of consolation, this is honest company.',
    pointers: [{ label: 'Chapter 1', note: 'The opening pages — ordinary life, then the instant everything changes.' }],
    quotes: [
      {
        text: 'Life changes fast. Life changes in the instant.',
        source: 'The Year of Magical Thinking, ch. 1',
        confidence: 'verified',
      },
    ],
    isPublicDomain: false,
  },
  {
    id: 'braiding-sweetgrass',
    title: 'Braiding Sweetgrass',
    author: 'Robin Wall Kimmerer',
    year: '2013',
    kind: 'book',
    tradition: 'earth',
    themes: ['gratitude', 'connection', 'awe', 'humanNature'],
    whySuggest:
      'A botanist and Potawatomi writer braiding science with indigenous teaching, both treated as ways of knowing. Gratitude here is not a mood — it is an economy.',
    pointers: [
      { label: 'The Gift of Strawberries', note: 'The gift economy chapter; what changes when the world is a gift rather than a store.' },
      { label: 'Allegiance to Gratitude', note: 'The Thanksgiving Address — attention as a daily practice.' },
    ],
    quotes: [],
    isPublicDomain: false,
  },
  {
    id: 'planet-earth',
    title: 'Planet Earth (series)',
    author: 'BBC / David Attenborough',
    year: '2006',
    kind: 'documentary',
    tradition: 'earth',
    themes: ['awe', 'connection', 'joy'],
    whySuggest:
      'Awe on demand. Watching one episode slowly, without a second screen, does something contemplative traditions would recognize as practice.',
    pointers: [{ label: 'Any episode, watched whole', note: 'The practice is undivided attention; the subject is secondary.' }],
    quotes: [],
    isPublicDomain: false,
  },
  {
    id: 'letters-young-poet',
    title: 'Letters to a Young Poet',
    author: 'Rainer Maria Rilke (public-domain translations exist)',
    year: '1929',
    kind: 'book',
    tradition: 'seeking',
    themes: ['doubt', 'meaning', 'love', 'courage'],
    whySuggest:
      'Ten letters to a stranger about living inside unanswered questions. The rare advice book that advises patience with not-knowing instead of escape from it.',
    pointers: [{ label: 'Letter 4', note: 'The famous counsel to love the questions themselves.' }],
    quotes: [
      {
        text: 'Live the questions now.',
        source: 'Letters to a Young Poet, Letter 4',
        confidence: 'verified',
      },
    ],
    isPublicDomain: true,
  },
];

export const SEED_FIGURE_QUOTES: FigureQuote[] = [
  {
    figure: 'James Baldwin',
    era: '1924–1987',
    text: 'Not everything that is faced can be changed; but nothing can be changed until it is faced.',
    source: '"As Much Truth As One Can Bear", New York Times, 1962',
    confidence: 'verified',
    themes: ['courage', 'suffering', 'humanNature'],
  },
  {
    figure: 'Martin Luther King Jr.',
    era: '1929–1968',
    text: 'Darkness cannot drive out darkness; only light can do that.',
    source: 'Strength to Love, 1963',
    confidence: 'verified',
    themes: ['love', 'forgiveness', 'courage'],
  },
  {
    figure: 'Friedrich Nietzsche',
    era: '1844–1900',
    text: 'If we have our own why of life, we shall get along with almost any how.',
    source: 'Twilight of the Idols, Maxims and Arrows 12',
    confidence: 'verified',
    themes: ['meaning', 'suffering', 'purpose'],
  },
  {
    figure: 'Julian of Norwich',
    era: 'c. 1343–1416',
    text: 'All shall be well, and all shall be well, and all manner of thing shall be well.',
    source: 'Revelations of Divine Love',
    confidence: 'verified',
    themes: ['peace', 'grief', 'doubt'],
  },
  {
    figure: 'Mary Oliver',
    era: '1935–2019',
    text: 'Tell me, what is it you plan to do with your one wild and precious life?',
    source: '"The Summer Day", 1990',
    confidence: 'verified',
    themes: ['meaning', 'purpose', 'joy'],
  },
  {
    figure: 'Rainer Maria Rilke',
    era: '1875–1926',
    text: 'Be patient toward all that is unsolved in your heart.',
    source: 'Letters to a Young Poet, Letter 4',
    confidence: 'verified',
    themes: ['doubt', 'peace', 'seeking'],
  },
  {
    figure: 'Viktor E. Frankl',
    era: '1905–1997',
    text: 'Those who have a “why” to live, can bear with almost any “how.”',
    source: "Man's Search for Meaning (citing Nietzsche)",
    confidence: 'verified',
    themes: ['meaning', 'suffering'],
  },
  {
    figure: 'Carl Sagan',
    era: '1934–1996',
    text: 'For small creatures such as we the vastness is bearable only through love.',
    source: 'Contact, 1985',
    confidence: 'verified',
    themes: ['love', 'awe', 'connection'],
  },
  {
    figure: 'Brené Brown',
    era: 'b. 1965',
    text: 'Vulnerability is the birthplace of innovation, creativity and change.',
    source: 'TED, "Listening to Shame", 2012',
    confidence: 'verified',
    themes: ['courage', 'connection', 'humanNature'],
  },
  {
    figure: 'Marcus Aurelius',
    era: '121–180',
    text: 'Confine thyself to the present.',
    source: 'Meditations VII (Long translation)',
    confidence: 'verified',
    themes: ['peace', 'discipline'],
  },
];

/* ------------------------------------------------------------------ */
/* Query helpers                                                       */
/* ------------------------------------------------------------------ */

import { GENERATED_WORKS, GENERATED_FIGURE_QUOTES } from './library.generated';

const dedupe = <T extends { id?: string; text?: string }>(seed: T[], extra: T[]): T[] => {
  const seen = new Set(seed.map((x) => x.id ?? x.text));
  return [...seed, ...extra.filter((x) => !seen.has(x.id ?? x.text))];
};

export const WORKS: Work[] = dedupe(SEED_WORKS, GENERATED_WORKS);
export const FIGURE_QUOTES: FigureQuote[] = dedupe(SEED_FIGURE_QUOTES, GENERATED_FIGURE_QUOTES);

/** Score works against themes + the user's tradition; best first. */
export function suggestWorks(themes: string[], tradition: string, limit = 2): Work[] {
  return WORKS.map((w) => {
    let score = 0;
    for (const t of themes) if (w.themes.includes(t)) score += 3;
    if (w.tradition === tradition) score += 2;
    if (w.tradition === 'universal' || w.tradition === 'interspiritual') score += 1;
    return { w, score };
  })
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((x) => x.w);
}

export function pickQuote(themes: string[], tradition: string): { text: string; by: string; source?: string } | null {
  const workQuote = suggestWorks(themes, tradition, 3)
    .flatMap((w) => w.quotes.filter((q) => q.confidence !== 'uncertain').map((q) => ({ text: q.text, by: w.author, source: q.source ?? w.title })))[0];
  const figure = FIGURE_QUOTES.filter(
    (f) => f.confidence !== 'uncertain' && f.themes.some((t) => themes.includes(t)),
  ).sort(() => Math.random() - 0.5)[0];
  if (workQuote && (!figure || Math.random() < 0.5)) return workQuote;
  if (figure) return { text: figure.text, by: figure.figure, source: figure.source };
  return workQuote ?? null;
}
