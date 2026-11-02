import { describe, expect, it } from 'vitest';
import { CONTRAST_PAIRS, DISTINCT_REPORTED, checkContrast, checkDistinct, contrastRatio, parseCssColor, seenDistance } from '../build/contrast.mjs';
import { IDENTITIES } from '../build/tokens.mjs';

describe('contrast gate', () => {
  it('parses the colors the build renders', () => {
    expect(parseCssColor('#1b1b1b')).toEqual([27, 27, 27, 1]);
    expect(parseCssColor('rgb(0 0 0 / 0.3)')).toEqual([0, 0, 0, 0.3]);
    expect(() => parseCssColor('oklch(0.7 0.1 250)')).toThrow(/cannot parse/);
  });

  it('computes WCAG ratios (black on white is 21:1, white on white 1:1, symmetric)', () => {
    expect(contrastRatio('#000000', '#ffffff')).toBeCloseTo(21, 5);
    expect(contrastRatio('rgb(255 255 255)', '#ffffff')).toBeCloseTo(1, 5);
    expect(contrastRatio('#005fb8', '#ffffff')).toBeCloseTo(contrastRatio('#ffffff', '#005fb8'), 10);
  });

  it('refuses translucent colors: a checked pair must be opaque to mean anything', () => {
    expect(() => contrastRatio('rgb(0 0 0 / 0.5)', '#ffffff')).toThrow(/translucent/);
  });

  it('passes every pair in every theme of every language (AA, AAA in high contrast)', async () => {
    const rows = await checkContrast();
    const themeCount = Object.values(IDENTITIES).reduce((n, language) => n + language.themes.length, 0);
    expect(rows.length).toBe(themeCount * CONTRAST_PAIRS.length);
    for (const r of rows) expect(r.required).toBe(r.theme === 'high-contrast' ? 7 : 4.5);
    expect(rows.filter((r) => !r.pass).map((r) => `${r.identity} ${r.theme} ${r.fg} on ${r.bg} ${r.ratio.toFixed(2)}`)).toEqual([]);
  });

  it('measures how far apart two colors stay for a color-blind reader', () => {
    expect(seenDistance('#ffffff', '#ffffff', 'deuteranopia')).toBe(0);
    // A red and a green of the same lightness nearly merge for a deuteranope; blue and yellow stay apart.
    expect(seenDistance('#c00000', '#00a000')).toBeGreaterThan(30);
    expect(seenDistance('#c00000', '#00a000', 'deuteranopia')).toBeLessThan(10);
    expect(seenDistance('#0000ff', '#ffff00', 'deuteranopia')).toBeGreaterThan(60);
  });

  it('keeps the status colors apart for color-blind readers in every enforced language', async () => {
    const rows = await checkDistinct();
    expect(rows.some((r) => r.identity === 'lilac' && r.enforced)).toBe(true);
    for (const id of DISTINCT_REPORTED) expect(rows.filter((r) => r.identity === id).every((r) => !r.enforced)).toBe(true);
    expect(rows.filter((r) => r.enforced && !r.pass).map((r) => `${r.identity} ${r.theme} ${r.a} / ${r.b} ${r.sight} ${r.distance.toFixed(1)}`)).toEqual([]);
  });
});
