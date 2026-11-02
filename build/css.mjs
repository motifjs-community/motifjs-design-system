// Assembles dist/css/styles.css (the one import an app needs) from the layer
// order, the reset, the generated tokens, themes and design languages, the
// preference overrides and the base styles, and copies the hand-written files
// next to it. One flat file, no @import, so it also works from a CDN.
import { copyFileSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { join } from 'node:path';
import { DEFAULT_IDENTITY, IDENTITIES, ROOT } from './tokens.mjs';
import { LAYER_ORDER } from './build.mjs';

const read = (rel) => readFileSync(join(ROOT, rel), 'utf8');
const stripHeader = (css) => css.replace(/^\/\*.*\*\/\n/, '');

const parts = [
  '/* @motifx-community/design-system: reset, fonts, tokens, themes, preference overrides and base styles. */\n',
  LAYER_ORDER,
  read('src/css/reset.css'),
  read('src/css/fonts.css'),
  stripHeader(read('dist/css/tokens.css')).replace(LAYER_ORDER, ''),
  stripHeader(read('dist/css/themes/auto.css')),
  ...IDENTITIES[DEFAULT_IDENTITY].themes.map((t) => stripHeader(read(`dist/css/themes/${t}.css`))),
  ...Object.keys(IDENTITIES).map((i) => stripHeader(read(`dist/css/identities/${i}.css`))),
  read('src/css/preferences.css'),
  read('src/css/base.css'),
];
writeFileSync(join(ROOT, 'dist/css/styles.css'), parts.join('\n'));
for (const f of ['reset.css', 'fonts.css', 'preferences.css', 'base.css']) {
  copyFileSync(join(ROOT, 'src/css', f), join(ROOT, 'dist/css', f));
}

// The identity faces, from the Fontsource builds (devDependencies; the package
// has no runtime dependency): the files fonts.css points at, next to it.
const resolve = createRequire(import.meta.url).resolve;
const pkgDir = (name) => resolve(`${name}/package.json`).replace(/package\.json$/, '');
const FONTS = {
  '@fontsource-variable/archivo': {
    files: [
      'archivo-latin-standard-normal.woff2',
      'archivo-latin-ext-standard-normal.woff2',
      'archivo-latin-standard-italic.woff2',
      'archivo-latin-ext-standard-italic.woff2',
    ],
    license: 'LICENSE-Archivo.txt',
  },
  '@fontsource/jetbrains-mono': {
    files: [
      'jetbrains-mono-latin-400-normal.woff2',
      'jetbrains-mono-latin-ext-400-normal.woff2',
      'jetbrains-mono-latin-500-normal.woff2',
      'jetbrains-mono-latin-ext-500-normal.woff2',
    ],
    license: 'LICENSE-JetBrainsMono.txt',
  },
  '@fontsource-variable/google-sans-flex': {
    files: ['google-sans-flex-latin-wdth-normal.woff2', 'google-sans-flex-latin-ext-wdth-normal.woff2'],
    license: 'LICENSE-GoogleSansFlex.txt',
  },
  '@fontsource-variable/google-sans-code': {
    files: ['google-sans-code-latin-wght-normal.woff2', 'google-sans-code-latin-ext-wght-normal.woff2'],
    license: 'LICENSE-GoogleSansCode.txt',
  },
  '@fontsource-variable/nunito-sans': {
    files: [
      'nunito-sans-latin-standard-normal.woff2',
      'nunito-sans-latin-ext-standard-normal.woff2',
      'nunito-sans-latin-standard-italic.woff2',
      'nunito-sans-latin-ext-standard-italic.woff2',
    ],
    license: 'LICENSE-NunitoSans.txt',
  },
  '@fontsource-variable/fraunces': {
    files: ['fraunces-latin-soft-normal.woff2', 'fraunces-latin-ext-soft-normal.woff2'],
    license: 'LICENSE-Fraunces.txt',
  },
};
const fontsDir = join(ROOT, 'dist/css/fonts');
mkdirSync(fontsDir, { recursive: true });
let fontCount = 0;
for (const [name, { files, license }] of Object.entries(FONTS)) {
  const dir = pkgDir(name);
  for (const f of files) {
    copyFileSync(join(dir, 'files', f), join(fontsDir, f));
    fontCount++;
  }
  copyFileSync(join(dir, 'LICENSE'), join(fontsDir, license));
}
console.log(`css: dist/css/styles.css, reset.css, fonts.css (+${fontCount} font files), preferences.css, base.css`);

