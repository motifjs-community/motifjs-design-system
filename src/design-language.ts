import { type DesignLanguageName, designLanguages } from './generated/tokens';

const DESIGN_LANGUAGE_ATTR = 'data-design-language';

const isDesignLanguage = (v: string | null): v is DesignLanguageName => (designLanguages as readonly string[]).includes(v ?? '');

/**
 * Applies a design language by writing `data-design-language` on `root` (the document
 * element by default; any element works and the language then covers its
 * subtree). `'default'` removes the attribute so the default language applies.
 * A language scope starts from that language's default theme and follows the
 * system; write `data-theme` on the same element to pin a theme.
 *
 * @example
 * setDesignLanguage('tactile');
 * setDesignLanguage('default');
 */
export function setDesignLanguage(designLanguage: DesignLanguageName | 'default', root: Element = document.documentElement): void {
  if (designLanguage === 'default') root.removeAttribute(DESIGN_LANGUAGE_ATTR);
  else root.setAttribute(DESIGN_LANGUAGE_ATTR, designLanguage);
}

/**
 * The design language chosen on `root`, or `'default'` when none is set.
 *
 * @example
 * picker.value = getDesignLanguage();
 */
export function getDesignLanguage(root: Element = document.documentElement): DesignLanguageName | 'default' {
  const value = root.getAttribute(DESIGN_LANGUAGE_ATTR);
  return isDesignLanguage(value) ? value : 'default';
}
