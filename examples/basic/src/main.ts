import '../../../dist/css/styles.css';
import './style.css';
import {
  cssProperty,
  cssVar,
  getDensity,
  getDesignLanguage,
  getTheme,
  designLanguages,
  onSystemThemeChange,
  setDensity,
  setDesignLanguage,
  setTheme,
  themes,
  tokens,
  type DesignLanguageName,
  type ThemeChoice,
  type TokenName,
} from '@motifx-community/design-system';

// A page that knows nothing but the tokens: no component library, plain DOM.
// Everything below is generated from the typed token map.

const names = Object.keys(tokens) as TokenName[];
const startingWith = (prefix: string) => names.filter((n) => n.startsWith(prefix));

function el<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  attrs: Record<string, string> = {},
  ...children: (Node | string)[]
): HTMLElementTagNameMap[K] {
  const node = document.createElement(tag);
  for (const [key, value] of Object.entries(attrs)) node.setAttribute(key, value);
  node.append(...children);
  return node;
}

/** The computed value of a token where `node` sits: themes and density scopes included. */
const computed = (name: TokenName, node: Element = document.documentElement) =>
  getComputedStyle(node).getPropertyValue(cssProperty(name)).trim();

const valueLabel = (name: TokenName) => el('span', { class: 'demo-value', 'data-token': name });

function section(title: string, text: string, ...content: Node[]) {
  return el('section', { class: 'demo-section' }, el('h2', {}, title), el('p', {}, text), ...content);
}

function swatches(prefix: string) {
  const grid = el('div', { class: 'demo-grid' });
  for (const name of startingWith(prefix)) {
    grid.append(
      el(
        'div',
        { class: 'demo-swatch' },
        el('div', { class: 'demo-swatch__color', style: `background: ${cssVar(name)}` }),
        el('code', {}, name),
        valueLabel(name),
      ),
    );
  }
  return grid;
}

function rows(prefix: string, render: (name: TokenName) => HTMLElement) {
  const list = el('div', { class: 'demo-section' });
  for (const name of startingWith(prefix)) list.append(el('div', { class: 'demo-row' }, el('code', {}, name), render(name), valueLabel(name)));
  return list;
}

// ---- header: design language, theme, density, direction --------------------------------------

const designLanguageSelect = el('select', { class: 'demo-control', 'aria-label': 'Design language' });
for (const i of designLanguages) designLanguageSelect.append(el('option', { value: i }, i));
designLanguageSelect.value = getDesignLanguage() === 'default' ? designLanguages[0] : getDesignLanguage();
designLanguageSelect.onchange = () => {
  setDesignLanguage(designLanguageSelect.value as DesignLanguageName);
  refresh();
};

const themeSelect = el('select', { class: 'demo-control', 'aria-label': 'Theme' });
for (const t of ['system', ...themes]) themeSelect.append(el('option', { value: t }, t));
themeSelect.value = getTheme();
themeSelect.onchange = () => {
  setTheme(themeSelect.value as ThemeChoice);
  refresh();
};

const densityButton = el('button', { class: 'demo-control', type: 'button', 'aria-pressed': String(getDensity() === 'compact') }, 'Compact');
densityButton.onclick = () => {
  const compact = getDensity() !== 'compact';
  setDensity(compact ? 'compact' : 'default');
  densityButton.setAttribute('aria-pressed', String(compact));
  refresh();
};

const dirButton = el('button', { class: 'demo-control', type: 'button', 'aria-pressed': 'false' }, 'RTL');
dirButton.onclick = () => {
  const rtl = document.documentElement.dir !== 'rtl';
  document.documentElement.dir = rtl ? 'rtl' : 'ltr';
  dirButton.setAttribute('aria-pressed', String(rtl));
};

// ---- a widget that is not ours: a card, a button and a canvas drawn from tokens ---------------

const canvas = el('canvas', { class: 'demo-canvas mx-forced-colors-none', width: '448', height: '96' });

function drawCanvas() {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  const color = (name: TokenName) => computed(name, canvas);
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = color('color.bg.layer');
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.strokeStyle = color('color.stroke.divider');
  for (let x = 16; x < canvas.width; x += 32) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, canvas.height);
    ctx.stroke();
  }
  ctx.fillStyle = color('color.accent.solid');
  ctx.beginPath();
  ctx.roundRect(24, 24, 200, 48, 6);
  ctx.fill();
  ctx.fillStyle = color('color.accent.on-solid');
  ctx.font = `600 14px ${color('font.family.sans')}`;
  ctx.fillText('node drawn from tokens', 40, 53);
  ctx.strokeStyle = color('color.accent.fg');
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(224, 48);
  ctx.bezierCurveTo(300, 48, 330, 24, 420, 24);
  ctx.stroke();
}

const widget = el(
  'div',
  { class: 'demo-card' },
  el('h3', {}, 'Not a component of any kit'),
  el('p', {}, 'A plain card, a plain button and a canvas. They only read the tokens, so they follow the theme, the density and forced colors like everything else on the page.'),
  el('button', { class: 'demo-button', type: 'button' }, 'Accent action'),
  canvas,
);

// ---- page -----------------------------------------------------------------------------------

const main = el(
  'main',
  { class: 'demo-main' },
  el('h1', {}, '@motifx-community/design-system'),
  section('Adopt the theme without the kit', 'Any element, library or canvas that reads `--mx-*` fits in.', widget),
  section('Semantic colors', 'What components read. Each theme redefines these; the palette below stays.', swatches('color.bg.'), swatches('color.fg.'), swatches('color.fill.'), swatches('color.stroke.'), swatches('color.accent.'), swatches('color.danger.'), swatches('color.success.'), swatches('color.caution.')),
  section('Focus ring', 'Tab to the button: the ring comes from the focus tokens and shows only for keyboard focus.', el('button', { class: 'demo-control', type: 'button' }, 'Focus me with Tab')),
  section(
    'Type ramp',
    'Sizes pair with line heights of the same name.',
    rows('font.size.', (name) => {
      const line = name.replace('font.size.', 'font.line.') as TokenName;
      return el('span', { style: `font-size: ${cssVar(name)}; line-height: ${cssVar(line)}` }, 'Sphinx of black quartz');
    }),
  ),
  section('Spacing', 'A 4px grid in rem.', rows('space.', (name) => el('div', { class: 'demo-bar', style: `inline-size: ${cssVar(name)}` }))),
  section('Radius', '', rows('radius.', (name) => el('div', { class: 'demo-box', style: `border-radius: ${cssVar(name)}` }))),
  section('Elevation', '', rows('shadow.', (name) => el('div', { class: 'demo-box', style: `box-shadow: ${cssVar(name)}` }))),
  section('Density', 'Control heights change with data-density; toggle Compact above.', rows('control.height.', (name) => el('div', { class: 'demo-box', style: `block-size: ${cssVar(name)}` }))),
  section('Motion', 'Durations collapse to 0ms under prefers-reduced-motion.', rows('motion.', (name) => el('span', {}, ''))),
  section('Palette', 'Primitive colors. Components never read these directly.', swatches('color.gray'), swatches('color.accent.'), swatches('color.critical.'), swatches('color.success.'), swatches('color.caution.'), swatches('color.contrast.')),
);

const header = el('header', { class: 'demo-header' }, el('span', { class: 'demo-brand' }, 'design-system demo'), designLanguageSelect, themeSelect, densityButton, dirButton);

function refresh() {
  for (const span of document.querySelectorAll<HTMLElement>('[data-token]')) {
    span.textContent = computed(span.dataset.token as TokenName, span);
  }
  drawCanvas();
}

document.querySelector('#app')!.append(header, main);
refresh();
onSystemThemeChange(refresh);
