# Windows preset (not built yet)

The token values the package shipped with before the Tactile identity: a token-for-token port of
Fluent 2 (Windows 11): the neutral grey ramp, the blue accent ramp, Segoe UI Variable and Cascadia
Mono, the 2/4/8 px radii, and the semantic light and dark mappings that read them.

Nothing here is part of the build. `build/tokens.mjs` reads only `tokens/primitive/*.json`,
`tokens/semantic/<theme>.json` and `tokens/density/<density>.json`. The files are kept so a second
identity can be offered later as an `identity` modifier in `mx.resolver.json` (contexts `tactile`,
the default, and `windows`), with the same semantic token names and the same contrast gate.

Token names here may lag behind the main set: tokens added after the split (`color.bg.bar`,
`color.bg.glass`, `color.stroke.control.edge`, `color.highlight.control`, `color.gray.22`,
`color.gray.26`, `font.weight.medium`, `font.width.*`, `radius.xl`) have no value in this preset
yet and must be added before it can build.

"Fluent" is a Microsoft trademark; this preset is named for the platform whose look it follows,
not for the design system.
