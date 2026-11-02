// Style Dictionary setup shared by build.mjs, contrast.mjs and the tests:
// where the DTCG source lives, how each value type renders to CSS, and the
// formats that write the layered CSS, the typed token map and the flat JSON.
import StyleDictionary from 'style-dictionary';
import { formattedVariables } from 'style-dictionary/utils';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

export const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..').replace(/\\/g, '/');

/** Every CSS custom property is `--mx-<token path in kebab case>`. */
export const PREFIX = 'mx';
/** Token declarations live in this cascade layer; src/css/layers.css declares the order. */
export const LAYER = 'mx.tokens';

/**
 * The design languages the package ships, the value of `data-identity`: for
 * each one, the themes (color modes) and densities it defines and its
 * defaults. Token names are the same in every language; the values differ.
 */
export const IDENTITIES = {
  tactile: {
    themes: ['light', 'dark', 'high-contrast'],
    defaultTheme: 'light',
    densities: ['comfortable', 'compact'],
    defaultDensity: 'comfortable',
  },
  lounge: {
    themes: ['dark'],
    defaultTheme: 'dark',
    densities: ['comfortable', 'compact'],
    defaultDensity: 'comfortable',
  },
  material: {
    themes: ['light', 'dark'],
    defaultTheme: 'light',
    densities: ['comfortable', 'compact'],
    defaultDensity: 'comfortable',
  },
  fluent: {
    themes: ['light', 'dark'],
    defaultTheme: 'light',
    densities: ['comfortable', 'compact'],
    defaultDensity: 'comfortable',
  },
  lilac: {
    themes: ['light', 'dark'],
    defaultTheme: 'light',
    densities: ['comfortable', 'compact'],
    defaultDensity: 'comfortable',
  },
};
export const DEFAULT_IDENTITY = 'tactile';
/** The whole theme vocabulary (the values of `data-theme`); a language ships a subset. */
export const THEMES = ['light', 'dark', 'high-contrast'];
export const DEFAULT_THEME = 'light';
/** The whole density vocabulary (the values of `data-density`). */
export const DENSITIES = ['comfortable', 'compact'];
export const DEFAULT_DENSITY = 'comfortable';

export const SOURCES = {
  primitive: `${ROOT}/tokens/primitive/*.json`,
  identity: (identity) => `${ROOT}/tokens/identity/${identity}/base.json`,
  semantic: (identity, theme) => `${ROOT}/tokens/identity/${identity}/${theme}.json`,
  density: (identity, density) => `${ROOT}/tokens/identity/${identity}/density/${density}.json`,
};

/**
 * The layer a token belongs to, from the file it was defined in: the shared
 * primitives, a language's own scales (`identity`), its semantic colors per
 * theme, or its control sizes per density.
 */
export function layerOf(token) {
  const file = String(token.filePath).replace(/\\/g, '/');
  if (file.includes('/tokens/primitive/')) return 'primitive';
  if (file.includes('/tokens/identity/')) {
    if (file.includes('/density/')) return 'density';
    if (file.endsWith('/base.json')) return 'identity';
    return 'semantic';
  }
  return 'other';
}

// ---- value renderers (DTCG 2025.10 objects to CSS) ----------------------------------------
// Style Dictionary's own color transform rounds alpha to two decimals and does
// not know `duration` objects; these renderers keep every value exact.

const to255 = (c) => Math.round(c * 255);
const hex2 = (n) => n.toString(16).padStart(2, '0');

/** A DTCG color object (or a legacy CSS string) as a CSS color. */
export function colorToCss(value) {
  if (typeof value === 'string') return value;
  const { colorSpace, components, alpha, hex } = value;
  const a = alpha === undefined ? 1 : alpha;
  const comps = components.map((c) => (c === 'none' ? 'none' : c));
  if (colorSpace === 'srgb') {
    const [r, g, b] = comps.map((c) => (c === 'none' ? 0 : to255(c)));
    if (a >= 1) return hex ?? `#${hex2(r)}${hex2(g)}${hex2(b)}`;
    return `rgb(${r} ${g} ${b} / ${a})`;
  }
  const fn = { oklch: 'oklch', oklab: 'oklab', lab: 'lab', lch: 'lch' }[colorSpace];
  const body = fn ? `${fn}(${comps.join(' ')}` : `color(${colorSpace} ${comps.join(' ')}`;
  return a >= 1 ? `${body})` : `${body} / ${a})`;
}

/** A DTCG dimension or duration object (`{ value, unit }`) as a CSS length or time. */
export function unitToCss(value) {
  return typeof value === 'object' && value !== null ? `${value.value}${value.unit}` : String(value);
}

const WEIGHTS = {
  thin: 100,
  hairline: 100,
  'extra-light': 200,
  'ultra-light': 200,
  light: 300,
  normal: 400,
  regular: 400,
  book: 400,
  medium: 500,
  'semi-bold': 600,
  'demi-bold': 600,
  bold: 700,
  'extra-bold': 800,
  'ultra-bold': 800,
  black: 900,
  heavy: 900,
  'extra-black': 950,
  'ultra-black': 950,
};

/** A DTCG font weight (number or alias) as a numeric CSS font-weight. */
export function fontWeightToCss(value) {
  return typeof value === 'string' && value in WEIGHTS ? String(WEIGHTS[value]) : String(value);
}

/** A DTCG shadow (object or array) as a CSS box-shadow list. A shadow that references another one
 *  sees that token's rendered text (the transform is transitive) and passes it through. */
export function shadowToCss(value) {
  if (typeof value === 'string') return value;
  const one = (s) =>
    `${s.inset ? 'inset ' : ''}${unitToCss(s.offsetX)} ${unitToCss(s.offsetY)} ${unitToCss(s.blur)} ${unitToCss(s.spread)} ${colorToCss(s.color)}`;
  return (Array.isArray(value) ? value : [value]).map(one).join(', ');
}

const typeOf = (t) => t.$type ?? t.type;
const valueOf = (t) => t.$value ?? t.value;

const valueTransform = (name, type, render) =>
  StyleDictionary.registerTransform({
    name,
    type: 'value',
    // Transitive: run after references resolve, so a shadow whose color is
    // `{color.smoke}` still renders. Reference output stays intact: the
    // formatter swaps the referenced token's rendered value for its var().
    transitive: true,
    filter: (t) => typeOf(t) === type,
    transform: (t) => render(valueOf(t)),
  });

valueTransform('mx/color', 'color', colorToCss);
valueTransform('mx/dimension', 'dimension', unitToCss);
valueTransform('mx/duration', 'duration', unitToCss);
valueTransform('mx/fontWeight', 'fontWeight', fontWeightToCss);
valueTransform('mx/shadow', 'shadow', shadowToCss);

/** The transform chain every platform uses; `fontFamily/css` and `cubicBezier/css` are Style Dictionary's. */
export const TRANSFORMS = [
  'name/kebab',
  'mx/color',
  'mx/dimension',
  'mx/duration',
  'mx/fontWeight',
  'mx/shadow',
  'fontFamily/css',
  'cubicBezier/css',
];

// ---- formats ------------------------------------------------------------------------------

export const HEADER =
  '/* Generated by build/build.mjs of @motifx-community/design-system from tokens/*.json. Do not edit; edit the source and rebuild. */\n';

/** `{color.gray.95}` becomes `color.gray.95`; null when the original value is not a plain reference. */
export function referenceOf(token) {
  const original = token.original?.$value ?? token.original?.value;
  const m = typeof original === 'string' ? /^\{([^{}]+)\}$/.exec(original) : null;
  return m ? m[1] : null;
}

const indentLines = (text, indent) =>
  text
    .split('\n')
    .map((l) => (l ? indent + l : l))
    .join('\n');

/**
 * One `selector { --mx-…: …; }` block inside `@layer mx.tokens`, optionally
 * wrapped in a media query. Options: `selector`, `media`, `outputReferences`.
 */
StyleDictionary.registerFormat({
  name: 'mx/css',
  format: ({ dictionary, options }) => {
    const vars = formattedVariables({
      format: 'css',
      dictionary,
      outputReferences: options.outputReferences ?? true,
      formatting: { indentation: '' },
      usesDtcg: true,
    });
    let block = `${options.selector} {\n${indentLines(vars, '  ')}\n}`;
    if (options.media) block = `@media ${options.media} {\n${indentLines(block, '  ')}\n}`;
    return `@layer ${LAYER} {\n${indentLines(block, '  ')}\n}\n`;
  },
});

const tsString = (s) => `'${String(s).replace(/\\/g, '\\\\').replace(/'/g, "\\'")}'`;

/** The typed token map: every token name mapped to its CSS custom property, type and layer. */
StyleDictionary.registerFormat({
  name: 'mx/ts',
  format: ({ dictionary }) => {
    const entries = dictionary.allTokens.map((t) => {
      const doc = [];
      if (t.$description) doc.push(t.$description);
      if (t.$deprecated) doc.push(`@deprecated ${typeof t.$deprecated === 'string' ? t.$deprecated : ''}`.trim());
      const jsdoc = doc.length ? `  /** ${doc.join(' ')} */\n` : '';
      return `${jsdoc}  ${tsString(t.path.join('.'))}: { cssVar: '--${t.name}', type: ${tsString(typeOf(t))}, layer: ${tsString(layerOf(t))} },`;
    });
    const list = (arr) => arr.map(tsString).join(', ');
    return [
      '// Generated by build/build.mjs of @motifx-community/design-system from tokens/*.json. Do not edit; edit the source and rebuild.',
      '',
      '/** Every design token: its CSS custom property, its DTCG type and the layer it is defined in. */',
      'export const tokens = {',
      ...entries,
      '} as const;',
      '',
      '/** A design token name, e.g. `color.bg.canvas`. */',
      'export type TokenName = keyof typeof tokens;',
      '/** The DTCG types used in this token set. */',
      "export type TokenType = (typeof tokens)[TokenName]['type'];",
      '',
      `export const identities = [${list(Object.keys(IDENTITIES))}] as const;`,
      '/** A shipped design language, the value of `data-identity`. */',
      'export type IdentityName = (typeof identities)[number];',
      `export const defaultIdentity: IdentityName = ${tsString(DEFAULT_IDENTITY)};`,
      '/** The themes each design language ships and the one its scope starts from. */',
      'export const identityThemes = {',
      ...Object.entries(IDENTITIES).map(
        ([name, l]) => `  ${tsString(name)}: { themes: [${list(l.themes)}], defaultTheme: ${tsString(l.defaultTheme)} },`,
      ),
      '} as const;',
      '',
      `export const themes = [${list(THEMES)}] as const;`,
      '/** A shipped theme, the value of `data-theme`. */',
      'export type ThemeName = (typeof themes)[number];',
      `export const defaultTheme: ThemeName = ${tsString(DEFAULT_THEME)};`,
      '',
      `export const densities = [${list(DENSITIES)}] as const;`,
      '/** A shipped density, the value of `data-density`. */',
      'export type Density = (typeof densities)[number];',
      `export const defaultDensity: Density = ${tsString(DEFAULT_DENSITY)};`,
      '',
    ].join('\n');
  },
});

/** Flat JSON for docs and tooling: name mapped to { cssVar, type, layer, value, ref, description?, deprecated? }. */
StyleDictionary.registerFormat({
  name: 'mx/json',
  format: ({ dictionary }) => {
    const out = {};
    for (const t of dictionary.allTokens) {
      const entry = { cssVar: `--${t.name}`, type: typeOf(t), layer: layerOf(t), value: valueOf(t), ref: referenceOf(t) };
      if (t.$description) entry.description = t.$description;
      if (t.$deprecated) entry.deprecated = t.$deprecated;
      out[t.path.join('.')] = entry;
    }
    return JSON.stringify(out, null, 2) + '\n';
  },
});

// ---- dictionaries -------------------------------------------------------------------------

/**
 * A dictionary for one language, one theme and one density: the shared
 * primitives + the language's scales + its semantic tokens for that theme +
 * its control tokens for that density. Broken references throw; token
 * collisions are errors. Each render below builds its own instance: extending
 * one instance twice merges its tokens with themselves, which Style Dictionary
 * reports as a collision.
 */
export function createDictionary({ identity = DEFAULT_IDENTITY, theme, density, platforms = {}, log = {} } = {}) {
  const language = IDENTITIES[identity];
  if (!language) throw new Error(`tokens: "${identity}" is not a design language`);
  theme ??= language.defaultTheme;
  density ??= language.defaultDensity;
  if (!language.themes.includes(theme)) throw new Error(`tokens: "${identity}" has no "${theme}" theme`);
  if (!language.densities.includes(density)) throw new Error(`tokens: "${identity}" has no "${density}" density`);
  return new StyleDictionary({
    source: [SOURCES.primitive, SOURCES.identity(identity), SOURCES.semantic(identity, theme), SOURCES.density(identity, density)],
    log: {
      verbosity: process.env.MX_TOKENS_VERBOSE ? 'verbose' : 'silent',
      warnings: 'error',
      errors: { brokenReferences: 'throw' },
      ...log,
    },
    platforms,
  });
}

const platform = (files, log) => ({ transforms: TRANSFORMS, prefix: PREFIX, files, ...(log ? { log } : {}) });

/**
 * Renders CSS blocks for one language/theme/density in memory, one string per
 * block. Each block: `{ layer, selector, media? }` where `layer` picks the
 * tokens ('primitive' | 'identity' | 'semantic' | 'density'). References to
 * tokens outside the block stay as var(), which is the point; the "filtered
 * reference" warning is off for this platform only.
 */
export async function renderCss({ identity, theme, density } = {}, blocks) {
  const files = blocks.map((b, i) => ({
    destination: `${i}.css`,
    format: 'mx/css',
    filter: (t) => layerOf(t) === b.layer,
    options: { selector: b.selector, media: b.media, outputReferences: true },
  }));
  const sd = createDictionary({ identity, theme, density, platforms: { css: platform(files, { warnings: 'disabled' }) } });
  return (await sd.formatPlatform('css')).map((f) => String(f.output));
}

/** Renders every token of one language/theme/density with one format ('mx/ts' | 'mx/json') in memory. */
export async function renderAll({ identity, theme, density } = {}, format) {
  const sd = createDictionary({ identity, theme, density, platforms: { all: platform([{ destination: 'all', format }]) } });
  return String((await sd.formatPlatform('all'))[0].output);
}

/** The transformed tokens of one language/theme/density, as the CSS platform sees them. */
export async function resolvedTokens({ identity, theme, density } = {}) {
  const sd = createDictionary({ identity, theme, density, platforms: { all: platform([]) } });
  return (await sd.getPlatformTokens('all')).allTokens;
}
