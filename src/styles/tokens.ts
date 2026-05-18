// ─── Single flat palette — 4 colors, nothing else ────────────────────────────
export const palette = {
  base:    '#070d1a',   // deep background
  surface: '#0d1629',   // card / panel background
  accent:  '#e8dcc8',   // warm off-white (text highlights, UI accents)
  blue:    '#3b82f6',   // data blue (charts, indicators)
} as const;

// ─── Semantic UI tokens (derived from palette) ────────────────────────────────
export const ui = {
  hexActive:      palette.base,
  hexInactive:    palette.base,
  chartText:      '#cbd5e1',
  chartHighlight: '#14b8a6',
  gridLine:       'rgba(255, 255, 255, 0.07)',
} as const;

// ─── Canvas 2D API strings (ctx.fillStyle etc.) ───────────────────────────────
export const canvas = {
  charColor:    palette.accent,
  charColorRgb: '232, 220, 200',         // RGB of palette.accent for rgba() use
  rainFade:     'rgba(7, 13, 26, 0.22)', // base @ 22% — TitleDot trail
  rainFadeAlt:  'rgba(7, 13, 26, 0.18)', // base @ 18% — CodeRain trail
  histoFade:    'rgba(0, 0, 0, 0.18)',   // destination-out alpha wipe
} as const;
