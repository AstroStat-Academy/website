// ─── Single flat palette — 4 colors, nothing else ────────────────────────────
export const palette = {
  blue:  '#0465ad',   // primary blue
  red:   '#8c0527',   // primary crimson
  bone:  '#fbf6ec',   // warm off-white — text, highlights
  ink:   '#000000',   // spare / pure black background
} as const;

// ─── Semantic UI tokens (derived from palette) ────────────────────────────────
export const ui = {
  hexActive:      palette.ink,
  hexInactive:    palette.ink,
  chartText:      '#cbd5e1',
  chartHighlight: palette.red,
  gridLine:       'rgba(255, 255, 255, 0.07)',
} as const;

// ─── Canvas 2D API strings (ctx.fillStyle etc.) ───────────────────────────────
export const canvas = {
  charColor:      palette.red,
  charColorRgb:   '140, 5, 39',          // RGB of palette.red
  shadowColor:    palette.blue,
  shadowColorRgb: '4, 101, 173',         // RGB of palette.blue
  rainFade:       'rgba(0, 0, 0, 0.12)', // darken pass — TitleDot (pair with blue tint)
  rainFadeAlt:    'rgba(0, 0, 0, 0.12)', // darken pass — CodeRain  (pair with blue tint)
  histoFade:      'rgba(0, 0, 0, 0.18)', // destination-out alpha wipe
} as const;
