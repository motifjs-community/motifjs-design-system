// Real-Chrome smoke over the built demo (examples/basic/dist): themes, density,
// scoped themes, system preference, reduced motion, forced colors, focus ring
// and a canvas drawn from tokens. Also refreshes the README screenshots.
//
//   npm run build && npm run example:build
//   PW_CORE=../motifjs-realworld/node_modules/playwright-core/index.mjs npm run e2e
//
// Needs a local Chrome (channel "chrome") and a playwright-core install to borrow;
// it is not part of CI on purpose.
import { createServer } from 'node:http';
import { existsSync, readFileSync, statSync } from 'node:fs';
import { dirname, extname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const pwPath = process.env.PW_CORE;
if (!pwPath) {
  console.error('Set PW_CORE to a playwright-core index.mjs, e.g. ../motifjs-realworld/node_modules/playwright-core/index.mjs');
  process.exit(2);
}
const { chromium } = await import('file:///' + resolve(root, pwPath).replace(/\\/g, '/'));
const dist = join(root, 'examples/basic/dist');
if (!existsSync(join(dist, 'index.html'))) {
  console.error('examples/basic/dist is missing: run `npm run build && npm run example:build` first');
  process.exit(2);
}
const types = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.png': 'image/png' };

const server = createServer((req, res) => {
  let file = join(dist, decodeURIComponent(new URL(req.url, 'http://x').pathname));
  if (!existsSync(file) || statSync(file).isDirectory()) file = join(dist, 'index.html');
  res.writeHead(200, { 'content-type': types[extname(file)] ?? 'application/octet-stream' });
  res.end(readFileSync(file));
});
await new Promise((r) => server.listen(4611, r));

// Scrollbars stay visible, so their thickness can be checked.
const browser = await chromium.launch({ channel: 'chrome', ignoreDefaultArgs: ['--hide-scrollbars'] });
const failures = [];
const check = (name, ok, detail = '') => {
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${detail ? `  (${detail})` : ''}`);
  if (!ok) failures.push(name);
};

const context = await browser.newContext({ colorScheme: 'light', viewport: { width: 1200, height: 900 } });
const page = await context.newPage();
const errors = [];
page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
page.on('pageerror', (e) => errors.push(String(e)));
await page.goto('http://localhost:4611/');
await page.waitForSelector('.demo-card');

// A custom property's computed value is its source text (the demo's minifier
// may have turned `rgb(…)` into hex and `0ms` into `0s`), so colors and times
// are normalised by the browser before comparing.
const prop = (name, selector = 'html') =>
  page.evaluate(([n, s]) => getComputedStyle(document.querySelector(s)).getPropertyValue(n).trim(), [name, selector]);
const color = async (name, selector = 'html') =>
  page.evaluate((v) => {
    const el = document.createElement('i');
    el.style.color = v;
    document.body.append(el);
    const c = getComputedStyle(el).color;
    el.remove();
    return c;
  }, await prop(name, selector));
const ms = async (name) => {
  const v = await prop(name);
  return v.endsWith('ms') ? parseFloat(v) : parseFloat(v) * 1000;
};
const bodyBg = () => page.evaluate(() => getComputedStyle(document.body).backgroundColor);

check('page renders without console errors', errors.length === 0, errors.join(' | '));
check('light theme by default', (await color('--mx-color-bg-canvas')) === 'rgb(225, 224, 218)', await color('--mx-color-bg-canvas'));
check('body background comes from the token', (await bodyBg()) === 'rgb(225, 224, 218)', await bodyBg());
const subtle = await color('--mx-color-fill-subtle-secondary');
const subtleAlpha = parseFloat(/[\d.]+\)$/.exec(subtle)?.[0] ?? '0');
check('translucent fill keeps a small alpha (a minifier may round 0.0373 to 8 bits)', subtle.startsWith('rgba(0, 0, 0,') && subtleAlpha > 0.03 && subtleAlpha < 0.05, subtle);
check('shadow token renders a shadow list', (await prop('--mx-shadow-4')).includes(','), await prop('--mx-shadow-4'));
check('duration token', (await ms('--mx-motion-duration-fast')) === 83, await prop('--mx-motion-duration-fast'));
check('comfortable density by default', (await prop('--mx-control-height-md')) === '2rem', await prop('--mx-control-height-md'));
const bar = await page.evaluate(() => {
  const box = document.createElement('div');
  box.style.cssText = 'inline-size: 100px; block-size: 60px; overflow: auto';
  box.innerHTML = '<div style="block-size: 300px"></div>';
  document.body.append(box);
  const width = box.offsetWidth - box.clientWidth;
  box.remove();
  return width;
});
check('scrollbars are slim (scrollbar.size)', bar === 8, `${bar}px`);
check('value labels filled from computed styles', (await page.locator('[data-token="color.bg.canvas"]').first().textContent()).trim().length > 3);

await page.screenshot({ path: join(root, 'examples/basic/screenshot-light.png') });

// theme switch through the demo's select (setTheme)
await page.selectOption('select[aria-label="Theme"]', 'dark');
check('dark theme after setTheme', (await color('--mx-color-bg-canvas')) === 'rgb(35, 34, 32)', await color('--mx-color-bg-canvas'));
check('color-scheme follows the theme', (await page.evaluate(() => getComputedStyle(document.documentElement).colorScheme)) === 'dark');
await page.screenshot({ path: join(root, 'examples/basic/screenshot-dark.png') });

await page.selectOption('select[aria-label="Theme"]', 'high-contrast');
check('high-contrast theme', (await color('--mx-color-bg-canvas')) === 'rgb(0, 0, 0)', await color('--mx-color-bg-canvas'));
check('high-contrast accent', (await color('--mx-color-accent-solid')) === 'rgb(214, 180, 253)', await color('--mx-color-accent-solid'));

// density
await page.click('button:has-text("Compact")');
check('compact density after setDensity', (await prop('--mx-control-height-md')) === '1.5rem', await prop('--mx-control-height-md'));
const buttonHeight = (await page.locator('.demo-button').boundingBox()).height;
check('demo button height follows density', Math.abs(buttonHeight - 24) < 1.5, String(buttonHeight));

// scoped theme: a nested element with its own data-theme
const scoped = await page.evaluate(() => {
  const el = document.createElement('div');
  el.dataset.theme = 'light';
  document.body.append(el);
  el.style.color = getComputedStyle(el).getPropertyValue('--mx-color-bg-canvas').trim();
  const v = getComputedStyle(el).color;
  el.remove();
  return v;
});
check('a nested data-theme scopes its subtree', scoped === 'rgb(225, 224, 218)', scoped);

// design language: the picker writes data-design-language; the default language under its own scope is the same language
await page.selectOption('select[aria-label="Theme"]', 'light');
await page.selectOption('select[aria-label="Theme"]', 'light');
await page.selectOption('select[aria-label="Design language"]', 'tactile');
check('setDesignLanguage writes data-design-language', (await page.evaluate(() => document.documentElement.dataset.designLanguage)) === 'tactile');
check('a language scope with a theme on the same element takes that theme', (await color('--mx-color-bg-canvas')) === 'rgb(225, 224, 218)', await color('--mx-color-bg-canvas'));
const nested = await page.evaluate(() => {
  const el = document.createElement('div');
  el.dataset.theme = 'dark';
  document.body.append(el);
  el.style.color = getComputedStyle(el).getPropertyValue('--mx-color-bg-canvas').trim();
  const v = getComputedStyle(el).color;
  el.remove();
  return v;
});
check('a theme scope inside a language scope takes the theme of that language', nested === 'rgb(35, 34, 32)', nested);

// Lounge: a language that starts dark and ships dark only
const setCompact = async (on) => {
  const pressed = (await page.getAttribute('button:has-text("Compact")', 'aria-pressed')) === 'true';
  if (pressed !== on) await page.click('button:has-text("Compact")');
};
await setCompact(false);
await page.selectOption('select[aria-label="Theme"]', 'system');
await page.selectOption('select[aria-label="Design language"]', 'lounge');
check('Lounge canvas is its warm black, with the system light', (await color('--mx-color-bg-canvas')) === 'rgb(14, 13, 11)', await color('--mx-color-bg-canvas'));
check('Lounge brings its own corners', parseFloat(await prop('--mx-radius-md')) === 1.125, await prop('--mx-radius-md'));
check('Lounge brings its own control sizes', (await prop('--mx-control-height-md')) === '2.25rem', await prop('--mx-control-height-md'));
check('Lounge tells the browser it is dark', (await page.evaluate(() => getComputedStyle(document.documentElement).colorScheme)) === 'dark');
await page.emulateMedia({ colorScheme: 'dark' });
check('Lounge stays Lounge under a dark system', (await color('--mx-color-bg-canvas')) === 'rgb(14, 13, 11)', await color('--mx-color-bg-canvas'));
await page.emulateMedia({ colorScheme: 'light' });
await setCompact(true);
check('Lounge compact density', (await prop('--mx-control-height-md')) === '1.75rem', await prop('--mx-control-height-md'));
await setCompact(false);
if (process.env.LOUNGE_SHOT) await page.screenshot({ path: process.env.LOUNGE_SHOT, fullPage: false });
await page.selectOption('select[aria-label="Theme"]', 'high-contrast');
check('high contrast still wins inside Lounge', (await color('--mx-color-bg-canvas')) === 'rgb(0, 0, 0)', await color('--mx-color-bg-canvas'));
await page.selectOption('select[aria-label="Theme"]', 'system');

// Material: starts light, follows the system, ships light and dark
await page.selectOption('select[aria-label="Design language"]', 'material');
check('Material canvas, light', (await color('--mx-color-bg-canvas')) === 'rgb(253, 247, 255)', await color('--mx-color-bg-canvas'));
check('Material accent, light', (await color('--mx-color-accent-solid')) === 'rgb(100, 66, 214)', await color('--mx-color-accent-solid'));
check('Material type is Google Sans Flex', (await prop('--mx-font-family-sans')).startsWith('"Google Sans Flex"') || (await prop('--mx-font-family-sans')).startsWith('Google Sans Flex'), await prop('--mx-font-family-sans'));
check('Material controls are flat', parseFloat(await prop('--mx-control-edge-width')) === 0, await prop('--mx-control-edge-width'));
await page.emulateMedia({ colorScheme: 'dark' });
check('Material follows a dark system', (await color('--mx-color-bg-canvas')) === 'rgb(20, 19, 24)', await color('--mx-color-bg-canvas'));
check('Material accent, dark', (await color('--mx-color-accent-solid')) === 'rgb(159, 134, 255)', await color('--mx-color-accent-solid'));
await page.emulateMedia({ colorScheme: 'light' });
// Fluent: WinUI 3's light and dark from its own theme resources
await page.selectOption('select[aria-label="Design language"]', 'fluent');
check('Fluent canvas, light', (await color('--mx-color-bg-canvas')) === 'rgb(243, 243, 243)', await color('--mx-color-bg-canvas'));
check('Fluent accent, light', (await color('--mx-color-accent-solid')) === 'rgb(0, 95, 184)', await color('--mx-color-accent-solid'));
check('Fluent control corners', parseFloat(await prop('--mx-radius-md')) === 4, await prop('--mx-radius-md'));
check('Fluent overlay corners', parseFloat(await prop('--mx-radius-lg')) === 8, await prop('--mx-radius-lg'));
await page.emulateMedia({ colorScheme: 'dark' });
check('Fluent follows a dark system', (await color('--mx-color-bg-canvas')) === 'rgb(32, 32, 32)', await color('--mx-color-bg-canvas'));
check('Fluent accent, dark', (await color('--mx-color-accent-solid')) === 'rgb(96, 205, 255)', await color('--mx-color-accent-solid'));
await page.emulateMedia({ colorScheme: 'light' });
// Lilac: a lilac accent on lavender-tinted neutrals, soft corners, roomy flat controls
await page.selectOption('select[aria-label="Design language"]', 'lilac');
check('Lilac canvas, light', (await color('--mx-color-bg-canvas')) === 'rgb(254, 247, 254)', await color('--mx-color-bg-canvas'));
check('Lilac accent, light', (await color('--mx-color-accent-solid')) === 'rgb(117, 80, 173)', await color('--mx-color-accent-solid'));
check('Lilac type is Nunito Sans', (await prop('--mx-font-family-sans')).replace(/"/g, '').startsWith('Nunito Sans'), await prop('--mx-font-family-sans'));
check('Lilac corners', parseFloat(await prop('--mx-radius-md')) === 12, await prop('--mx-radius-md'));
check('Lilac controls are roomy and flat', (await prop('--mx-control-height-md')) === '2.25rem' && parseFloat(await prop('--mx-control-edge-width')) === 0, await prop('--mx-control-height-md'));
await page.emulateMedia({ colorScheme: 'dark' });
check('Lilac follows a dark system, no pure black', (await color('--mx-color-bg-canvas')) === 'rgb(21, 18, 23)', await color('--mx-color-bg-canvas'));
await page.emulateMedia({ colorScheme: 'light' });
await page.selectOption('select[aria-label="Design language"]', 'tactile');

// system theme: back to 'system', emulate dark
await page.selectOption('select[aria-label="Theme"]', 'system');
await page.emulateMedia({ colorScheme: 'dark' });
check('system choice follows prefers-color-scheme: dark', (await color('--mx-color-bg-canvas')) === 'rgb(35, 34, 32)', await color('--mx-color-bg-canvas'));
await page.emulateMedia({ colorScheme: 'light' });
check('…and back to light', (await color('--mx-color-bg-canvas')) === 'rgb(225, 224, 218)');

// reduced motion zeroes durations
await page.emulateMedia({ reducedMotion: 'reduce' });
check('reduced motion zeroes the durations', (await ms('--mx-motion-duration-fast')) === 0, await prop('--mx-motion-duration-fast'));
await page.emulateMedia({ reducedMotion: 'no-preference' });

// forced colors: tokens become system colors
await page.emulateMedia({ forcedColors: 'active' });
const forced = await prop('--mx-color-bg-canvas');
check('forced colors maps tokens to system colors', /^Canvas$/i.test(forced), forced);
await page.emulateMedia({ forcedColors: 'none' });

// focus ring only for keyboard focus
await page.click('button:has-text("Focus me with Tab")');
const mouseOutline = await page.evaluate(() => getComputedStyle(document.activeElement).outlineStyle);
await page.keyboard.press('Shift+Tab');
await page.keyboard.press('Tab');
const kbd = await page.evaluate(() => ({
  style: getComputedStyle(document.activeElement).outlineStyle,
  width: getComputedStyle(document.activeElement).outlineWidth,
  text: document.activeElement.textContent,
}));
check('no focus ring after a mouse click', mouseOutline === 'none', mouseOutline);
check('focus ring on keyboard focus', kbd.style === 'solid' && kbd.width === '2px' && kbd.text.includes('Focus me'), JSON.stringify(kbd));

// the canvas drew with the tokens (a pixel inside the accent node)
const painted = await page.evaluate(() => Array.from(document.querySelector('canvas').getContext('2d').getImageData(40, 40, 1, 1).data));
check('canvas painted the accent node from tokens', painted[3] === 255 && !(painted[0] === 0 && painted[1] === 0 && painted[2] === 0), painted.join(','));

// direction toggle
await page.click('button:has-text("RTL")');
check('dir=rtl applied', (await page.evaluate(() => document.documentElement.dir)) === 'rtl');

check('still no console errors at the end', errors.length === 0, errors.join(' | '));

await browser.close();
server.close();
console.log(failures.length ? `\n${failures.length} check(s) failed` : '\nall checks passed');
process.exit(failures.length ? 1 : 0);
