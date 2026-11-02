import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vite';

// The demo imports the package source; the CSS comes from dist (run `npm run build` first).
export default defineConfig({
  base: './',
  resolve: {
    alias: {
      '@motifx-community/design-system': fileURLToPath(new URL('../../src/index.ts', import.meta.url)),
    },
  },
});
