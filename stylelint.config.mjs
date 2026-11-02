// Shareable stylelint config for packages and apps built on
// @motifx-community/design-system: a color, font family, z-index or motion
// value must come from a token (`var(--mx-…)`), a CSS keyword or a system
// color, never from a literal. Extend it in your own stylelint config:
//
//   export default { extends: ['@motifx-community/design-system/stylelint'] };
//
// Only longhand properties are listed: a shorthand like `box-shadow` or
// `border` mixes lengths and colors, which the rule cannot take apart.

/** CSS system colors are what `@media (forced-colors: active)` rules map tokens to. */
const SYSTEM_COLORS = [
  'Canvas',
  'CanvasText',
  'LinkText',
  'VisitedText',
  'ActiveText',
  'ButtonFace',
  'ButtonText',
  'ButtonBorder',
  'Field',
  'FieldText',
  'Highlight',
  'HighlightText',
  'SelectedItem',
  'SelectedItemText',
  'Mark',
  'MarkText',
  'GrayText',
  'AccentColor',
  'AccentColorText',
];

const COMMON = ['inherit', 'initial', 'unset', 'revert', 'revert-layer', 'currentColor', 'currentcolor', 'transparent', 'none', 'auto', '0'];

export default {
  plugins: ['stylelint-declaration-strict-value'],
  rules: {
    'scale-unlimited/declaration-strict-value': [
      [
        '/color$/',
        'fill',
        'stroke',
        'background-color',
        'border-color',
        'outline-color',
        'font-family',
        'z-index',
        'transition-duration',
        'animation-duration',
        'transition-timing-function',
        'animation-timing-function',
      ],
      {
        ignoreVariables: true,
        ignoreFunctions: false,
        ignoreKeywords: {
          '': COMMON,
          '/color$/': [...COMMON, ...SYSTEM_COLORS],
          fill: [...COMMON, ...SYSTEM_COLORS],
          stroke: [...COMMON, ...SYSTEM_COLORS],
          'background-color': [...COMMON, ...SYSTEM_COLORS],
          'border-color': [...COMMON, ...SYSTEM_COLORS],
          'outline-color': [...COMMON, ...SYSTEM_COLORS],
        },
        disableFix: true,
      },
    ],
  },
};
