/* SOENA smoke test: boots the built site in headless Chromium, walks the
   onboarding, checks the WebGL presence, memory persistence and journal. */
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
page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
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
await page.getByRole('button', { name: 'a little poetically' }).click();
await page.getByRole('button', { name: 'Open the door' }).click();
await page.waitForTimeout(1600);

results.greeting = await page.locator('#caption').textContent();
results.canvasLive = await page.locator('#gl.is-live').count();
results.glContext = await page.evaluate(() => {
  const c = document.getElementById('gl');
  return !!(c && (c.getContext('webgl2') || c.getContext('webgl')));
});
results.profile = await page.evaluate(() => localStorage.getItem('soena.profile.v1'));

await page.screenshot({ path: 'scripts/.shots/shot-threshold.png' });

// Scroll to an avenue, check framing personalization + orb caption
await page.locator('#ways a[href="#journeys"]').click();
await page.waitForTimeout(2200);
results.journeysFraming = await page.locator('[data-framing-for="journeys"]').textContent();
results.captionAtJourneys = await page.locator('#caption').textContent();
await page.screenshot({ path: 'scripts/.shots/shot-journeys.png' });

// Journal in testimony
await page.locator('#ways a[href="#testimony"]').click();
await page.waitForTimeout(2000);
await page.locator('.journal-input').fill('Right now the road is foggy but I am walking.');
await page.getByRole('button', { name: 'Keep these words' }).click();
await page.waitForTimeout(700);
results.journalEntries = await page.locator('.journal-entry').count();
results.journalStore = await page.evaluate(() => localStorage.getItem('soena.journal.v1'));
await page.screenshot({ path: 'scripts/.shots/shot-testimony.png' });

// Memory panel
await page.locator('#memory-open').click();
await page.waitForTimeout(900);
results.memoryPanel = await page.locator('.memory-sheet h2').textContent();
await page.screenshot({ path: 'scripts/.shots/shot-memory.png' });
await page.getByRole('button', { name: 'Close' }).click();

// Reload: returning-visitor greeting
await page.reload({ waitUntil: 'networkidle' });
await page.waitForTimeout(1800);
results.returningOnboardingShown = await page.locator('.threshold-panel').count();
results.returningGreeting = await page.locator('#caption').textContent();

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
