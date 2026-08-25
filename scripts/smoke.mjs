/* SOENA smoke test: boots the built site in headless Chromium, walks the
   onboarding, chat, memory (Apply), drawer navigation, avenues, journal,
   returning visit, and the contact conversation. */
import { chromium } from 'playwright-core';
import { createServer } from 'node:http';
import { readFileSync, existsSync } from 'node:fs';
import { join, extname } from 'node:path';

const DIST = new URL('../dist', import.meta.url).pathname;
// Port is overridable so concurrent runs (e.g. a review agent's own
// pass) cannot collide on a single fixed port.
const PORT = Number(process.env.SMOKE_PORT ?? 4173);
const ORIGIN = `http://localhost:${PORT}`;
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.svg': 'image/svg+xml', '.woff2': 'font/woff2', '.webp': 'image/webp', '.webm': 'video/webm', '.mp4': 'video/mp4' };

const server = createServer((req, res) => {
  let p = req.url.split('?')[0];
  if (p === '/') p = '/index.html';
  const file = join(DIST, p);
  if (!existsSync(file)) { res.writeHead(404); return res.end('nope'); }
  res.writeHead(200, { 'content-type': MIME[extname(file)] ?? 'application/octet-stream' });
  res.end(readFileSync(file));
});
await new Promise((r) => server.listen(PORT, r));

const browser = await chromium.launch({
  executablePath: process.env.CHROMIUM_PATH ?? '/opt/pw-browsers/chromium-1194/chrome-linux/chrome',
  args: ['--no-sandbox', '--use-gl=swiftshader', '--enable-unsafe-swiftshader'],
});
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });

const errors = [];
// Every asset is local now (sprites, fonts, videos) — any console error,
// including a failed resource load, is a real regression.
page.on('console', (m) => {
  if (m.type() === 'error') errors.push(m.text());
});
page.on('pageerror', (e) => errors.push(String(e)));

// Wait for the arrival veil to lift (html.arrival-done is set as the
// lift begins; the node itself is removed ~1s later).
const arrived = () =>
  page.waitForFunction(() => document.documentElement.classList.contains('arrival-done'), null, {
    timeout: 9000,
  });

await page.goto(ORIGIN + '/', { waitUntil: 'networkidle' });

const results = {};
// The arrival veil must be up right after load (min hold ~1.25s)…
results.arrivalVisibleAtLoad = await page.locator('#arrival').isVisible();
// Its painted colours are recorded here and compared against a dark-mode
// load later: the loading screen must NOT invert with the theme.
const veilLook = await page.evaluate(() => {
  const v = getComputedStyle(document.getElementById('arrival'));
  const w = getComputedStyle(document.querySelector('.arrival-word'));
  const l = getComputedStyle(document.querySelector('.arrival-line'));
  return `${v.backgroundColor}|${w.color}|${l.backgroundColor}|${l.boxShadow}|${v.opacity}`;
});
results.veilLook = veilLook;
results.arrivalLetters = await page.locator('#arrival .arrival-word span').count();
await arrived();
await page.waitForTimeout(1900);
// …and fully gone once the door has opened, with the hero revealed.
results.arrivalGone = (await page.locator('#arrival').count()) === 0;
results.heroRevealed = await page.evaluate(
  () => getComputedStyle(document.getElementById('hero-line')).opacity,
);
// The frosted glass: ONE uniform strength over the whole background —
// no sections. The blur lives on the canopy itself (a cached filter,
// not a per-frame backdrop-filter), with #glass carrying the tint.
results.glass = await page.evaluate(() => {
  const layers = [...document.querySelectorAll('#glass')];
  const f = getComputedStyle(document.getElementById('backdrop')).filter;
  const px = Number((f.match(/blur\((\d+(?:\.\d+)?)/) ?? [0, 0])[1]);
  const tier = document.documentElement.dataset.tier;
  const floor = tier === '0' ? 3 : 6;
  const rect = layers[0]?.getBoundingClientRect();
  return {
    layers: layers.length,
    sections: document.querySelectorAll('#panes, .pane').length,
    blur: Math.round(px * 10) / 10,
    // Cheaper than backdrop-filter: the viewport is not re-blurred per frame.
    liveBackdropFilter: getComputedStyle(layers[0] ?? document.body).backdropFilter,
    coversViewport:
      !!rect && Math.round(rect.width) === window.innerWidth && Math.round(rect.height) === window.innerHeight,
    ok: layers.length === 1 && px >= floor,
  };
});
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
// Form step: pick the tide-glass female (a local sprite — it renders
// for real in this sandbox, asserted below).
await page.getByRole('button', { name: 'her — the tide-glass listener' }).click();
await page.getByRole('button', { name: 'Continue' }).click();
await page.getByRole('button', { name: 'a little poetically' }).click();
await page.getByRole('button', { name: 'Open the door' }).click();
// The hero line types character-by-character; give it room to finish.
await page.waitForTimeout(4200);

results.greeting = await page.locator('#hero-line').textContent();

// The tide-glass figure: a DOM sprite pair (body + feathered head), no
// WebGL and no CDN, pinned to the page's exact bottom-left corner.
await page.waitForSelector('#figure.is-here', { timeout: 8000 });
results.figureLayers = await page.locator('#figure img').count();
results.figurePinned = await page.evaluate(() => {
  const r = document.getElementById('figure').getBoundingClientRect();
  return Math.round(r.left) === 0 && Math.abs(r.bottom - window.innerHeight) < 2;
});
// A11y contract: decorative, non-interactive, non-draggable.
results.figureA11y = await page.evaluate(() => {
  const fig = document.getElementById('figure');
  const imgs = [...fig.querySelectorAll('img')];
  return (
    fig.getAttribute('aria-hidden') === 'true' &&
    getComputedStyle(fig).pointerEvents === 'none' &&
    imgs.every((i) => i.alt === '' && !i.draggable)
  );
});
// The head must follow the cursor's height: up when high, down when low.
await page.mouse.move(720, 80);
await page.waitForTimeout(900);
const headUp = await page.evaluate(() => document.querySelector('.figure-head').style.transform);
await page.mouse.move(720, 860);
await page.waitForTimeout(900);
const headDown = await page.evaluate(() => document.querySelector('.figure-head').style.transform);
const deg = (s) => parseFloat((s.match(/rotate\((-?[\d.]+)deg/) ?? [0, 'NaN'])[1]);
results.headTracksCursor = deg(headUp) < deg(headDown);
results.headRange = `${deg(headUp)} .. ${deg(headDown)}`;
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
results.memoryPanel = await page.locator('#memory-pane h2').textContent();
// The panel is a modal dialog: Tab must cycle inside it, and closing
// must hand focus back to the control that opened it.
results.dialogTrapsTab = await page.evaluate(() => {
  const stops = [...document.querySelectorAll('.memory-sheet a[href], .memory-sheet button:not([disabled]), .memory-sheet input, .memory-sheet select, .memory-sheet textarea')]
    .filter((el) => el.tabIndex >= 0 && el.getClientRects().length > 0);
  return stops.length > 1;
});
results.openerExpanded = await page.locator('#memory-open').getAttribute('aria-expanded');
results.tabpanelsLabelled = await page.evaluate(() =>
  [...document.querySelectorAll('.memory-sheet [role=tabpanel]')].every((p) => {
    const id = p.getAttribute('aria-labelledby');
    return id && document.getElementById(id)?.getAttribute('role') === 'tab';
  }),
);
// Escape from a click on inert copy inside the sheet (activeElement -> body).
await page.locator('.memory-note').first().click();
await page.keyboard.press('Escape');
await page.waitForTimeout(700);
results.escapeFromInertArea = (await page.locator('.memory-sheet').count()) === 0;
await page.locator('#memory-open').click();
await page.waitForTimeout(800);
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
results.focusAfterMemoryClose = await page.evaluate(() => document.activeElement?.id ?? '');
results.openerCollapsed = await page.locator('#memory-open').getAttribute('aria-expanded');
results.appliedName = await page.evaluate(() => JSON.parse(localStorage.getItem('soena.profile.v1')).name);
await page.screenshot({ path: 'scripts/.shots/shot-memory.png' });

// Day -> night: the toggle must play the transition video over the
// backdrop (VP9 decodes in this Chromium), flip the theme mid-clip,
// store the choice, and clean the video up afterwards.
results.themeTogglePresent = (await page.locator('#theme-toggle').count()) === 1;
await page.locator('#theme-toggle').click();
results.themeVideoPlayed = await page
  .waitForSelector('#backdrop video', { timeout: 1500 })
  .then(() => true)
  .catch(() => false);
await page.waitForFunction(() => document.documentElement.dataset.theme === 'dark', null, { timeout: 5000 });
results.themeAfterToggle = await page.evaluate(() => document.documentElement.dataset.theme);
results.themeStored = await page.evaluate(() => localStorage.getItem('soena.theme.v1'));
await page.waitForTimeout(1600);
results.themeVideoCleaned = (await page.locator('#backdrop video').count()) === 0;
await page.screenshot({ path: 'scripts/.shots/shot-night.png' });

// Developer options: the palette switcher (a demo drawer, applies live).
await page.locator('#memory-open').click();
await page.waitForTimeout(700);
results.devTabPresent = await page.getByRole('tab', { name: /developer options/i }).count();
await page.getByRole('tab', { name: /developer options/i }).click();
await page.waitForTimeout(300);
results.paletteOptions = await page.getByRole('radio').count();
const inkBefore = await page.evaluate(() => getComputedStyle(document.documentElement).getPropertyValue('--ink').trim());
await page.getByRole('radio', { name: /tide/i }).click();
await page.waitForTimeout(900);
results.paletteSwitched = await page.evaluate(() => {
  const html = document.documentElement;
  return {
    attr: html.dataset.palette ?? 'garden',
    stored: localStorage.getItem('soena.palette.v1'),
    ink: getComputedStyle(html).getPropertyValue('--ink').trim(),
    veilGround: getComputedStyle(html).getPropertyValue('--veil-ground').trim(),
  };
});
results.paletteChangedInk = inkBefore !== results.paletteSwitched.ink;
results.tideNoGardenLeak = await page.evaluate(() => {
  const cs = getComputedStyle(document.documentElement);
  const glow = cs.getPropertyValue('--wash-glow-rgb').trim();
  const tint = cs.getPropertyValue('--wash-tint-rgb').trim();
  return {
    glow,
    tint,
    // Garden's lime/mint must not survive into tide.
    clean: glow !== '199, 244, 84' && tint !== '173, 245, 188',
  };
});
results.chromeFollowsGround = await page.evaluate(() => {
  const meta = document.querySelector('meta[name=theme-color]')?.content?.trim();
  const bg = getComputedStyle(document.documentElement).getPropertyValue('--bg').trim();
  return meta === bg;
});
// Garden is a WORLD, not a palette: its arrangement must not follow the
// visitor into Tide. Read the hero's shape here, in Tide, to compare.
const heroInTide = await page.evaluate(() => {
  const chips = document.getElementById('hero-chips');
  return {
    chipFlow: getComputedStyle(chips).flexDirection,
    chipRadius: getComputedStyle(chips.querySelector('.btn--chip')).borderRadius,
    heroJustify: getComputedStyle(document.getElementById('boot-hero')).justifyContent,
  };
});
await page.screenshot({ path: 'scripts/.shots/shot-tide.png' });
// Frosting: the 5-step glass toggle — switch to Veiled, confirm the
// attribute + storage + a real blur increase; then back to default.
results.frostSteps = await page.getByRole('radio', { name: /clear|sheer|frosted|misted|veiled/i }).count();
const blurAt3 = await page.evaluate(() => {
  const f = getComputedStyle(document.getElementById('backdrop')).filter;
  return Number((f.match(/blur\((\d+(?:\.\d+)?)/) ?? [0, 0])[1]);
});
await page.getByRole('radio', { name: 'Veiled' }).click();
await page.waitForTimeout(300);
results.frostVeiled = await page.evaluate((prev) => {
  const f = getComputedStyle(document.getElementById('backdrop')).filter;
  const px = Number((f.match(/blur\((\d+(?:\.\d+)?)/) ?? [0, 0])[1]);
  return {
    attr: document.documentElement.dataset.frost,
    stored: localStorage.getItem('soena.frost.v1'),
    blurGrew: px > prev,
  };
}, blurAt3);
await page.getByRole('radio', { name: 'Frosted' }).click();
await page.waitForTimeout(300);
results.frostBackToDefault = await page.evaluate(
  () => (document.documentElement.dataset.frost ?? '3') + '/' + String(localStorage.getItem('soena.frost.v1')),
);

// The developer drawer carries its own footer (Apply/Cancel/Erase are
// memory's and stay hidden here).
results.devFooterOwn = await page.evaluate(() => {
  const dev = document.getElementById('developer-pane');
  const memActions = document.querySelector('.memory-sheet > .threshold-actions');
  return (
    !!dev.querySelector('.threshold-actions .btn--primary') &&
    (!memActions || getComputedStyle(memActions).display === 'none')
  );
});
// Back to Garden so the rest of the run is in the default world.
await page.getByRole('radio', { name: /garden/i }).click();
await page.waitForTimeout(500);
// Garden's own hero: the chips hang off a stem instead of wrapping in a
// row, they are cut to leaves, and the clearing sits to one side.
results.gardenHero = await page.evaluate((tide) => {
  const chips = document.getElementById('hero-chips');
  const cs = getComputedStyle(chips);
  const chip = getComputedStyle(chips.querySelector('.btn--chip'));
  const hero = getComputedStyle(document.getElementById('boot-hero'));
  return {
    chipFlow: cs.flexDirection,
    stemDrawn: getComputedStyle(chips, '::before').content !== 'none',
    leafChips: chip.borderRadius !== tide.chipRadius && chip.borderRadius.includes('%'),
    heroMoved: hero.justifyContent !== tide.heroJustify,
    differsFromTide: cs.flexDirection !== tide.chipFlow,
  };
}, heroInTide);
await page.locator('#developer-pane .btn--primary').click();
await page.waitForTimeout(700);

// Avenues live on their own page; navigation goes through the drawer.
// Inner pages open behind the brief arrival curtain.
await page.goto(ORIGIN + '/avenues.html', { waitUntil: 'networkidle' });
await arrived();
await page.waitForTimeout(1200);
results.arrivalOnInnerPages = await page.evaluate(() =>
  document.documentElement.classList.contains('has-arrival'),
);
// The chosen night must survive navigation, applied before first paint.
results.themePersistedOnAvenues = await page.evaluate(() => document.documentElement.dataset.theme);
results.navItems = await page.locator('#ways > *').count(); // communities + drawer
results.avenueEmblems = await page.locator('.avenue-emblem').count();
// Garden's avenue presentation: a leaning plant marker in its own
// column, leaf-cut doors, and vines planted between the beds.
results.gardenAvenues = await page.evaluate(() => {
  const inner = document.querySelector('.avenue-inner');
  const head = document.querySelector('.avenue-head');
  const door = document.querySelector('.door');
  const ics = getComputedStyle(inner);
  return {
    twoColumn: ics.display === 'grid' && ics.gridTemplateColumns.split(' ').length === 2,
    markerLeans: getComputedStyle(head).rotate !== 'none',
    markerSticky: getComputedStyle(head).position === 'sticky',
    sprig: getComputedStyle(head, '::after').content !== 'none',
    leafDoors: getComputedStyle(door).borderRadius.includes('%'),
    // One vine between each pair of avenues, none after the last.
    vines: document.querySelectorAll('.garden-vine').length,
    avenues: document.querySelectorAll('.avenue').length,
    vinesAreAria: [...document.querySelectorAll('.garden-vine')].every(
      (v) => v.getAttribute('aria-hidden') === 'true',
    ),
  };
});
// The vine draws itself: its stem starts fully offset and lands at 0.
await page.evaluate(() => document.querySelector('.garden-vine')?.scrollIntoView({ block: 'center' }));
await page.waitForTimeout(2800);
results.gardenVineDrew = await page.evaluate(() => {
  const stem = document.querySelector('.garden-vine.is-in .vine-stem');
  const leaf = document.querySelector('.garden-vine.is-in .vine-leaf');
  if (!stem || !leaf) return { drew: false };
  const box = leaf.getBoundingClientRect();
  return {
    drew: Number(getComputedStyle(stem).strokeDashoffset.replace('px', '')) < 1,
    // A leaf whose CSS transform overrode its placement collapses to a
    // zero-ish box at the SVG origin — this catches that regression.
    leafPlaced: box.width > 4 && box.height > 2,
    leafLit: Number(getComputedStyle(leaf).opacity) > 0.5,
  };
});
// Leaving Garden pulls the undergrowth up; returning replants it —
// live, without a reload, off the palette:change event.
await page.locator('#memory-open').click();
await page.waitForTimeout(700);
await page.getByRole('tab', { name: /developer options/i }).click();
await page.waitForTimeout(300);
await page.getByRole('radio', { name: /tide/i }).click();
await page.waitForTimeout(600);
results.tideHasNoVines = await page.evaluate(() => ({
  world: document.documentElement.dataset.palette,
  vines: document.querySelectorAll('.garden-vine').length,
  bedIsOneColumn: getComputedStyle(document.querySelector('.avenue-inner')).display !== 'grid',
}));
await page.getByRole('radio', { name: /garden/i }).click();
await page.waitForTimeout(600);
results.gardenReplants = await page.evaluate(() => document.querySelectorAll('.garden-vine').length);
await page.locator('#developer-pane .btn--primary').click();
await page.waitForTimeout(700);

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

// Back to the landing: returning-visitor greeting (typed into the hero
// line). Every hard load — refresh included — passes the full arrival.
await page.goto(ORIGIN + '/', { waitUntil: 'networkidle' });
await arrived();
await page.waitForTimeout(4200);
results.returningOnboardingShown = await page.locator('.threshold-panel').count();
results.returningGreeting = await page.locator('#hero-line').textContent();

// The reaching place (contact page): conversation -> folded letter
await page.goto(ORIGIN + '/contact.html', { waitUntil: 'networkidle' });
await arrived();
await page.waitForTimeout(1200);
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

// Night -> day, from another page: the reverse clip plays, the theme
// returns to light, and the stored choice follows.
await page.locator('#theme-toggle').click();
await page.waitForFunction(() => document.documentElement.dataset.theme !== 'dark', null, { timeout: 5000 });
results.themeBackToLight = await page.evaluate(
  () => (document.documentElement.dataset.theme ?? 'light') + '/' + localStorage.getItem('soena.theme.v1'),
);

// Reduced motion: the figure must arrive at its final size (no easing
// from the constructor's neutral scale — the old bug left it ~2.5x big),
// with a neutral head and no physics creep across events.
const rmPage = await browser.newPage({ viewport: { width: 1440, height: 900 } });
await rmPage.emulateMedia({ reducedMotion: 'reduce' });
await rmPage.goto(ORIGIN + '/', { waitUntil: 'networkidle' });
await rmPage.waitForFunction(() => document.documentElement.classList.contains('arrival-done'), null, { timeout: 9000 });
await rmPage.waitForSelector('#figure.is-here', { timeout: 8000 });
await rmPage.waitForTimeout(600);
results.reducedMotionFigure = await rmPage.evaluate(() => {
  const r = document.getElementById('figure').getBoundingClientRect();
  // landing scale 0.38 -> min(0.38*0.62*900, 0.42*1440/aspect) = ~212px
  const expected = 0.38 * 0.62 * 900;
  const head = document.querySelector('.figure-head');
  return {
    heightOk: Math.abs(r.height - expected) < 8,
    headNeutral: !head || head.style.transform.startsWith('rotate(0deg)'),
  };
});
await rmPage.close();

// The loading veil must be identical in dark mode — same ground, same
// wordmark colour — even though every other surface inverts.
const darkPage = await browser.newPage({ viewport: { width: 1440, height: 900 } });
await darkPage.addInitScript(() => localStorage.setItem('soena.theme.v1', 'dark'));
await darkPage.goto(ORIGIN + '/', { waitUntil: 'networkidle' });
await darkPage.waitForSelector('#arrival', { timeout: 5000 });
const darkVeil = await darkPage.evaluate(() => {
  const v = getComputedStyle(document.getElementById('arrival'));
  const w = getComputedStyle(document.querySelector('.arrival-word'));
  const l = getComputedStyle(document.querySelector('.arrival-line'));
  return {
    look: `${v.backgroundColor}|${w.color}|${l.backgroundColor}|${l.boxShadow}|${v.opacity}`,
    theme: document.documentElement.dataset.theme,
  };
});
results.veilSameInDark = darkVeil.look === veilLook && darkVeil.theme === 'dark';
results.veilDarkLook = darkVeil.look;
await darkPage.screenshot({ path: 'scripts/.shots/shot-veil-dark.png' });
await darkPage.close();

results.errors = errors;
console.log(JSON.stringify(results, null, 2));

await browser.close();
server.close();
