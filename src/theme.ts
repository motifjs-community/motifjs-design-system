import { type Density, type ThemeName, defaultIdentity, densities, identityThemes, themes } from './generated/tokens';

/** What `setTheme` accepts: a shipped theme, or `'system'` to follow `prefers-color-scheme`. */
export type ThemeChoice = ThemeName | 'system';

const THEME_ATTR = 'data-theme';
const DENSITY_ATTR = 'data-density';
const DARK_QUERY = '(prefers-color-scheme: dark)';

const isTheme = (v: string | null): v is ThemeName => (themes as readonly string[]).includes(v ?? '');
const isDensity = (v: string | null): v is Density => (densities as readonly string[]).includes(v ?? '');

/**
 * Applies a theme by writing `data-theme` on `root` (the document element by
 * default; any element works and themes only its subtree). `'system'` removes
 * the attribute so the stylesheet follows `prefers-color-scheme`.
 *
 * @example
 * setTheme('dark');
 * setTheme('system');
 */
export function setTheme(theme: ThemeChoice, root: Element = document.documentElement): void {
  if (theme === 'system') root.removeAttribute(THEME_ATTR);
  else root.setAttribute(THEME_ATTR, theme);
}

/**
 * The theme chosen on `root`: a theme name, or `'system'` when none is set.
 *
 * @example
 * if (getTheme() === 'system') showSystemHint();
 */
export function getTheme(root: Element = document.documentElement): ThemeChoice {
  const value = root.getAttribute(THEME_ATTR);
  return isTheme(value) ? value : 'system';
}

/**
 * The theme the user actually sees on `root`: the chosen one, or for
 * `'system'` the one the design language around `root` starts from; a
 * language that starts light follows `prefers-color-scheme` (dark or light).
 *
 * @example
 * chart.palette = resolveTheme() === 'dark' ? darkPalette : lightPalette;
 */
export function resolveTheme(root: Element = document.documentElement): ThemeName {
  const chosen = getTheme(root);
  if (chosen !== 'system') return chosen;
  const name = root.closest('[data-identity]')?.getAttribute('data-identity') ?? '';
  const language = name in identityThemes ? identityThemes[name as keyof typeof identityThemes] : identityThemes[defaultIdentity];
  const themesShipped: readonly ThemeName[] = language.themes;
  if (language.defaultTheme !== 'light' || !themesShipped.includes('dark')) return language.defaultTheme;
  return typeof matchMedia === 'function' && matchMedia(DARK_QUERY).matches ? 'dark' : 'light';
}

/**
 * Applies a density by writing `data-density` on `root`; `'default'` removes
 * the attribute so the default density applies.
 *
 * @example
 * setDensity('compact');
 */
export function setDensity(density: Density | 'default', root: Element = document.documentElement): void {
  if (density === 'default') root.removeAttribute(DENSITY_ATTR);
  else root.setAttribute(DENSITY_ATTR, density);
}

/**
 * The density chosen on `root`, or `'default'` when none is set.
 *
 * @example
 * toggle.checked = getDensity() === 'compact';
 */
export function getDensity(root: Element = document.documentElement): Density | 'default' {
  const value = root.getAttribute(DENSITY_ATTR);
  return isDensity(value) ? value : 'default';
}

/**
 * Calls `listener` whenever the system switches between light and dark, with
 * the theme the system now prefers. Returns the function that stops listening.
 * For code that draws with the tokens (canvas, SVG) and must redraw.
 *
 * @example
 * const stop = onSystemThemeChange(() => chart.redraw());
 */
export function onSystemThemeChange(listener: (theme: 'light' | 'dark') => void): () => void {
  if (typeof matchMedia !== 'function') return () => {};
  const query = matchMedia(DARK_QUERY);
  const handle = (e: MediaQueryListEvent) => listener(e.matches ? 'dark' : 'light');
  query.addEventListener('change', handle);
  return () => query.removeEventListener('change', handle);
}
