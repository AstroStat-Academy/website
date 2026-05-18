// ─── Raw palette — mirrors tailwind.config.mjs ───────────────────────────────
export const navy = {
  950: '#02040d',
  900: '#070d1a',
  800: '#0d1629',
  700: '#162040',
  600: '#1e2d5a',
} as const;

export const accent = {
  teal: '#e8dcc8',
  blue: '#3b82f6',
  cyan: '#06b6d4',
} as const;

// ─── Semantic UI tokens ───────────────────────────────────────────────────────
export const ui = {
  hexActive:      '#07101f',
  hexInactive:    '#050810',
  chartText:      '#cbd5e1',
  chartHighlight: '#14b8a6',
  gridLine:       'rgba(255, 255, 255, 0.07)',
} as const;

// ─── Canvas 2D API strings (ctx.fillStyle etc.) ───────────────────────────────
export const canvas = {
  charColor:    accent.teal,
  charColorRgb: '232, 220, 200',          // RGB components of accent.teal for rgba() use
  rainFade:     'rgba(7, 13, 26, 0.22)',  // navy-900 @ 22% — TitleDot trail
  rainFadeAlt:  'rgba(7, 13, 26, 0.18)', // navy-900 @ 18% — CodeRain trail
  histoFade:    'rgba(0, 0, 0, 0.18)',   // destination-out alpha wipe
} as const;
