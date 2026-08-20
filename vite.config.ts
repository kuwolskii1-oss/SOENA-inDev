import { defineConfig } from 'vite';

// Relative base so the built site runs from any static host or subpath
// (GitHub Pages, Netlify, file://) without configuration.
export default defineConfig({
  base: './',
  build: {
    target: 'es2020',
    cssCodeSplit: false,
    assetsInlineLimit: 2048,
    rollupOptions: {
      output: {
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
