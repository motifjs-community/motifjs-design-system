import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { layerOf, resolvedTokens } from '../build/tokens.mjs';

const read = (file: string) => readFileSync(new URL(`../src/css/${file}`, import.meta.url), 'utf8');
const declared = (css: string) => [...css.matchAll(/^\s*(--mx-[\w-]+):/gm)].map((m) => m[1]);

describe('hand-written CSS', () => {
  it('each file lives in one of the three mx layers', () => {
    expect(read('layers.css')).toContain('@layer mx.reset, mx.tokens, mx.base;');
    expect(read('reset.css')).toMatch(/^(\/\*[\s\S]*?\*\/\s*)?@layer mx\.reset \{/);
    expect(read('preferences.css')).toMatch(/^(\/\*[\s\S]*?\*\/\s*)?@layer mx\.tokens \{/);
    expect(read('base.css')).toMatch(/^(\/\*[\s\S]*?\*\/\s*)?@layer mx\.base \{/);
  });

  it('base styles read tokens and never literal colors', () => {
    const base = read('base.css');
    expect(base).not.toMatch(/#[0-9a-f]{3,8}\b|rgba?\(|hsla?\(|oklch\(/i);
    expect(base).toContain('var(--mx-focus-ring-color)');
  });

  it('preference overrides only redefine tokens that exist', async () => {
    const names = new Set((await resolvedTokens({})).map((t) => `--${t.name}`));
    const overridden = declared(read('preferences.css'));
    expect(overridden.length).toBeGreaterThan(30);
    for (const name of overridden) expect(names.has(name), `${name} is not a token`).toBe(true);
  });

  it('forced colors maps every semantic color token', async () => {
    const semanticColors = (await resolvedTokens({}))
      .filter((t) => t.$type === 'color' && layerOf(t) === 'semantic')
      .map((t) => `--${t.name}`);
    const forced = read('preferences.css').split('(forced-colors: active)')[1];
    expect(forced).toContain('[data-design-language] {');
    const mapped = new Set(declared(forced));
    for (const name of semanticColors) expect(mapped.has(name), `${name} has no forced-colors mapping`).toBe(true);
  });
});
