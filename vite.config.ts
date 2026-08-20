import { defineConfig } from 'vite';

// SOENA_SINGLEFILE=1 produces a one-file-friendly build (everything in a
// single JS bundle, fonts inlined as data URIs) that scripts/build-single.mjs
// folds into one portable HTML page for sandboxed previews.
const singlefile = process.env.SOENA_SINGLEFILE === '1';

// Relative base so the built site runs from any static host or subpath
// (GitHub Pages, Netlify, file://) without configuration.
export default defineConfig({
  base: './',
  build: {
    target: 'es2020',
    outDir: singlefile ? 'dist-single' : 'dist',
    cssCodeSplit: false,
    assetsInlineLimit: singlefile ? 100_000_000 : 2048,
    chunkSizeWarningLimit: 900,
    rollupOptions: {
      output: singlefile
        ? { inlineDynamicImports: true }
        : {
            // The WebGL layer (three + scene code) is its own chunk, loaded
            // lazily after first paint. The core app stays small so the door
            // opens instantly; the presence fades in when the GPU work arrives.
            manualChunks(id) {
              if (id.includes('node_modules/three')) return 'three';
            },
          },
    },
  },
});
