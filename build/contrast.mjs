// WCAG contrast gate: every text/background pair below must reach AA (4.5:1)
// in light and dark and AAA (7:1) in high contrast, in every design language.
// Part of `npm run build`; a failing pair fails the build, by design.
import { pathToFileURL } from 'node:url';
import { IDENTITIES, resolvedTokens } from './tokens.mjs';

/** Semantic pairs components rely on, checked in every theme of every language. */
export const CONTRAST_PAIRS = [
  ['color.fg.primary', 'color.bg.canvas'],
  ['color.fg.secondary', 'color.bg.canvas'],
  ['color.fg.primary', 'color.bg.layer'],
  ['color.fg.secondary', 'color.bg.layer'],
  ['color.fg.primary', 'color.bg.card'],
  ['color.fg.secondary', 'color.bg.card'],
  ['color.fg.primary', 'color.bg.surface'],
  ['color.fg.secondary', 'color.bg.surface'],
  ['color.fg.primary', 'color.bg.bar'],
  ['color.fg.secondary', 'color.bg.bar'],
  ['color.fg.primary', 'color.bg.container'],
  ['color.fg.secondary', 'color.bg.container'],
  ['color.fg.primary', 'color.bg.container-high'],
  ['color.fg.secondary', 'color.bg.container-high'],
  ['color.fg.primary', 'color.bg.header'],
  ['color.fg.secondary', 'color.bg.header'],
  ['color.fg.primary', 'color.bg.group'],
  ['color.fg.primary', 'color.fill.input.focus'],
  ['color.fg.primary', 'color.info.subtle'],
  ['color.fg.primary', 'color.fill.control.default'],
  ['color.fg.secondary', 'color.fill.control.default'],
  ['color.accent.on-solid', 'color.accent.solid'],
  ['color.accent.on-solid', 'color.accent.solid-hover'],
  ['color.accent.on-solid', 'color.accent.solid-pressed'],
  ['color.accent.fg', 'color.bg.canvas'],
  ['color.accent.fg', 'color.bg.surface'],
  ['color.accent.fg', 'color.accent.subtle'],
  ['color.accent.on-subtle', 'color.accent.subtle'],
  ['color.danger.fg', 'color.bg.canvas'],
  ['color.danger.fg', 'color.bg.surface'],
  ['color.danger.fg', 'color.danger.subtle'],
  ['color.danger.on-solid', 'color.danger.solid'],
  ['color.danger.on-solid', 'color.danger.solid-hover'],
  ['color.success.fg', 'color.bg.canvas'],
  ['color.success.fg', 'color.bg.surface'],
  ['color.success.fg', 'color.success.subtle'],
  ['color.caution.fg', 'color.bg.canvas'],
  ['color.caution.fg', 'color.bg.surface'],
  ['color.caution.fg', 'color.caution.subtle'],
];

export const required = (theme) => (theme === 'high-contrast' ? 7 : 4.5);

/** `#rrggbb` or `rgb(r g b / a)` as [r, g, b, a] with channels 0–255. */
export function parseCssColor(css) {
  let m = /^#([0-9a-f]{6})$/i.exec(css);
  if (m) return [0, 2, 4].map((i) => parseInt(m[1].slice(i, i + 2), 16)).concat(1);
  m = /^rgb\((\d+) (\d+) (\d+)(?: \/ ([\d.]+))?\)$/.exec(css);
  if (m) return [Number(m[1]), Number(m[2]), Number(m[3]), m[4] === undefined ? 1 : Number(m[4])];
  throw new Error(`contrast: cannot parse "${css}"`);
}

/** WCAG 2.x relative luminance of an opaque color. */
export function luminance(css) {
  const [r, g, b, a] = parseCssColor(css);
  if (a < 1) throw new Error(`contrast: "${css}" is translucent; checked pairs must be opaque`);
  const lin = (v) => {
    const c = v / 255;
    return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
}

/** WCAG 2.x contrast ratio, 1–21. */
export function contrastRatio(a, b) {
  const [la, lb] = [luminance(a), luminance(b)];
  const [hi, lo] = la > lb ? [la, lb] : [lb, la];
  return (hi + 0.05) / (lo + 0.05);
}

// ---- color blindness: status colors must stay apart, not only on the hue ----

/** Status colors a reader tells apart by color: they must differ for a color-blind reader too. */
export const DISTINCT_PAIRS = [
  ['color.success.fg', 'color.danger.fg'],
  ['color.caution.fg', 'color.danger.fg'],
];
/** The smallest OKLab distance (×100) two of them may keep for a deuteranope or a protanope. */
export const DISTINCT_MIN = 10;
/**
 * Languages whose status colors come from somewhere else (Material, Fluent: their own specs):
 * reported, not enforced. The kit's own languages and every new one are enforced.
 */
export const DISTINCT_REPORTED = ['material', 'fluent'];

// Machado, Oliveira and Fernandes (2009), full severity, on linear sRGB.
const SIGHT = {
  deuteranopia: [[0.367322, 0.860646, -0.227968], [0.280085, 0.672501, 0.047413], [-0.01182, 0.04294, 0.968881]],
  protanopia: [[0.152286, 1.052583, -0.204868], [0.114503, 0.786281, 0.099216], [-0.003882, -0.048116, 1.051998]],
};
const linear = (v) => {
  const c = v / 255;
  return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
};
const oklab = ([r, g, b]) => {
  const l = Math.cbrt(0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b);
  const m = Math.cbrt(0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b);
  const s = Math.cbrt(0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b);
  return [0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s, 1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s, 0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s];
};

/** OKLab distance ×100 of two opaque colors as a reader with the given sight sees them (none: normal sight). */
export function seenDistance(a, b, sight) {
  const seen = (css) => {
    const rgb = parseCssColor(css).slice(0, 3).map(linear);
    const m = SIGHT[sight];
    return oklab(m ? m.map((row) => Math.min(1, Math.max(0, row[0] * rgb[0] + row[1] * rgb[1] + row[2] * rgb[2]))) : rgb);
  };
  const [x, y] = [seen(a), seen(b)];
  return Math.hypot(x[0] - y[0], x[1] - y[1], x[2] - y[2]) * 100;
}

/** One row per status pair per sight per theme per language: { identity, theme, a, b, sight, distance, enforced, pass }. */
export async function checkDistinct(identities = Object.keys(IDENTITIES)) {
  const rows = [];
  for (const identity of identities) {
    for (const theme of IDENTITIES[identity].themes.filter((t) => t !== 'high-contrast')) {
      const tokens = await resolvedTokens({ identity, theme });
      const byName = new Map(tokens.map((t) => [t.path.join('.'), t.$value]));
      for (const [a, b] of DISTINCT_PAIRS) {
        for (const sight of Object.keys(SIGHT)) {
          const distance = seenDistance(byName.get(a), byName.get(b), sight);
          rows.push({ identity, theme, a, b, sight, distance, enforced: !DISTINCT_REPORTED.includes(identity), pass: distance >= DISTINCT_MIN });
        }
      }
    }
  }
  return rows;
}

/** One row per pair per theme per language: { identity, theme, fg, bg, fgValue, bgValue, ratio, required, pass }. */
export async function checkContrast(identities = Object.keys(IDENTITIES)) {
  const rows = [];
  for (const identity of identities) {
    for (const theme of IDENTITIES[identity].themes) {
      const tokens = await resolvedTokens({ identity, theme });
      const byName = new Map(tokens.map((t) => [t.path.join('.'), t.$value]));
      for (const [fg, bg] of CONTRAST_PAIRS) {
        for (const name of [fg, bg]) {
          if (!byName.has(name)) throw new Error(`contrast: "${name}" is not a token in "${identity}" ${theme}`);
        }
        const ratio = contrastRatio(byName.get(fg), byName.get(bg));
        rows.push({
          identity,
          theme,
          fg,
          bg,
          fgValue: byName.get(fg),
          bgValue: byName.get(bg),
          ratio,
          required: required(theme),
          pass: ratio >= required(theme),
        });
      }
    }
  }
  return rows;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const rows = await checkContrast();
  const failed = rows.filter((r) => !r.pass);
  const line = (r) =>
    `${r.pass ? 'PASS' : 'FAIL'}  ${r.identity.padEnd(8)} ${r.theme.padEnd(13)} ${r.fg.padEnd(24)} on ${r.bg.padEnd(22)} ${r.ratio.toFixed(2)} (needs ${r.required})`;
  if (process.argv.includes('--verbose') || failed.length) for (const r of rows) console.log(line(r));
  if (failed.length) {
    console.error(`\ncontrast: ${failed.length} of ${rows.length} pairs below the bar`);
    process.exit(1);
  }
  console.log(`contrast: ${rows.length} pairs pass (AA; AAA in high-contrast)`);

  const distinct = await checkDistinct();
  const close = distinct.filter((r) => !r.pass);
  const say = (r) => `${r.enforced ? 'FAIL' : 'note'}  ${r.identity.padEnd(8)} ${r.theme.padEnd(6)} ${r.a} / ${r.b} for ${r.sight}: ${r.distance.toFixed(1)} (needs ${DISTINCT_MIN})`;
  for (const r of close) console.log(say(r));
  const blocking = close.filter((r) => r.enforced);
  if (blocking.length) {
    console.error(`
color blindness: ${blocking.length} status pairs too close in an enforced language`);
    process.exit(1);
  }
  console.log(`color blindness: ${distinct.length - close.length} of ${distinct.length} status pairs apart${close.length ? `; ${close.length} close in ${[...new Set(close.map((r) => r.identity))].join(', ')} (reported)` : ''}`);
}
