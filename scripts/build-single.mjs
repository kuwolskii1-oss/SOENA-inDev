/* Folds the SOENA_SINGLEFILE Vite build into one self-contained HTML page:
   inline CSS (fonts already data-URI'd), inline module JS, no external
   requests at all. Used for sandboxed previews (e.g. Claude artifacts).

   Usage: SOENA_SINGLEFILE=1 npx vite build && node scripts/build-single.mjs [out.html]
   The output is page content only (no <!doctype>/<html>/<body> wrapper) so a
   host page can supply its own document skeleton. */
import { readFileSync, writeFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

const DIST = new URL('../dist-single', import.meta.url).pathname;
const out = process.argv[2] ?? join(DIST, 'soena-single.html');

const html = readFileSync(join(DIST, 'index.html'), 'utf8');
const assets = readdirSync(join(DIST, 'assets'));
const jsFile = assets.find((f) => f.endsWith('.js'));
const cssFile = assets.find((f) => f.endsWith('.css'));
if (!jsFile || !cssFile) throw new Error('expected one js and one css asset');

// "</script" only ever appears inside JS strings/regex, where "<\/" is an
// identical escape — so this global replace is safe and keeps the inline
// script tag from being terminated early.
const js = readFileSync(join(DIST, 'assets', jsFile), 'utf8').replaceAll('</script', '<\\/script');
const css = readFileSync(join(DIST, 'assets', cssFile), 'utf8');

const critical = html.match(/<style>([\s\S]*?)<\/style>/)?.[1] ?? '';
const body = html.match(/<body>([\s\S]*?)<\/body>/)?.[1] ?? '';

const page = `<title>SOENA</title>
<style>${critical}</style>
<style>${css}</style>
${body.trim()}
<script type="module">${js}</script>
`;

writeFileSync(out, page);
console.log(`wrote ${out} (${(page.length / 1024).toFixed(0)} kB)`);
