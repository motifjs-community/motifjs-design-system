import { type IdentityName, identities } from './generated/tokens';

const IDENTITY_ATTR = 'data-identity';

const isIdentity = (v: string | null): v is IdentityName => (identities as readonly string[]).includes(v ?? '');

/**
 * Applies a design language by writing `data-identity` on `root` (the document
 * element by default; any element works and the language then covers its
 * subtree). `'default'` removes the attribute so the default language applies.
 * A language scope starts from that language's default theme and follows the
 * system; write `data-theme` on the same element to pin a theme.
 *
 * @example
 * setIdentity('tactile');
 * setIdentity('default');
 */
export function setIdentity(identity: IdentityName | 'default', root: Element = document.documentElement): void {
  if (identity === 'default') root.removeAttribute(IDENTITY_ATTR);
  else root.setAttribute(IDENTITY_ATTR, identity);
}

/**
 * The design language chosen on `root`, or `'default'` when none is set.
 *
 * @example
 * picker.value = getIdentity();
 */
export function getIdentity(root: Element = document.documentElement): IdentityName | 'default' {
  const value = root.getAttribute(IDENTITY_ATTR);
  return isIdentity(value) ? value : 'default';
}
