# Changelog

All notable changes to this package are documented here.
The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/) and the package uses
[Semantic Versioning](https://semver.org/). Token names are part of the public API: removing or
renaming one is a breaking change and is announced one minor version ahead with `$deprecated`.

## [Unreleased]

## [0.1.0-beta.3] - 2026-11-07

### Added

- Chart colors in every theme of every design language: `color.chart.series-1` to `series-8`, in a fixed order, and
  `color.chart.scale-low`, `scale-high`, `scale-negative`, `scale-middle` and `scale-positive` for values on a scale,
  and `color.chart.grid` for the lines behind them.
  Each language opens with its own accent. The build checks that neighbors in the order stay apart for color-blind
  readers and that each color stays visible on every page background.
- Status colors for data graphics: `color.chart.good`, `color.chart.warning` and `color.chart.danger`, for the ranges of
  a gauge and other marks that say good or bad. A status's `solid` color is dark enough to carry white text, which
  makes a mark look muddy; these are as clear as a mark can be while still showing on every background, warning stays
  amber, and the build checks that the three stay apart for color-blind readers.

## [0.1.0-beta.2] - 2026-11-06

### Changed

- Breaking: a design language is now called that everywhere, in code too. The attribute, the functions, the exports and
  the file paths change; token names and their values do not.

  | Before | Now |
  |---|---|
  | `data-identity` | `data-design-language` |
  | `setIdentity()`, `getIdentity()` | `setDesignLanguage()`, `getDesignLanguage()` |
  | `identities` | `designLanguages` |
  | `defaultIdentity` | `defaultDesignLanguage` |
  | `identityThemes` | `designLanguageThemes` |
  | `IdentityName` | `DesignLanguageName` |
  | `@motifx-community/design-system/identities/*.css` | `@motifx-community/design-system/design-languages/*.css` |
  | the `identity` token layer | the `design-language` token layer |
  | `tokens/identity/` | `tokens/design-language/` |

## [0.1.0-beta.1] - 2026-11-05

### Changed

- Tactile and Lounge status colors apart for color-blind readers. In the light theme `color.critical.light` is
  now `#b03659` (hover `#c13b61`), `color.success.light` `#006402` and `color.caution.light` `#754702`; in the
  dark `color.success.dark` is `#6dc43a`. Success, caution and danger text now keep an OKLab distance of 10 for
  a deuteranope and a protanope, with every contrast pair still at AA. The color-blindness check is enforced for
  Tactile and Lounge from here on; Material and Fluent stay reported, their colors being their sources'.

## [0.1.0-beta.0] - 2026-10-30

The first preview on npm (`npm i @motifx-community/design-system@beta`).

### Added

- The opaque neutral fill `color.fill.neutral`, for a mark on any surface (an avatar, a chip, a skeleton), and the
  filled status roles `color.{success,caution,info}.{solid,on-solid}` in every design language.

- Lounge, a second design language with a premium feel: warm blacks, ivory text, a brass accent,
  chrome and gold hairlines, capsule controls, deep black shadows, taller controls, a narrower cut
  of Archivo and slower motion. Dark only. `identities/lounge.css`, `json/lounge/…`,
  `tokens/identity/lounge/` and `tokens/lounge.resolver.json`. New palette ramps for it:
  `color.ink.5|8|10|12|14|17`, `color.ivory.42|58|78|95`,
  `color.brass.dark1|base|light1|light2|tint-dark`.
- Material, a third design language based on the Material Design 3 guidelines (not affiliated with
  or endorsed by Google), light and dark from tonal ramps: a violet accent, faintly violet neutrals,
  Google Sans Flex and Google Sans Code (shipped, OFL; a browser downloads them only when Material
  is used), a 4 to 28 px shape scale, two-layer elevation, its own type scale and motion, flat
  controls. `identities/material.css`, `json/material/…`, `tokens/identity/material/` and
  `tokens/material.resolver.json`. New palette ramps for it: `color.violet.*`, `color.mauve.*`,
  `color.dusk.*`, `color.red.*`, `color.green.*`, `color.yellow.*`.
- Slim scrollbars in `base.css`: 8 px (`scrollbar.size`) in Chromium and Safari, the standard thin
  bar elsewhere; the thumb in `color.stroke.control.strong`, `color.fg.secondary` on hover, on a
  clear track.
- Fluent, a fourth design language generated from the WinUI 3 theme resources (not affiliated
  with or endorsed by Microsoft): light and dark, Windows 11's default accent, 4 and 8 px corners,
  Segoe UI Variable from the system, a 1 px elevation edge. `identities/fluent.css`,
  `json/fluent/…`, `tokens/identity/fluent/` and `tokens/fluent.resolver.json`.
- Selection as a role group, so each language draws a selected or current item its own way:
  `color.selection.bg|fg|border|indicator` and `effect.selection` per theme (forced colors map them to SelectedItem and
  SelectedItemText; the contrast gate checks fg on bg), `item.radius` (the item shape in every state),
  `selection.border-width`,
  `indicator.thickness|length|radius` per language. `color.dusk.30|90` for Material's secondary container.
- Lilac, a fifth design language: a lilac accent on lavender-tinted neutrals, jade / yellow / rose
  status colors (no orange or brown), Nunito Sans with Fraunces headings (both shipped, OFL), 15 px
  body text, soft 6 to 24 px corners, roomy flat 36 px controls, soft lilac-tinted shadows, a 2 px focus
  ring with a soft halo; light and dark. All colors from HCT tonal ramps. `identities/lilac.css`,
  `json/lilac/…`, `tokens/identity/lilac/` and `tokens/lilac.resolver.json`. New palette ramps:
  `color.lilac.*`, `color.lavender.*`, `color.jade.*`, `color.lemon.*`, `color.rose.*`.
- The contrast gate also checks that success, caution and danger stay apart for color-blind readers
  (deuteranopia, protanopia): `checkDistinct`, `seenDistance`, `DISTINCT_PAIRS`. Enforced for Lilac and
  new languages, reported for Tactile, Lounge, Material and Fluent.
- Roles a component's own tokens point at, so a language can change one kind of decision for every
  component at once (the values equal what the kit drew before):
  - `focus.ring.halo`: the focus visual's shadow (`0 0 0 <offset> <inner>`), drawn by `base.css`.
    `focus.ring.halo-inset`: the same for a ring drawn inside a box that clips its corners.
  - `effect.control`: a raised control's resting face (Tactile's inset top highlight).
  - `elevation.card|popup|tooltip|toast|window|window-inactive|dialog`: the shadow level of each
    kind of surface, per language (Material's toast takes level 3).
- Color roles for surfaces and fills only some languages tell apart, per theme in every language
  (a language without its own value maps each to one it already has, so nothing changes there):
  - `color.bg.container`, `color.bg.container-high`: raised surfaces (menus, sheets, toolbars; dialogs).
    Material: surface-container and surface-container-high.
  - `color.bg.header`, `color.bg.group`: a table's header and group rows, opaque so pinned cells hide
    what scrolls under them. Fluent: WinUI.TableView's fills laid over the canvas.
  - `color.fill.input.focus`, `color.fill.input.disabled`: a focused text field (Fluent's input fill) and a
    disabled filled one (Material: on-surface at 4%).
  - `color.fill.control.solid`: an opaque control fill such as a slider thumb (Fluent #fff / #454545).
  - `color.fill.control-alt.default|secondary|tertiary|disabled`: a check box or radio's quieter fill at
    rest, hovered, pressed and disabled (Fluent's alt fills).
  - `color.info.subtle`: a neutral notice background (Fluent's attention background).
  - `color.accent.on-subtle`: text or a shape on `color.accent.subtle`, such as a loading indicator in its
    disc. Material: on-primary-container, tone 30 in light (new `color.violet.30`, #4b21bd) and 90 in dark;
    elsewhere `color.accent.fg`.
  Forced colors and reduced transparency map them too; the contrast gate checks text on the new surfaces.
- `identityThemes`: the themes each language ships and the one its scope starts from.
- `radius.xs`, the smallest corners, for small marks such as a check box that must stay square in a
  language with round corners. 4px in Tactile (same as `radius.sm`) and in Lounge.

- Design languages as a second axis next to the theme: `data-identity` on `<html>` or any element
  picks a language, whose corner radii, shadows, type, motion, semantic colors per theme and control
  sizes per density all live under the unchanged token names. `identities/<name>.css` ships one
  language as an attribute scope (`tactile.css` today), `json/<language>/…` the flat JSON per
  language, and the TypeScript entry gains `identities`, `defaultIdentity`, `IdentityName`,
  `setIdentity` and `getIdentity`. Tactile is the default and, for now, the only language; the
  contrast gate and the name tests run per language.

### Changed

- High contrast: lighter link and danger text (`color.contrast.link` #c7c7ff, new
  `color.contrast.critical-text` #ffbcbc for `color.danger.fg`), so accent and danger text reach 7:1 on a
  highlighted menu or list item too (#3a3a3a), not only on black. Danger fills keep `color.contrast.critical`.
- Token source layout: `tokens/semantic/` and `tokens/density/` moved to
  `tokens/identity/tactile/`, and `radius.*`, `shadow.*`, `font.*` and `motion.*` moved from the
  primitive files to `tokens/identity/tactile/base.json`. Names and values are unchanged; the
  `layer` of those tokens in the typed map and the JSON is now `identity` instead of `primitive`.
  The resolver document gained an `identity` modifier. A consumer that includes the source in its
  own Style Dictionary build updates its paths (see the README).
- `preferences.css` also rewrites tokens on `[data-identity]` scopes.
- `resolveTheme` follows the design language around the element: under `'system'`, a language that
  starts dark (Lounge) reports dark.
- The system-dark block of `themes/auto.css` is `:root:where(:not([data-theme]))` instead of
  `:root:not([data-theme])`: same values, the weight of one attribute, so a language scope on
  `<html>` wins over it.
- A theme a language does not ship falls through to the default language's theme of that name, on
  the language's own element too, so `data-theme="high-contrast"` always wins.
- The visual identity is now *Tactile*: warm neutral greys instead of pure greys, a signal-orange
  accent ramp instead of the blue one, Archivo (variable, with a width axis) and JetBrains Mono
  instead of Segoe UI Variable and Cascadia, radii 4/6/10 px instead of 2/4/8 px. Token names are
  unchanged; every value of `color.gray.*`, `color.accent.*`, the light status colors
  (`color.critical.light`, `color.success.light`, `color.caution.light`), `font.family.*`,
  `radius.sm|md|lg`, the light and dark `color.bg.*`, `color.fill.control.*` (now opaque) and
  `color.stroke.*` alphas changed. The previous values are kept in `tokens/presets/windows/`
  (not built) for a later second identity.
- Headings in `base.css` use the medium weight and the wide width cut; the body uses the regular
  width cut (`font.width.*`).

### Added

- Fonts shipped with the package: `fonts.css` (`@font-face` for Archivo and JetBrains Mono, latin
  and latin-ext) and the woff2 files under `fonts/`, copied from the Fontsource builds at build
  time; `styles.css` includes them.
- Tokens: `color.gray.22`, `color.gray.26` (opaque dark-theme controls), `color.bg.bar` (app bars),
  `color.bg.glass` (the one translucent surface, for a palette, popover or toast; opaque under
  reduced transparency), `color.stroke.control.edge` and `color.highlight.control` (the bottom edge
  and the inner top highlight of a pressable control), `font.weight.medium`, `font.width.display|
  body|dense`, `radius.xl`, and per density `control.edge.width`, `control.press.offset`,
  `bar.height`.
- Tokens for component libraries: `icon.size.sm|md|lg` (12/16/20 px icons) and `z.window` (floating
  windows, between `z.sticky` and `z.overlay`).
- Contrast gate pairs for `color.bg.bar` and `color.fill.control.default`.
- DTCG 2025.10 token source in three layers: primitive (`tokens/primitive/`), semantic per theme
  (`tokens/semantic/light|dark|high-contrast.json`) and density (`tokens/density/`), plus a
  Resolver Module document (`tokens/mx.resolver.json`).
- Build on Style Dictionary 5 to CSS custom properties (`--mx-*` in `@layer mx.tokens`), a typed
  token map for TypeScript and flat JSON per theme.
- Themes as attribute scopes (`[data-theme]`, `[data-density]`), with `prefers-color-scheme`
  picking light or dark when no attribute is set.
- Base styles: reset, typography ramp, `:focus-visible` ring, `color-scheme`, `.mx-sr-only`.
- Preference overrides: reduced motion, reduced transparency and forced colors (system colors).
- WCAG contrast gate: AA in light and dark, AAA in high contrast; a failing pair fails the build.
- Theme helpers (`setTheme`, `getTheme`, `resolveTheme`, `setDensity`, `getDensity`,
  `onSystemThemeChange`) and `cssVar` / `cssProperty` for styles written in TypeScript.
- Shareable stylelint config (`@motifx-community/design-system/stylelint`).
