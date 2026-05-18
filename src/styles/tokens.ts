// ─── Single flat palette — 4 colors, nothing else ────────────────────────────
export const palette = {
  blue:  '#0465ad',   // primary blue
  red:   '#8c0527',   // primary crimson
  bone:  '#e8dcc8',   // warm off-white — text, highlights
  ink:   '#070d1a',   // spare / deep background
} as const;

// ─── Semantic UI tokens (derived from palette) ────────────────────────────────
export const ui = {
  hexActive:      palette.ink,
  hexInactive:    palette.ink,
  chartText:      '#cbd5e1',
  chartHighlight: '#14b8a6',
  gridLine:       'rgba(255, 255, 255, 0.07)',
} as const;

// ─── Canvas 2D API strings (ctx.fillStyle etc.) ───────────────────────────────
export const canvas = {
  charColor:    palette.bone,
  charColorRgb: '232, 220, 200',         // RGB of palette.bone for rgba() use
  rainFade:     'rgba(7, 13, 26, 0.22)', // base @ 22% — TitleDot trail
  rainFadeAlt:  'rgba(7, 13, 26, 0.18)', // base @ 18% — CodeRain trail
  histoFade:    'rgba(0, 0, 0, 0.18)',   // destination-out alpha wipe
} as const;
