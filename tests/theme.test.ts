// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  cssProperty,
  cssVar,
  getDensity,
  getTheme,
  onSystemThemeChange,
  resolveTheme,
  setDensity,
  setTheme,
  tokens,
} from '../src/index';

const root = document.documentElement;

afterEach(() => {
  root.removeAttribute('data-theme');
  root.removeAttribute('data-density');
  vi.unstubAllGlobals();
});

const fakeMatchMedia = (matches: boolean) => {
  let handler: ((e: { matches: boolean }) => void) | undefined;
  const query = {
    matches,
    addEventListener: (_: string, h: (e: { matches: boolean }) => void) => (handler = h),
    removeEventListener: () => (handler = undefined),
  };
  vi.stubGlobal('matchMedia', () => query);
  return { fire: (dark: boolean) => handler?.({ matches: dark }), get listening() { return handler !== undefined; } };
};

describe('theme helpers', () => {
  it('resolveTheme on a language that starts dark is dark under system, whatever the system prefers', () => {
    fakeMatchMedia(false);
    root.setAttribute('data-identity', 'lounge');
    expect(resolveTheme()).toBe('dark');
    const inner = document.createElement('div');
    root.append(inner);
    expect(resolveTheme(inner)).toBe('dark');
    inner.remove();
    root.removeAttribute('data-identity');
    expect(resolveTheme()).toBe('light');
  });

  it('setTheme writes data-theme on the document element; system removes it', () => {
    setTheme('dark');
    expect(root.getAttribute('data-theme')).toBe('dark');
    expect(getTheme()).toBe('dark');
    setTheme('system');
    expect(root.hasAttribute('data-theme')).toBe(false);
    expect(getTheme()).toBe('system');
  });

  it('themes any element, not only the document', () => {
    const panel = document.createElement('section');
    setTheme('high-contrast', panel);
    expect(panel.getAttribute('data-theme')).toBe('high-contrast');
    expect(getTheme(panel)).toBe('high-contrast');
    expect(getTheme()).toBe('system');
  });

  it('an unknown value reads as system', () => {
    root.setAttribute('data-theme', 'sepia');
    expect(getTheme()).toBe('system');
  });

  it('resolveTheme follows prefers-color-scheme only while the choice is system', () => {
    fakeMatchMedia(true);
    expect(resolveTheme()).toBe('dark');
    setTheme('light');
    expect(resolveTheme()).toBe('light');
  });

  it('resolveTheme is light where matchMedia does not exist', () => {
    vi.stubGlobal('matchMedia', undefined);
    expect(resolveTheme()).toBe('light');
  });

  it('density writes data-density; default removes it', () => {
    setDensity('compact');
    expect(root.getAttribute('data-density')).toBe('compact');
    expect(getDensity()).toBe('compact');
    setDensity('default');
    expect(root.hasAttribute('data-density')).toBe(false);
    expect(getDensity()).toBe('default');
  });

  it('onSystemThemeChange reports the new system theme and stops when asked', () => {
    const media = fakeMatchMedia(false);
    const seen: string[] = [];
    const stop = onSystemThemeChange((t) => seen.push(t));
    media.fire(true);
    media.fire(false);
    expect(seen).toEqual(['dark', 'light']);
    stop();
    expect(media.listening).toBe(false);
  });
});

describe('token map', () => {
  it('cssVar and cssProperty come from the generated map', () => {
    expect(cssVar('color.accent.solid')).toBe('var(--mx-color-accent-solid)');
    expect(cssProperty('space.4')).toBe('--mx-space-4');
    expect(tokens['color.bg.canvas']).toEqual({ cssVar: '--mx-color-bg-canvas', type: 'color', layer: 'semantic' });
    expect(tokens['control.height.md'].layer).toBe('density');
  });
});
