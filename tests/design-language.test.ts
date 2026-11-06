// @vitest-environment jsdom
import { afterEach, describe, expect, it } from 'vitest';
import { defaultDesignLanguage, getDesignLanguage, designLanguages, setDesignLanguage } from '../src/index';

const root = document.documentElement;

afterEach(() => root.removeAttribute('data-design-language'));

describe('design language helpers', () => {
  it('ships the default language, Lounge, Material, Fluent and Lilac', () => {
    expect(designLanguages).toContain(defaultDesignLanguage);
    expect(designLanguages).toContain('lounge');
    expect(designLanguages).toContain('material');
    expect(designLanguages).toContain('fluent');
    expect(designLanguages).toContain('lilac');
  });

  it('setDesignLanguage writes data-design-language on the document element; default removes it', () => {
    setDesignLanguage('tactile');
    expect(root.getAttribute('data-design-language')).toBe('tactile');
    expect(getDesignLanguage()).toBe('tactile');
    setDesignLanguage('default');
    expect(root.hasAttribute('data-design-language')).toBe(false);
    expect(getDesignLanguage()).toBe('default');
  });

  it('scopes any element, not only the document', () => {
    const panel = document.createElement('section');
    setDesignLanguage('tactile', panel);
    expect(getDesignLanguage(panel)).toBe('tactile');
    expect(getDesignLanguage()).toBe('default');
  });

  it('an unknown value reads as default', () => {
    root.setAttribute('data-design-language', 'baroque');
    expect(getDesignLanguage()).toBe('default');
  });
});
