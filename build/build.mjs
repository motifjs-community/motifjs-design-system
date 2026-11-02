// DTCG source to dist/css (tokens, themes, identities), src/generated/tokens.ts
// and dist/json. `npm run build:tokens`. The contrast gate (contrast.mjs) and
// the final styles.css assembly (css.mjs) run after it in `npm run build`.
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { DEFAULT_IDENTITY, HEADER, IDENTITIES, ROOT, THEMES, renderAll, renderCss } from './tokens.mjs';

/** The cascade order every stylesheet of the package declares before using a layer. */
export const LAYER_ORDER = '@layer mx.reset, mx.tokens, mx.base;\n';

const write = (rel, text) => {
  const file = join(ROOT, rel);
  mkdirSync(join(file, '..'), { recursive: true });
  writeFileSync(file, text);
  console.log(`  ${rel}`);
};

const others = (list, chosen) => list.filter((x) => x !== chosen);

/**
 * One language under its `data-identity` scope: its scales, default density
 * and default theme on the scope itself; dark following the system when the
 * language starts light and ships dark; its other densities and its themes as
 * scopes on or below it. A theme the language does not ship falls through to
 * the default language's block for that theme, so high contrast always wins.
 * Every selector has the specificity of one attribute, so the language's
 * blocks win over the default language's by source order and the preference
 * overrides, loaded later, still win over them.
 */
export async function renderIdentity(identity) {
  const { themes, defaultTheme, densities, defaultDensity } = IDENTITIES[identity];
  const scope = `[data-identity="${identity}"]`;
  const on = (attr) => `${scope}:where([${attr}]), :where(${scope}) [${attr}]`;
  const missing = others(THEMES, null).filter((t) => !themes.includes(t));
  const themeScope = missing.length ? `${scope}:where(:not(${missing.map((t) => `[data-theme="${t}"]`).join(', ')}))` : scope;
  const blocks = await renderCss({ identity }, [
    { layer: 'identity', selector: scope },
    { layer: 'density', selector: scope },
    { layer: 'semantic', selector: themeScope },
  ]);
  if (defaultTheme === 'light' && themes.includes('dark')) {
    blocks.push(
      ...(await renderCss({ identity, theme: 'dark' }, [
        { layer: 'semantic', selector: `${scope}:where(:not([data-theme]))`, media: '(prefers-color-scheme: dark)' },
      ])),
    );
  }
  for (const density of others(densities, defaultDensity)) {
    blocks.push(...(await renderCss({ identity, density }, [{ layer: 'density', selector: on(`data-density="${density}"`) }])));
  }
  for (const theme of themes) {
    blocks.push(...(await renderCss({ identity, theme }, [{ layer: 'semantic', selector: on(`data-theme="${theme}"`) }])));
  }
  return blocks.join('\n');
}

export async function build() {
  const { themes, defaultTheme, densities, defaultDensity } = IDENTITIES[DEFAULT_IDENTITY];

  // tokens.css: the shared primitives, then the default language's scales and
  // default density on :root, its other densities as scopes.
  const root = await renderCss({}, [
    { layer: 'primitive', selector: ':root' },
    { layer: 'identity', selector: ':root' },
    { layer: 'density', selector: ':root' },
  ]);
  for (const density of others(densities, defaultDensity)) {
    root.push(...(await renderCss({ density }, [{ layer: 'density', selector: `[data-density="${density}"]` }])));
  }
  write('dist/css/tokens.css', HEADER + LAYER_ORDER + root.join('\n'));

  // themes/<name>.css: the default language's themes, one attribute scope each, usable on any element.
  for (const theme of themes) {
    const [block] = await renderCss({ theme }, [{ layer: 'semantic', selector: `[data-theme="${theme}"]` }]);
    write(`dist/css/themes/${theme}.css`, HEADER + block);
  }

  // themes/auto.css: the default theme on :root; dark follows the system when no data-theme is set.
  // `:where()` keeps both at the weight of one attribute, so a language scope on <html> still wins.
  const [lightRoot] = await renderCss({ theme: defaultTheme }, [{ layer: 'semantic', selector: ':root' }]);
  const [darkAuto] = await renderCss({ theme: 'dark' }, [
    { layer: 'semantic', selector: ':root:where(:not([data-theme]))', media: '(prefers-color-scheme: dark)' },
  ]);
  write('dist/css/themes/auto.css', HEADER + lightRoot + '\n' + darkAuto);

  // identities/<name>.css: every language under its own attribute scope, the default one included.
  for (const identity of Object.keys(IDENTITIES)) {
    write(`dist/css/identities/${identity}.css`, HEADER + (await renderIdentity(identity)));
  }

  // Typed token map (committed, so typecheck and tests work without a build) and flat JSON:
  // the default language at the top level, every language in its own folder.
  write('src/generated/tokens.ts', await renderAll({}, 'mx/ts'));
  for (const theme of themes) write(`dist/json/${theme}.json`, await renderAll({ theme }, 'mx/json'));
  for (const density of others(densities, defaultDensity)) {
    write(`dist/json/density-${density}.json`, await renderAll({ density }, 'mx/json'));
  }
  for (const [identity, language] of Object.entries(IDENTITIES)) {
    for (const theme of language.themes) {
      write(`dist/json/${identity}/${theme}.json`, await renderAll({ identity, theme }, 'mx/json'));
    }
    for (const density of others(language.densities, language.defaultDensity)) {
      write(`dist/json/${identity}/density-${density}.json`, await renderAll({ identity, density }, 'mx/json'));
    }
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  console.log('tokens:');
  await build();
}
