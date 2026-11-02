export {
  tokens,
  identities,
  themes,
  densities,
  defaultIdentity,
  identityThemes,
  defaultTheme,
  defaultDensity,
  type TokenName,
  type TokenType,
  type IdentityName,
  type ThemeName,
  type Density,
} from './generated/tokens';
export { getIdentity, setIdentity } from './identity';
export { getDensity, getTheme, onSystemThemeChange, resolveTheme, setDensity, setTheme, type ThemeChoice } from './theme';

import { tokens, type TokenName } from './generated/tokens';

/**
 * The `var(--mx-…)` expression for a design token, checked at compile time.
 * Use it wherever a style is written in TypeScript instead of CSS.
 *
 * @example
 * element.style.background = cssVar('color.accent.solid');
 */
export function cssVar(name: TokenName): `var(${string})` {
  return `var(${tokens[name].cssVar})`;
}

/**
 * The name of a token's CSS custom property, for `getComputedStyle` reads or
 * for writing an override on an element.
 *
 * @example
 * const accent = getComputedStyle(el).getPropertyValue(cssProperty('color.accent.solid'));
 */
export function cssProperty(name: TokenName): `--${string}` {
  return tokens[name].cssVar;
}
