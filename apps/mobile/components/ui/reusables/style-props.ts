import type { TextStyle, ViewStyle } from 'react-native';

const SPACING_MAP: Record<string, number> = {
  '$0': 0,
  '$0.5': 2,
  '$1': 4,
  '$1.5': 6,
  '$2': 8,
  '$2.5': 10,
  '$3': 12,
  '$3.5': 14,
  '$4': 16,
  '$5': 20,
  '$6': 24,
  '$7': 28,
  '$8': 32,
  '$9': 36,
  '$10': 40,
  '$11': 44,
  '$12': 48,
};

const RADIUS_MAP: Record<string, number> = {
  '$none': 0,
  '$sm': 4,
  '$md': 8,
  '$lg': 12,
  '$xl': 16,
  '$2xl': 20,
  '$3xl': 24,
  '$full': 9999,
};

function resolveNumeric(value: unknown): number | string | undefined {
  if (value === null || value === undefined) return undefined;
  if (typeof value === 'number') return value;
  if (typeof value === 'string') {
    if (value === '$full') return '100%';
    if (SPACING_MAP[value] !== undefined) return SPACING_MAP[value];
    if (value.endsWith('%')) return value;
    const parsed = Number(value);
    if (!Number.isNaN(parsed)) return parsed;
  }
  return undefined;
}

function resolveRadius(value: unknown): number | undefined {
  if (value === null || value === undefined) return undefined;
  if (typeof value === 'number') return value;
  if (typeof value === 'string') {
    if (RADIUS_MAP[value] !== undefined) return RADIUS_MAP[value];
    const parsed = Number(value);
    if (!Number.isNaN(parsed)) return parsed;
  }
  return undefined;
}

function applySizeStyles(style: ViewStyle, props: Record<string, unknown>) {
  const width = resolveNumeric(props.w ?? props.width);
  if (width !== undefined) style.width = width as any;

  const height = resolveNumeric(props.h ?? props.height);
  if (height !== undefined) style.height = height as any;

  const minWidth = resolveNumeric(props.minW ?? props.minWidth);
  if (minWidth !== undefined) style.minWidth = minWidth as any;

  const maxWidth = resolveNumeric(props.maxW ?? props.maxWidth);
  if (maxWidth !== undefined) style.maxWidth = maxWidth as any;

  const minHeight = resolveNumeric(props.minH ?? props.minHeight);
  if (minHeight !== undefined) style.minHeight = minHeight as any;

  const maxHeight = resolveNumeric(props.maxH ?? props.maxHeight);
  if (maxHeight !== undefined) style.maxHeight = maxHeight as any;
}

function applySpacingStyles(style: ViewStyle, props: Record<string, unknown>) {
  const pairs: Array<[keyof ViewStyle, unknown]> = [
    ['margin', props.m],
    ['marginTop', props.mt],
    ['marginRight', props.mr],
    ['marginBottom', props.mb],
    ['marginLeft', props.ml],
    ['padding', props.p],
    ['paddingTop', props.pt],
    ['paddingRight', props.pr],
    ['paddingBottom', props.pb],
    ['paddingLeft', props.pl],
  ];

  for (const [key, value] of pairs) {
    const resolved = resolveNumeric(value);
    if (resolved !== undefined) style[key] = resolved as never;
  }

  const mx = resolveNumeric(props.mx);
  if (mx !== undefined) {
    style.marginLeft = mx as any;
    style.marginRight = mx as any;
  }

  const my = resolveNumeric(props.my);
  if (my !== undefined) {
    style.marginTop = my as any;
    style.marginBottom = my as any;
  }

  const px = resolveNumeric(props.px);
  if (px !== undefined) {
    style.paddingLeft = px as any;
    style.paddingRight = px as any;
  }

  const py = resolveNumeric(props.py);
  if (py !== undefined) {
    style.paddingTop = py as any;
    style.paddingBottom = py as any;
  }
}

function applyLayoutStyles(style: ViewStyle, props: Record<string, unknown>) {
  if (props.flex !== undefined) style.flex = Number(props.flex);
  if (props.flexDirection) style.flexDirection = props.flexDirection as ViewStyle['flexDirection'];
  if (props.alignItems) style.alignItems = props.alignItems as ViewStyle['alignItems'];
  if (props.justifyContent) {
    style.justifyContent = props.justifyContent as ViewStyle['justifyContent'];
  }
  if (props.alignSelf) style.alignSelf = props.alignSelf as ViewStyle['alignSelf'];
  if (props.position) style.position = props.position as ViewStyle['position'];

  const keys: Array<keyof ViewStyle> = ['top', 'right', 'bottom', 'left'];
  for (const key of keys) {
    const resolved = resolveNumeric(props[key]);
    if (resolved !== undefined) style[key] = resolved as never;
  }

  const gap = resolveNumeric(props.gap ?? props.space);
  if (gap !== undefined) style.gap = Number(gap);

  const zIndex = resolveNumeric(props.zIndex);
  if (zIndex !== undefined) style.zIndex = Number(zIndex);
}

function applyVisualStyles(style: ViewStyle, props: Record<string, unknown>) {
  if (props.bg) style.backgroundColor = String(props.bg);
  if (props.backgroundColor) style.backgroundColor = String(props.backgroundColor);
  if (props.borderColor) style.borderColor = String(props.borderColor);

  const borderWidth = resolveNumeric(props.borderWidth);
  if (borderWidth !== undefined) style.borderWidth = Number(borderWidth);

  const rounded = resolveRadius(props.rounded ?? props.borderRadius);
  if (rounded !== undefined) style.borderRadius = rounded;

  const opacity = resolveNumeric(props.opacity);
  if (opacity !== undefined) style.opacity = Number(opacity);
}

export function extractViewStyles(props: Record<string, unknown>): ViewStyle {
  const style: ViewStyle = {};
  applySizeStyles(style, props);
  applySpacingStyles(style, props);
  applyLayoutStyles(style, props);
  applyVisualStyles(style, props);
  return style;
}

export function extractTextStyles(props: Record<string, unknown>): TextStyle {
  const style: TextStyle = {};
  const textSize = props.size ?? props.fontSize;
  const resolvedSize = resolveNumeric(textSize);
  if (resolvedSize !== undefined) style.fontSize = Number(resolvedSize);

  if (props.fontWeight) style.fontWeight = String(props.fontWeight) as TextStyle['fontWeight'];
  if (props.textAlign) style.textAlign = props.textAlign as TextStyle['textAlign'];
  if (props.color) style.color = String(props.color);

  const lineHeight = resolveNumeric(props.lineHeight);
  if (lineHeight !== undefined) style.lineHeight = Number(lineHeight);

  return style;
}

const KNOWN_PROPS = new Set([
  'w',
  'h',
  'minW',
  'minH',
  'maxW',
  'maxH',
  'width',
  'height',
  'minWidth',
  'minHeight',
  'maxWidth',
  'maxHeight',
  'm',
  'mt',
  'mr',
  'mb',
  'ml',
  'mx',
  'my',
  'p',
  'pt',
  'pr',
  'pb',
  'pl',
  'px',
  'py',
  'flex',
  'flexDirection',
  'alignItems',
  'justifyContent',
  'alignSelf',
  'position',
  'top',
  'right',
  'bottom',
  'left',
  'gap',
  'space',
  'zIndex',
  'bg',
  'backgroundColor',
  'borderColor',
  'borderWidth',
  'rounded',
  'borderRadius',
  'opacity',
  'size',
  'fontSize',
  'fontWeight',
  'lineHeight',
  'textAlign',
  'sx',
]);

export function omitStyleProps<T extends Record<string, unknown>>(props: T): T {
  const next: Record<string, unknown> = {};
  for (const key of Object.keys(props)) {
    if (!KNOWN_PROPS.has(key)) {
      next[key] = props[key];
    }
  }
  return next as T;
}
