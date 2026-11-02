// @vitest-environment jsdom
import { afterEach, describe, expect, it } from 'vitest';
import { defaultIdentity, getIdentity, identities, setIdentity } from '../src/index';

const root = document.documentElement;

afterEach(() => root.removeAttribute('data-identity'));

describe('design language helpers', () => {
  it('ships the default language, Lounge, Material, Fluent and Lilac', () => {
    expect(identities).toContain(defaultIdentity);
    expect(identities).toContain('lounge');
    expect(identities).toContain('material');
    expect(identities).toContain('fluent');
    expect(identities).toContain('lilac');
  });

  it('setIdentity writes data-identity on the document element; default removes it', () => {
    setIdentity('tactile');
    expect(root.getAttribute('data-identity')).toBe('tactile');
    expect(getIdentity()).toBe('tactile');
    setIdentity('default');
    expect(root.hasAttribute('data-identity')).toBe(false);
    expect(getIdentity()).toBe('default');
  });

  it('scopes any element, not only the document', () => {
    const panel = document.createElement('section');
    setIdentity('tactile', panel);
    expect(getIdentity(panel)).toBe('tactile');
    expect(getIdentity()).toBe('default');
  });

  it('an unknown value reads as default', () => {
    root.setAttribute('data-identity', 'baroque');
    expect(getIdentity()).toBe('default');
  });
});
