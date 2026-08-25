/**
 * The five SOENA journeys — 7-day companionship programs.
 *
 * Each of the five pathway goals leads into its own program, offered
 * right on the pathway summary. Each day has an intent (why today
 * exists), a small practice, and a reflection written in-app. Days
 * unlock sequentially; progress is saved to the device so it survives
 * closing the app; Home shows a "Day awaits" continue card.
 *
 * The programs are companionship, not curriculum: everything is
 * skippable, nothing is graded, and "Company" deliberately has no
 * tasks at all — seven gentle check-ins and a place to write.
 */
import type { IconName } from '../ui/icons';

export interface JourneyDay {
  title: string;
  /** Why this day exists — read first, one or two sentences. */
  intent: string;
  /** The small practice — concrete and finishable in minutes. */
  practice: string;
  /** The written reflection prompt. */
  reflect: string;
}

export interface Journey {
  id: string;
  title: string;
  /** The wish it answers, in the person's words. */
  wish: string;
  line: string;
  icon: IconName;
  /** A standing safety note, shown at the top of the journey. */
  safety?: string;
  days: JourneyDay[];
}

export const JOURNEYS: Journey[] = [
  {
    id: 'clarity',
    title: 'Clarity',
    wish: '“I want to understand what happened.”',
    line: 'Seven days of understanding and perspective — naming it plainly, learning the playbook, and retelling your story as the person who got out.',
    icon: 'lightbulb',
    days: [
      {
        title: 'Name it plainly',
        intent: 'Fog is where confusion lives. Today is only about plain words — no analysis yet, no verdicts on anyone, including you.',
        practice: 'Write four sentences that begin: "What happened was…". Use the plainest words you can find — the ones you would use for a stranger, not the vocabulary you were given inside.',
        reflect: 'Which sentence was hardest to write plainly — and what word did you have to give up to write it?',
      },
      {
        title: 'The playbook',
        intent: 'What happened to you followed patterns older than the people who used them. Seeing the technique is the beginning of its end.',
        practice: 'Read about one influence technique today — love-bombing, fear of leaving, us-versus-them, confession used as leverage. Just one. Notice, without forcing it, whether it rhymes with your story.',
        reflect: 'Which part of your experience looked different once you saw it as a technique someone applied, rather than something you attracted?',
      },
      {
        title: 'Why it worked',
        intent: 'It worked because you are human — because you wanted meaning, belonging, or healing. Those wants are not flaws; they are the doors influence uses.',
        practice: 'Finish this sentence honestly, in writing: "It reached me because at the time I needed…". Then read it back and notice: that need was legitimate.',
        reflect: 'What was the legitimate need underneath — and where else in your life could that need be met, at even a tenth of the intensity?',
      },
      {
        title: 'The moments of doubt',
        intent: 'You doubted. Everyone does, and the memory of those moments is evidence that your judgment was working even inside the fog.',
        practice: 'List three moments when something felt off — however small, however quickly you explained it away. Date them roughly. Notice how early the first one came.',
        reflect: 'What did you do with the doubt at the time — and who or what taught you to set it aside?',
      },
      {
        title: 'True vs. engineered',
        intent: 'Not everything inside was false, and pretending it was flattens your own history. Today separates what was real from what was staged.',
        practice: 'Two columns: "true anyway" (friendships, insights, moments of genuine beauty) and "engineered" (manufactured urgency, staged confirmations, pressure dressed as love). Sort a handful of memories.',
        reflect: 'What is in the "true anyway" column — and how does it feel to be allowed to keep it?',
      },
      {
        title: 'Honest accounting',
        intent: 'A fair ledger has both pages. What it cost, and also what you carried out — strength, discernment, people. Grief and credit in the same sitting.',
        practice: 'Write the two lists: "what it cost me" and "what I take with me". Neither list is disloyal. Stop when the lists feel honest, not when they feel finished.',
        reflect: 'Which single cost do you most need someone to acknowledge — and which single thing you carried out are you proudest of?',
      },
      {
        title: 'Retell the story',
        intent: 'The last word belongs to you. Today you tell the whole thing — as the person who got out, not the person it happened to.',
        practice: 'Write your story in ten sentences or fewer, ending anywhere after the leaving. You are the narrator now; the tone is yours to choose.',
        reflect: 'Read it back once. What does the narrator of that story know that the person inside it did not?',
      },
    ],
  },
  {
    id: 'steady',
    title: 'Steady',
    wish: '“I want to calm the fear.”',
    line: 'Seven days of body-first calming practices — breath, naming, evidence, and a plan for when the spike returns.',
    icon: 'anchor',
    days: [
      {
        title: 'Breath before belief',
        intent: 'Fear lives in the body before it lives in the mind, so the body is where we start. No analysis today — just the nervous system.',
        practice: 'Three times today: breathe in for four counts, out for eight, six times over. The long exhale is the signal your body reads as "safe enough". Set no other goal.',
        reflect: 'When was the fear loudest today, and what did one round of long exhales actually change — even by a fraction?',
      },
      {
        title: 'Name the fear precisely',
        intent: 'A vague dread is unbeatable; a named fear has edges. Precision is not dwelling — it is draining.',
        practice: 'Write the fear as one exact sentence: not "something bad will happen" but who, what, when. If there are several, write each one. Vagueness is the fear’s home ground; take it away.',
        reflect: 'Once written precisely, did the fear look bigger or smaller than it felt? What surprised you about its actual shape?',
      },
      {
        title: 'The prediction log',
        intent: 'Fear makes predictions constantly and never audits them. Starting today, everything it forecasts gets written down and checked.',
        practice: 'Open a note titled "predictions". Every time the fear says something will happen, log it with a date. Add yesterday’s and last week’s from memory, with what actually happened.',
        reflect: 'What is the fear’s track record so far — and how does it feel to see its forecasts held to account?',
      },
      {
        title: 'Sixty seconds of looking',
        intent: 'Avoidance teaches the body that the feared thing is lethal. Sixty supported seconds teach it otherwise. Only if you feel resourced today — this practice is a choice, never a duty.',
        practice: 'Choose one small trigger — a word, an image, a memory. Set a timer for 60 seconds and stay with it, breathing long exhales, feet on the floor. When the timer ends, stop and do something kind.',
        reflect: 'What happened in your body across the sixty seconds — and what happened in the minute after it ended?',
      },
      {
        title: 'The worry window',
        intent: 'Fear at 3am has no competition. Giving worry a scheduled daylight appointment thins its nighttime hold.',
        practice: 'Set a 15-minute "worry window" for tomorrow, in daylight, with an end time. Tonight, when worry arrives, tell it — on paper if needed — "you have an appointment." Write the worry down and close the note.',
        reflect: 'What did the night feel like, knowing worry had somewhere else to be? What actually came to the window when you held it?',
      },
      {
        title: 'A kind letter',
        intent: 'You have spoken to yourself in the fear’s voice for a long time. Today another voice gets a turn — the one you would use for a friend in your exact position.',
        practice: 'Write a short letter to yourself from the kindest person you can imagine — real or invented. Let it say what you most need to hear about the fear, the past, and your worth. Keep it where you can reread it.',
        reflect: 'Which sentence in the letter was hardest to accept — and what does resisting it tell you?',
      },
      {
        title: 'The spike plan',
        intent: 'Fear will return — that is what fear does. The difference now is that its visit meets a plan instead of an ambush.',
        practice: 'Write your spike plan on one card: 1) long exhales ×6, 2) the precise name of the fear, 3) check the prediction log, 4) reread the kind letter, 5) one person or place that helps. Photograph it or keep it in your pocket.',
        reflect: 'Looking back across the week: what actually helps you, in order? That order — that is your plan, made of evidence.',
      },
    ],
  },
  {
    id: 'doorway',
    title: 'Doorway',
    wish: '“I want to plan my way out.”',
    line: 'Seven days of practical exit planning — defining "out", mapping the ties, and a dated first step.',
    icon: 'door-open',
    safety: 'Safety first: if leaving is unsafe — if you fear violence, retaliation, or being prevented from going — plan with professional support or the authorities beside you, not alone. SOENA can keep you company, but a dangerous exit needs people with real-world reach.',
    days: [
      {
        title: 'Define "out"',
        intent: 'Exits fail when "out" is a feeling instead of a description. Today you decide what out actually means for you — it is different for everyone.',
        practice: 'Write your definition: which practices end, which contacts change, what stays (family? holidays? friendships?). "Out" can be a spectrum — mark where on it you are heading.',
        reflect: 'What does your version of "out" keep — and did anything on the keep-list surprise you?',
      },
      {
        title: 'Map the ties',
        intent: 'You are held by specific ropes, not by fog: money, housing, family, community, fear. A mapped rope can be untied; an unmapped one just holds.',
        practice: 'List every tie under five headings — money, housing, people, obligations, fear. Beside each, mark it: cut, loosen, or keep. No action today; today is cartography.',
        reflect: 'Which tie is load-bearing — the one that, once loosened, loosens others? Which is heavier in feeling than in fact?',
      },
      {
        title: 'Choose your people',
        intent: 'Exits are not solo work. Today you choose the two or three people who will know — chosen for steadiness, not proximity.',
        practice: 'Pick your people: one for practical help, one for morale, one as the emergency contact. Tell at least one of them this week — a single sentence is enough: "I am working on leaving, and I wanted you to know."',
        reflect: 'Who made the list, who did not, and what does the difference tell you about who is safe for this?',
      },
      {
        title: 'The first rungs',
        intent: 'Big exits are made of small mechanical moves that nobody inside can see: an account, a document, a copy, a bag. Rungs, not leaps.',
        practice: 'Write your first three rungs — practical, invisible, doable within two weeks (e.g. open my own account; copy my documents; price a room). Do the easiest one today if you safely can.',
        reflect: 'Which rung is actually first — and what has stopped it until now: means, or permission you were waiting for that no one can grant but you?',
      },
      {
        title: 'Boundary scripts',
        intent: 'You will be asked, pressed, and guilted. Prepared sentences survive moments that improvisation does not.',
        practice: 'Write and say aloud three scripts: one for declining ("I won’t be attending, and I’m not discussing it today"), one for deflecting ("I’m taking time to think — I’ll speak when I’m ready"), one for ending a conversation ("I love you, and I’m going now"). Adjust until they sound like you.',
        reflect: 'Which script is hardest to imagine saying — to whom — and what is the feared reply behind that?',
      },
      {
        title: 'Anticipate the pushback',
        intent: 'The pressure that follows an exit is predictable: guilt first, then promises, then warnings. Forecast it today so it arrives as weather, not ambush.',
        practice: 'Write the pushback forecast: who responds, with what (guilt, love-bombing, threats, silence), and your one-line plan for each. Add: "None of these responses is new information — they are the exit confirming itself."',
        reflect: 'Which predicted response has the most power over you — and what would it take for it to matter less?',
      },
      {
        title: 'A dated first step',
        intent: 'A plan becomes an exit on the day it touches the calendar. Today you choose that day.',
        practice: 'Choose your first visible step and give it a date within 30 days. Write it as one sentence: "On [date], I will [step]." Tell one of your chosen people. If the date needs to move later, move it — dated and moved is still infinitely more real than someday.',
        reflect: 'Say the sentence to yourself once more. What is the feeling under the fear — and is there any relief in it?',
      },
    ],
  },
  {
    id: 'roots',
    title: 'Roots',
    wish: '“I want to rebuild.”',
    line: 'Seven days of rebuilding identity and life — what survived, your own values, and three dated commitments.',
    icon: 'sprout',
    days: [
      {
        title: 'What survived',
        intent: 'Rebuilding does not start from nothing — it starts from what was never theirs to take. Today is an inventory of survivals.',
        practice: 'List what survived intact: abilities, humour, people, tastes, your particular way of noticing things. Aim past ten. Include small things; small things are load-bearing.',
        reflect: 'Which survival most surprised you to find on the list — and which one do you want to build on first?',
      },
      {
        title: 'Your own values',
        intent: 'You lived by issued values for a long time. Today you draft your own — not as rebellion, but as authorship.',
        practice: 'Write five values in your own words — not the group’s vocabulary and not its opposite, which is still its vocabulary. For each: one sentence on what living it looks like on an ordinary Tuesday.',
        reflect: 'Which of the five was already yours all along, even inside? Which is genuinely new?',
      },
      {
        title: 'One message to one person',
        intent: 'Isolation is the wound; connection is the graft. Not a network — one message, to one person, today.',
        practice: 'Send one message to one person you want in the next chapter — an old friend, a kind cousin, someone from a class. Low stakes: "I’ve been thinking of you — how are you?" is complete.',
        reflect: 'What did sending it cost, what came back — and what does that teach you about the door you thought was closed?',
      },
      {
        title: 'New rooms',
        intent: 'Identity grows in rooms where nobody knows your old role. Today you find one such room.',
        practice: 'Choose one room to be a person in — a class, a gym, a volunteer shift, a library hour, a walking group. Take the concrete step: register, book, or put it in the calendar with a time.',
        reflect: 'In the new room, who do you get to be? Write two sentences introducing that person — no history required.',
      },
      {
        title: 'Rituals without control',
        intent: 'The shape of ritual was never the problem — the control inside it was. You are allowed rhythm, candle, silence, on your own authority.',
        practice: 'Design one small daily ritual that answers to no one: a morning page, a lit candle, tea before the phone, an evening walk to the same corner. Do it today. It means only what you say it means.',
        reflect: 'What did it feel like to keep a ritual that reports to nobody? What might it become in a year of ordinary days?',
      },
      {
        title: 'Meaning, relocated',
        intent: 'The hunger for meaning did not die when you left — and it does not need the old address. Today you notice where meaning already lives now.',
        practice: 'Write down three moments from the last month that felt genuinely meaningful — however small or unspiritual they looked. Under each: what made it matter. That is your data on where meaning lives for you now.',
        reflect: 'What do the three moments have in common? What would a life with more of exactly that look like?',
      },
      {
        title: 'Three dated commitments',
        intent: 'Rebuilding becomes real on a calendar. Today the week’s discoveries turn into three commitments with dates.',
        practice: 'Write three 30-day commitments drawn from this week — one for connection, one for the new room, one for your rituals or values. Each gets a date. Put all three where you will see them.',
        reflect: 'Read the three aloud. Do they sound like the life of someone you would like to be? Adjust until they do — then keep the date.',
      },
    ],
  },
  {
    id: 'company',
    title: 'Company',
    wish: '“I just need to talk.”',
    line: 'Seven days of gentle companionship — no tasks, daily check-ins, space to reflect. SOENA is here with you.',
    icon: 'message-circle',
    days: [
      {
        title: 'Just arriving',
        intent: 'No tasks in this journey — today or any day. Today is only arrival: you came, and that is the whole of it.',
        practice: 'Nothing is required. If you want, tell SOENA how today actually was — the unedited version.',
        reflect: 'If you feel like writing: what would you tell someone who you knew would simply listen?',
      },
      {
        title: 'The weather report',
        intent: 'Some days need naming, not solving. Today is a weather report on the inner sky — no forecast required.',
        practice: 'Nothing is required. A check-in with SOENA is here if you want it.',
        reflect: 'What is the weather inside today — and has it shifted at all since yesterday?',
      },
      {
        title: 'One good thing',
        intent: 'Company is allowed to notice good things without pretending everything is fine. Both can be true on the same day.',
        practice: 'Nothing is required. If one bearable or even good moment happened today, you could mention it to SOENA.',
        reflect: 'Was there one moment today that was lighter than the rest? What was happening in it?',
      },
      {
        title: 'The heavy thing',
        intent: 'If something heavy has been waiting for a listener, today has room for it. If not, today has room for that too.',
        practice: 'Nothing is required. The chat is open if the heavy thing wants air. It can also wait — it will still be yours tomorrow.',
        reflect: 'Is there something you have not said aloud to anyone yet? You could write its first sentence here — just the first.',
      },
      {
        title: 'Company in the quiet',
        intent: 'Not every day of company needs words. Today SOENA simply keeps the seat beside you.',
        practice: 'Nothing is required. Sit somewhere you like for a few minutes, knowing this page holds your place.',
        reflect: 'If the quiet had a texture today, what was it — restful, tense, empty, full?',
      },
      {
        title: 'Someone else',
        intent: 'SOENA is company, not a replacement for people. Today gently wonders about the humans — with zero obligation attached.',
        practice: 'Nothing is required. If one person came to mind this week as someone you might talk to eventually, you could note their name for yourself.',
        reflect: 'Who in your life listens without fixing? If nobody yet — what would a person like that be like?',
      },
      {
        title: 'The door stays open',
        intent: 'Seven days of company end; the company does not. Today marks the week — nothing more ceremonial than that.',
        practice: 'Nothing is required. If you want, tell SOENA one thing that is different — even one degree different — from a week ago.',
        reflect: 'What do you want the next week to know about this one?',
      },
    ],
  },
];

export function journeyById(id: string): Journey | undefined {
  return JOURNEYS.find((j) => j.id === id);
}
