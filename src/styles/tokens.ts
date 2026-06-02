// ─── Single flat palette — 4 colors, nothing else ────────────────────────────
export const palette = {
  blue:  '#0465ad',   // primary blue
  red:   '#8c0527',   // primary crimson
  bone:  '#fbf6ec',   // warm off-white — text, highlights
  ink:   '#000000',   // spare / pure black background
  teal:  '#008c8c',   // tertiary accent
} as const;

// ─── Semantic UI tokens (derived from palette) ────────────────────────────────
export const ui = {
  hexActive:      palette.bone,
  hexInactive:    '#fffaf2',
  chartText:      '#1f2937',
  chartHighlight: palette.red,
  gridLine:       'rgba(0, 0, 0, 0.08)',
} as const;

// ─── Canvas 2D API strings (ctx.fillStyle etc.) ───────────────────────────────
export const canvas = {
  charColor:      'rgba(140, 5, 39, 0.5)',
  charColorRgb:   '140, 5, 39',          // RGB of palette.red
  shadowColor:    palette.blue,
  shadowColorRgb: '4, 101, 173',         // RGB of palette.blue
  rainFade:       'rgba(0, 0, 0, 0.10)', // destination-out fade — TitleDot
  rainFadeAlt:    'rgba(0, 0, 0, 0.12)', // darken pass — CodeRain
  histoFade:      'rgba(251, 246, 236, 0.18)',
} as const;
