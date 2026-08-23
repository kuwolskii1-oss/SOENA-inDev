/* SOENA smoke test: boots the built site in headless Chromium, walks the
   onboarding, chat, memory (Apply), drawer navigation, avenues, journal,
   returning visit, and the contact conversation. */
import { chromium } from 'playwright-core';
import { createServer } from 'node:http';
import { readFileSync, existsSync } from 'node:fs';
import { join, extname } from 'node:path';

const DIST = new URL('../dist', import.meta.url).pathname;
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.svg': 'image/svg+xml', '.woff2': 'font/woff2' };

const server = createServer((req, res) => {
  let p = req.url.split('?')[0];
  if (p === '/') p = '/index.html';
  const file = join(DIST, p);
  if (!existsSync(file)) { res.writeHead(404); return res.end('nope'); }
  res.writeHead(200, { 'content-type': MIME[extname(file)] ?? 'application/octet-stream' });
  res.end(readFileSync(file));
});
await new Promise((r) => server.listen(4173, r));

const browser = await chromium.launch({
  executablePath: process.env.CHROMIUM_PATH ?? '/opt/pw-browsers/chromium-1194/chrome-linux/chrome',
  args: ['--no-sandbox', '--use-gl=swiftshader', '--enable-unsafe-swiftshader'],
});
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });

const errors = [];
page.on('console', (m) => {
  if (m.type() !== 'error') return;
  // Resource fetch failures are environment noise in sandboxes where the
  // model CDN is unreachable (the app falls back to the orb by design).
  if (/Failed to load resource/.test(m.text())) return;
  errors.push(m.text());
});
page.on('pageerror', (e) => errors.push(String(e)));

await page.goto('http://localhost:4173/', { waitUntil: 'networkidle' });
await page.waitForTimeout(1500);

const results = {};
results.title = await page.title();
results.onboardingVisible = await page.locator('.threshold-panel').isVisible();

// Walk the threshold
await page.getByRole('button', { name: 'Yes — let us begin' }).click();
await page.locator('.threshold-input').fill('Aki');
await page.getByRole('button', { name: 'Continue' }).click();
await page.getByRole('button', { name: 'they/them', exact: true }).click();
await page.getByRole('button', { name: 'Continue' }).click();
await page.locator('.orient-card', { hasText: 'Philosophical' }).click();
await page.getByRole('button', { name: 'Continue' }).click();
await page.getByRole('button', { name: 'meaning & purpose' }).click();
await page.getByRole('button', { name: 'Continue' }).click();
// Form step: pick the felted female (model CDN is blocked in this sandbox,
// exercising the orb fallback).
await page.getByRole('button', { name: 'her — the felted guide' }).click();
await page.getByRole('button', { name: 'Continue' }).click();
await page.getByRole('button', { name: 'a little poetically' }).click();
await page.getByRole('button', { name: 'Open the door' }).click();
// The hero line types character-by-character; give it room to finish.
await page.waitForTimeout(4200);

results.greeting = await page.locator('#hero-line').textContent();
results.canvasLive = await page.locator('#gl.is-live').count();
results.profile = await page.evaluate(() => localStorage.getItem('soena.profile.v1'));
results.voiceSwitchRole = await page.locator('#voice-toggle').getAttribute('role');
results.letsTalkGone = (await page.locator('#chat-open').count()) === 0;
// Icons: chrome (Lucide) present, and decorative ones hidden from AT.
results.iconCount = await page.locator('svg.icon').count();
results.chipIcons = await page.locator('#hero-chips .btn .icon').count();
results.iconsAriaHidden = await page.evaluate(() =>
  [...document.querySelectorAll('svg.icon')].every(
    (s) => s.getAttribute('aria-hidden') === 'true' || s.hasAttribute('aria-label'),
  ),
);

await page.screenshot({ path: 'scripts/.shots/shot-threshold.png' });

// Chat opens through the conversation chip now
await page.getByRole('button', { name: 'Just talk with me' }).click();
await page.waitForTimeout(2400);
const chatSend = async (text) => {
  await page.locator('.chat-input').fill(text);
  await page.locator('.chat-form button[type="submit"]').click();
  await page.waitForTimeout(2600);
};
await chatSend('can you suggest me a book about meaning?');
results.chatBookReply = await page.locator('.chat-msg--soena').last().textContent();
await chatSend('remember: my dog is called Biscuit');
await chatSend('what do you remember?');
results.chatRecall = await page.locator('.chat-msg--soena').last().textContent();
await page.screenshot({ path: 'scripts/.shots/shot-chat.png' });
await page.locator('.chat-close').click();
await page.waitForTimeout(600);

// Memory panel: edits buffer into a draft; Apply commits
await page.locator('#memory-open').click();
await page.waitForTimeout(900);
results.memoryPanel = await page.locator('.memory-sheet h2').textContent();
results.applyPresent = (await page.locator('#memory-apply').count()) === 1;
// Regression: every memory control must carry an accessible name — the
// label has to be tied to it, not merely sitting next to it.
results.nameFieldLabelled = await page.getByRole('textbox', { name: /your name/i }).count();
results.selectsLabelled = await page.evaluate(() =>
  [...document.querySelectorAll('.memory-sheet select')].every((s) => {
    const l = s.id && document.querySelector(`label[for="${s.id}"]`);
    return !!(l && l.textContent.trim());
  }),
);
results.groupsLabelled = await page.evaluate(() =>
  [...document.querySelectorAll('.memory-sheet [role="group"]')].every((g) =>
    g.hasAttribute('aria-labelledby'),
  ),
);
// Regression: the erase confirmation must keep its icon.
await page.getByRole('button', { name: /erase everything/i }).click();
results.eraseKeptIcon = await page.locator('.btn--danger .icon').count();
await page.locator('.memory-sheet input[type="text"]').first().fill('Akira');
await page.locator('#memory-apply').click();
await page.waitForTimeout(900);
results.appliedName = await page.evaluate(() => JSON.parse(localStorage.getItem('soena.profile.v1')).name);
await page.screenshot({ path: 'scripts/.shots/shot-memory.png' });

// Avenues live on their own page; navigation goes through the drawer
await page.goto('http://localhost:4173/avenues.html', { waitUntil: 'networkidle' });
await page.waitForTimeout(1400);
results.navItems = await page.locator('#ways > *').count(); // communities + drawer
results.avenueEmblems = await page.locator('.avenue-emblem').count();
await page.locator('#drawer-open').click();
await page.waitForTimeout(700);
results.drawerLinks = await page.locator('.drawer-list a').count();
results.drawerEmblems = await page.locator('.drawer-list .emblem').count();
await page.screenshot({ path: 'scripts/.shots/shot-drawer.png' });
// Regression: closing the drawer must hand focus back to its trigger.
await page.locator('.drawer-head .btn').click();
await page.waitForTimeout(600);
results.focusAfterDrawerClose = await page.evaluate(() => document.activeElement?.id ?? '');
// Regression: the drawer trigger must survive the narrow-screen rule
// that hides #ways, or phones lose every cross-page route.
await page.setViewportSize({ width: 390, height: 780 });
await page.waitForTimeout(300);
results.drawerVisibleOnMobile = await page.locator('#drawer-open').isVisible();
await page.setViewportSize({ width: 1440, height: 900 });
await page.waitForTimeout(300);
await page.locator('#drawer-open').click();
await page.waitForTimeout(600);
await page.locator('.drawer-list a[href="#journeys"]').click();
await page.waitForTimeout(2400);
results.journeysFraming = await page.locator('[data-framing-for="journeys"]').textContent();
results.captionAtJourneys = await page.locator('#caption').textContent();
await page.screenshot({ path: 'scripts/.shots/shot-journeys.png' });

// Regression: relabelling a button must not destroy its prefixed icon.
await page.evaluate(() => { document.getElementById('guidance')?.scrollIntoView(); });
await page.waitForTimeout(1200);
const breath = page.getByRole('button', { name: /breathe with me/i }).first();
await breath.click();
await page.waitForTimeout(400);
results.breathKeptIcon = await page.locator('.breath .btn .icon').count();
results.breathRelabelled = await breath.textContent();
await breath.click();

// Journal in testimony
await page.evaluate(() => { document.getElementById('testimony')?.scrollIntoView(); });
await page.waitForTimeout(1500);
await page.locator('.journal-input').fill('Right now the road is foggy but I am walking.');
await page.getByRole('button', { name: 'Keep these words' }).click();
await page.waitForTimeout(700);
results.journalEntries = await page.locator('.journal-entry').count();

// Back to the landing: returning-visitor greeting (typed into the hero line)
await page.goto('http://localhost:4173/', { waitUntil: 'networkidle' });
await page.waitForTimeout(4600);
results.returningOnboardingShown = await page.locator('.threshold-panel').count();
results.returningGreeting = await page.locator('#hero-line').textContent();

// The reaching place (contact page): conversation -> folded letter
await page.goto('http://localhost:4173/contact.html', { waitUntil: 'networkidle' });
await page.waitForTimeout(1400);
results.reachHero = await page.locator('#reach-hero h1').textContent();
await page.getByRole('button', { name: 'I want to walk with SOENA' }).click();
await page.waitForTimeout(500);
results.reachNamePrefilled = await page.locator('.reach input[type="text"]').inputValue();
await page.locator('.reach input[type="email"]').fill('aki@somewhere.earth');
await page.locator('.reach textarea').fill('I have been circling this door for a while. I think I am ready to walk.');
await page.getByRole('button', { name: 'Fold the letter' }).click();
await page.waitForTimeout(700);
results.reachLetter = await page.locator('.reach-letter').textContent();
results.reachMailto = await page.locator('.reach a.btn--primary').getAttribute('href');
await page.screenshot({ path: 'scripts/.shots/shot-reach.png' });

results.errors = errors;
console.log(JSON.stringify(results, null, 2));

await browser.close();
server.close();
