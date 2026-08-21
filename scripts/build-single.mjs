/* Folds the SOENA_SINGLEFILE Vite build into one self-contained HTML page:
   inline CSS (fonts already data-URI'd), inline module JS, no external
   requests at all. Used for sandboxed previews (e.g. Claude artifacts).

   Usage: SOENA_SINGLEFILE=1 npx vite build && node scripts/build-single.mjs [out.html]
   The output is page content only (no <!doctype>/<html>/<body> wrapper) so a
   host page can supply its own document skeleton. */
import { readFileSync, writeFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

const DIST = new URL('../dist-single', import.meta.url).pathname;
const entry = process.env.SOENA_SINGLEFILE_ENTRY ?? 'index.html';
const out = process.argv[2] ?? join(DIST, 'soena-single.html');

const html = readFileSync(join(DIST, entry), 'utf8');
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
let body = html.match(/<body([^>]*)>([\s\S]*?)<\/body>/)?.[2] ?? '';
const bodyAttrs = html.match(/<body([^>]*)>/)?.[1] ?? '';
const title = html.match(/<title>([\s\S]*?)<\/title>/)?.[1]?.split('—')[0].trim() ?? 'SOENA';

// The single-file preview carries only this page, so links to other pages
// (added at runtime with the external-page-link class) must not render,
// and the brand link home becomes a plain mark.
const stripLinks = `<style>.external-page-link{display:none!important}</style>`;
body = body.replace(
  '<a class="brand brand--link" href="./index.html">SOENA</a>',
  '<div class="brand" aria-hidden="true">SOENA</div>',
);
// Body attributes (e.g. data-presence-anchor) must survive without a body
// tag of our own: replay them onto document.body at runtime.
const attrScript = bodyAttrs.trim()
  ? `<script>${JSON.stringify(bodyAttrs.trim())}.match(/([a-z-]+)="([^"]*)"/g)?.forEach(a=>{const m=a.match(/([a-z-]+)="([^"]*)"/);if(m)document.body.setAttribute(m[1],m[2]);});</script>`
  : '';

const page = `<title>${title}</title>
<style>${critical}</style>
<style>${css}</style>
${stripLinks}
${attrScript}
${body.trim()}
<script type="module">${js}</script>
`;

writeFileSync(out, page);
console.log(`wrote ${out} (${(page.length / 1024).toFixed(0)} kB)`);
