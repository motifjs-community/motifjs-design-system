import { describe, expect, it } from 'vitest';
import StyleDictionary from 'style-dictionary';
import {
  DEFAULT_IDENTITY,
  IDENTITIES,
  SOURCES,
  TRANSFORMS,
  colorToCss,
  fontWeightToCss,
  layerOf,
  renderAll,
  renderCss,
  resolvedTokens,
  shadowToCss,
  unitToCss,
} from '../build/tokens.mjs';
import { renderIdentity } from '../build/build.mjs';

const px = (value: number) => ({ value, unit: 'px' });

describe('value renderers (DTCG 2025.10 objects)', () => {
  it('renders srgb colors as hex when opaque and as modern rgb() with the exact alpha otherwise', () => {
    expect(colorToCss({ colorSpace: 'srgb', components: [1, 1, 1], hex: '#ffffff' })).toBe('#ffffff');
    expect(colorToCss({ colorSpace: 'srgb', components: [0.1059, 0.1059, 0.1059] })).toBe('#1b1b1b');
    expect(colorToCss({ colorSpace: 'srgb', components: [0, 0, 0], alpha: 0.0578 })).toBe('rgb(0 0 0 / 0.0578)');
    expect(colorToCss({ colorSpace: 'oklch', components: [0.7, 0.1, 250] })).toBe('oklch(0.7 0.1 250)');
    expect(colorToCss({ colorSpace: 'display-p3', components: [1, 0, 0], alpha: 0.5 })).toBe('color(display-p3 1 0 0 / 0.5)');
    expect(colorToCss('Canvas')).toBe('Canvas');
  });

  it('renders dimensions, durations, font weights and shadows', () => {
    expect(unitToCss({ value: 0.25, unit: 'rem' })).toBe('0.25rem');
    expect(unitToCss(px(0))).toBe('0px');
    expect(unitToCss({ value: 83, unit: 'ms' })).toBe('83ms');
    expect(fontWeightToCss('semi-bold')).toBe('600');
    expect(fontWeightToCss(700)).toBe('700');
    const shadow = { color: { colorSpace: 'srgb', components: [0, 0, 0], alpha: 0.14 }, offsetX: px(0), offsetY: px(2), blur: px(4), spread: px(0) };
    expect(shadowToCss([shadow, { ...shadow, inset: true }])).toBe('0px 2px 4px 0px rgb(0 0 0 / 0.14), inset 0px 2px 4px 0px rgb(0 0 0 / 0.14)');
  });
});

describe('token source', () => {
  const names = async (opts: Parameters<typeof resolvedTokens>[0], layer: string) =>
    (await resolvedTokens(opts))
      .filter((t) => layerOf(t) === layer)
      .map((t) => t.path.join('.'))
      .sort();

  const languages = Object.entries(IDENTITIES);

  it('every theme of every language defines the same semantic token names', async () => {
    const reference = await names({}, 'semantic');
    expect(reference.length).toBeGreaterThan(40);
    for (const [identity, { themes }] of languages) {
      for (const theme of themes) expect(await names({ identity, theme }, 'semantic'), `${identity} ${theme}`).toEqual(reference);
    }
  });

  it('every density of every language defines the same control token names', async () => {
    const reference = await names({}, 'density');
    for (const [identity, { densities }] of languages) {
      for (const density of densities) expect(await names({ identity, density }, 'density'), `${identity} ${density}`).toEqual(reference);
    }
  });

  it('every language defines the same scale token names (radius, shadow, font, motion)', async () => {
    const reference = await names({}, 'identity');
    expect(reference).toContain('radius.md');
    expect(reference).toContain('shadow.4');
    expect(reference).toContain('font.family.sans');
    expect(reference).toContain('motion.duration.fast');
    for (const [identity] of languages) expect(await names({ identity }, 'identity'), identity).toEqual(reference);
  });

  it('refuses a language, theme or density that is not shipped', async () => {
    await expect(resolvedTokens({ identity: 'sepia' })).rejects.toThrow(/not a design language/);
    await expect(resolvedTokens({ identity: DEFAULT_IDENTITY, theme: 'sepia' })).rejects.toThrow(/no "sepia" theme/);
    await expect(resolvedTokens({ density: 'cozy' })).rejects.toThrow(/no "cozy" density/);
  });

  it('token names are unique and stable (public API)', async () => {
    const all = (await resolvedTokens({})).map((t) => t.path.join('.'));
    expect(new Set(all).size).toBe(all.length);
    expect(all.sort()).toMatchSnapshot();
  });

  it('every value renders to CSS text (numbers stay numbers), font weights numeric', async () => {
    const tokens = await resolvedTokens({});
    for (const t of tokens) {
      const name = t.path.join('.');
      expect(typeof t.$value, name).toBe(t.$type === 'number' ? 'number' : 'string');
      expect(String(t.$value), name).not.toMatch(/object Object|undefined|NaN/);
      if (t.$type === 'fontWeight') expect(t.$value).toMatch(/^\d+$/);
    }
  });
});

describe('CSS output', () => {
  it('writes each layer as a block of custom properties inside @layer mx.tokens', async () => {
    const [primitive, scales, semantic, density] = await renderCss({}, [
      { layer: 'primitive', selector: ':root' },
      { layer: 'identity', selector: ':root' },
      { layer: 'semantic', selector: '[data-theme="light"]' },
      { layer: 'density', selector: ':root' },
    ]);
    for (const css of [primitive, scales, semantic, density]) {
      expect(css).toMatch(/^@layer mx\.tokens \{\n {2}[^\n]+ \{\n( {4}--mx-[\w-]+: [^\n]+;\n)+ {2}\}\n\}\n$/);
    }
    expect(primitive).toContain('    --mx-color-gray-95: #efeee9;');
    expect(primitive).toContain('    --mx-space-4: 1rem;');
    expect(scales).toContain('    --mx-radius-md: 0.375rem;');
    expect(scales).toContain('    --mx-motion-duration-fast: 83ms;');
    expect(scales).toContain('    --mx-font-family-sans: Archivo, system-ui,');
    expect(scales).toContain('    --mx-font-width-display: 112;');
    expect(scales).toContain('    --mx-motion-easing-standard: cubic-bezier(0.33, 0, 0.67, 1);');
    expect(scales).toMatch(/--mx-shadow-4: 0px 2px 4px 0px rgb\(0 0 0 \/ 0\.14\), 0px 0px 2px 0px rgb\(0 0 0 \/ 0\.12\);/);
    expect(density).toContain('    --mx-control-height-md: 2rem;');
  });

  it('keeps references to other layers as live var() chains and literal values exact', async () => {
    const [semantic] = await renderCss({}, [{ layer: 'semantic', selector: '[data-theme="light"]' }]);
    expect(semantic).toContain('--mx-color-bg-canvas: var(--mx-color-gray-88);');
    expect(semantic).toContain('--mx-focus-ring-width: var(--mx-border-width-2);');
    expect(semantic).toContain('--mx-color-fill-subtle-secondary: rgb(0 0 0 / 0.0373);');
  });

  it('wraps a block in a media query when asked', async () => {
    const [dark] = await renderCss({ theme: 'dark' }, [
      { layer: 'semantic', selector: ':root:not([data-theme])', media: '(prefers-color-scheme: dark)' },
    ]);
    expect(dark).toMatch(/^@layer mx\.tokens \{\n {2}@media \(prefers-color-scheme: dark\) \{\n {4}:root:not\(\[data-theme\]\) \{\n {6}--mx-/);
    expect(dark).toContain('--mx-color-bg-canvas: var(--mx-color-gray-12);');
  });
});

describe('TypeScript and JSON output', () => {
  it('the typed map lists every token with its CSS variable, type and layer', async () => {
    const ts = await renderAll({}, 'mx/ts');
    expect(ts).toContain("'color.bg.canvas': { cssVar: '--mx-color-bg-canvas', type: 'color', layer: 'semantic' },");
    expect(ts).toContain("'space.4': { cssVar: '--mx-space-4', type: 'dimension', layer: 'primitive' },");
    expect(ts).toContain("'radius.md': { cssVar: '--mx-radius-md', type: 'dimension', layer: 'identity' },");
    expect(ts).toContain("'control.height.md': { cssVar: '--mx-control-height-md', type: 'dimension', layer: 'density' },");
    expect(ts).toContain("export const identities = ['tactile', 'lounge', 'material', 'fluent', 'lilac'] as const;");
    expect(ts).toContain("'lilac': { themes: ['light', 'dark'], defaultTheme: 'light' },");
    expect(ts).toContain("'fluent': { themes: ['light', 'dark'], defaultTheme: 'light' },");
    expect(ts).toContain("'material': { themes: ['light', 'dark'], defaultTheme: 'light' },");
    expect(ts).toContain("'lounge': { themes: ['dark'], defaultTheme: 'dark' },");
    expect(ts).toContain("export const defaultIdentity: IdentityName = 'tactile';");
    expect(ts).toContain("export const themes = ['light', 'dark', 'high-contrast'] as const;");
    expect(ts).toContain("export const densities = ['comfortable', 'compact'] as const;");
  });

  it('the flat JSON carries the rendered value and the reference', async () => {
    const json = JSON.parse(await renderAll({ theme: 'dark' }, 'mx/json'));
    expect(json['color.bg.canvas']).toMatchObject({
      cssVar: '--mx-color-bg-canvas',
      type: 'color',
      layer: 'semantic',
      value: '#232220',
      ref: 'color.gray.12',
    });
    expect(json['color.gray.12']).toMatchObject({ layer: 'primitive', ref: null, value: '#232220' });
    expect(json['motion.duration.fast']).toMatchObject({ layer: 'identity', value: '83ms' });
  });
});

describe('a design language as an attribute scope', () => {
  it('puts its scales, default density and default theme on the scope, dark under the system preference, the rest on or below it', async () => {
    const css = await renderIdentity(DEFAULT_IDENTITY);
    const scope = '[data-identity="tactile"]';
    const blocks = css.split('@layer mx.tokens {').slice(1);
    expect(blocks.length).toBe(3 + 1 + 1 + 3);
    expect(blocks[0]).toContain(`${scope} {`);
    expect(blocks[0]).toContain('--mx-radius-md: 0.375rem;');
    expect(blocks[1]).toContain('--mx-control-height-md: 2rem;');
    expect(blocks[2]).toContain('--mx-color-bg-canvas: var(--mx-color-gray-88);');
    expect(blocks[3]).toContain('@media (prefers-color-scheme: dark)');
    expect(blocks[3]).toContain(`${scope}:where(:not([data-theme])) {`);
    expect(blocks[3]).toContain('--mx-color-bg-canvas: var(--mx-color-gray-12);');
    expect(blocks[4]).toContain(`${scope}:where([data-density="compact"]), :where(${scope}) [data-density="compact"] {`);
    expect(blocks[6]).toContain(`${scope}:where([data-theme="dark"]), :where(${scope}) [data-theme="dark"] {`);
    expectOneAttribute(css);
  });

  it('a language that ships fewer themes lets the others fall through, so high contrast always wins', async () => {
    const css = await renderIdentity('lounge');
    const scope = '[data-identity="lounge"]';
    const blocks = css.split('@layer mx.tokens {').slice(1);
    expect(blocks.length).toBe(3 + 1 + 1);
    expect(blocks[0]).toContain('--mx-radius-md: 1.125rem;');
    expect(blocks[2]).toContain(`${scope}:where(:not([data-theme="light"], [data-theme="high-contrast"])) {`);
    expect(blocks[2]).toContain('--mx-color-bg-canvas: var(--mx-color-ink-5);');
    expect(css).not.toContain('prefers-color-scheme');
    expect(blocks[4]).toContain(`:where(${scope}) [data-theme="dark"] {`);
    expectOneAttribute(css);
  });
});

/** Every selector weighs one attribute: later blocks win by order, the preference overrides still win over them. */
function expectOneAttribute(css: string) {
  for (const line of css.split('\n').filter((l) => /^ {2}\S.*\{$/.test(l) && !l.startsWith('  @media'))) {
    for (const selector of line.replace(/\s*\{$/, '').split(/, (?![^(]*\))/)) {
      const outside = selector.replace(/:where\((?:[^()]|\([^()]*\))*\)/g, '');
      expect(outside.match(/\[/g)?.length, selector).toBe(1);
    }
  }
}

describe('source validation', () => {
  it('a reference to a missing token fails the build', async () => {
    const sd = new StyleDictionary({
      include: [SOURCES.primitive],
      tokens: { color: { $type: 'color', oops: { $value: '{color.does.not.exist}' } } },
      log: { verbosity: 'silent', errors: { brokenReferences: 'throw' } },
      platforms: { css: { transforms: TRANSFORMS, prefix: 'mx', files: [] } },
    });
    await expect(sd.getPlatformTokens('css')).rejects.toThrow(/does\.not\.exist|Reference Errors/);
  });
});
