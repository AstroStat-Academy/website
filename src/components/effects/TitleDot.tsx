import React, { useEffect, useRef } from 'react';
import { canvas as colors, palette } from '../../styles/tokens';

const CHARS = 'αβγδεζηθικλμνξπρστφχψωΣ∑∫∂∇∞≈±√⊕⊙☉★✦χμσ0123456789';
const FONT_SIZE     = 14;
const FRAME_MS      = 110;   // ~9 fps — classic Matrix pace
const HISTO_ZONE    = 120;
const MAX_BIN       = 40;    // fixed ceiling — normalise only above this
const BIN_INCREMENT = 5.0;
const BIN_DECAY     = 0.25;
const TRI_W         = 9;     // triangle half-width (px)
const TRI_H         = 13;    // triangle height (px)
const MEAN_LERP     = 0.18;  // per-frame pull toward target (lower = slower migration)

export default function TitleDot() {
  const wrapRef      = useRef<HTMLDivElement>(null);
  const canvasRef    = useRef<HTMLCanvasElement>(null);
  const meanXRef     = useRef(0.5);   // normalised [0,1], default centre
  const histoBaseRef = useRef(0);     // canvas-px Y of histogram baseline
  const canvasWRef   = useRef(0);     // canvas CSS width
  const isDragging   = useRef(false);

  useEffect(() => {
    const wrap   = wrapRef.current;
    const canvas = canvasRef.current;
    if (!wrap || !canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let raf      = 0;
    let lastTick = 0;
    let canvasW  = 0, canvasH = 0;
    let rainTop    = 0;
    let rainBottom = 0;
    let histoBase  = 0;
    let columns    = 0;
    let drops: number[]    = [];
    let jitter: number[]   = [];
    let bins: Float32Array = new Float32Array(0);
    let smoothMean         = 0.5;  // effective Gaussian centre, lerps toward marker

    const build = () => {
      const h1 = wrap.querySelector('h1') as HTMLElement;
      if (!h1) return;

      const dpr   = window.devicePixelRatio || 1;
      const wRect = wrap.getBoundingClientRect();
      const hRect = h1.getBoundingClientRect();

      canvasW = wRect.width;
      canvasH = wRect.height + HISTO_ZONE;

      canvas.width  = Math.ceil(canvasW * dpr);
      canvas.height = Math.ceil(canvasH * dpr);
      canvas.style.width  = canvasW + 'px';
      canvas.style.height = canvasH + 'px';
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      const span = h1.querySelector('span') as HTMLElement;
      rainTop    = (span ? span.getBoundingClientRect().top : hRect.top) - wRect.top;
      rainBottom = hRect.bottom - wRect.top;
      histoBase  = rainBottom + HISTO_ZONE - 4;

      histoBaseRef.current = histoBase;
      canvasWRef.current   = canvasW;

      columns = Math.floor(canvasW / FONT_SIZE);
      bins    = new Float32Array(columns);

      const rainRows = Math.ceil((histoBase - rainTop) / FONT_SIZE);
      drops = Array.from({ length: columns }, () =>
        rainTop / FONT_SIZE - Math.floor(Math.random() * rainRows)
      );

      // Per-column jitter (stable); Gaussian centre is computed live in tick()
      jitter = Array.from({ length: columns }, () => 0.85 + Math.random() * 0.30);
    };

    const tick = (now: number) => {
      raf = requestAnimationFrame(tick);
      if (now - lastTick < FRAME_MS) return;
      lastTick = now;

      // Fade trail toward black
      ctx.fillStyle = colors.rainFade;
      ctx.fillRect(0, rainTop, canvasW, rainBottom - rainTop);

      // Histogram zone fades toward transparency
      ctx.save();
      ctx.globalCompositeOperation = 'destination-out';
      ctx.fillStyle = colors.histoFade;
      ctx.fillRect(0, rainBottom, canvasW, canvasH - rainBottom);
      ctx.restore();

      ctx.save();
      ctx.beginPath();
      ctx.rect(0, rainTop, canvasW, histoBase - rainTop);
      ctx.clip();

      ctx.font = `${FONT_SIZE}px ui-monospace, monospace`;
      ctx.textBaseline = 'top';

      // Smooth-follow: Gaussian centre lags behind the marker
      smoothMean += (meanXRef.current - smoothMean) * MEAN_LERP;
      const meanCol = smoothMean * columns;
      const sigma   = columns / 5;

      for (let i = 0; i < columns; i++) {
        const y = drops[i] * FONT_SIZE;
        if (y >= 0 && y < histoBase) {
          const char = CHARS[Math.floor(Math.random() * CHARS.length)];
          ctx.fillStyle = colors.charColor;
          ctx.fillText(char, i * FONT_SIZE, y);
        }
        if (y >= histoBase) {
          bins[i] += BIN_INCREMENT;
          drops[i] = -Math.floor(Math.random() * 8);
        } else {
          const g = Math.exp(-0.5 * ((i - meanCol) / sigma) ** 2);
          drops[i] += (0.4 + g * 2.1) * jitter[i];
        }
      }

      ctx.restore();

      // Bin decay
      for (let k = 0; k < columns; k++) bins[k] = Math.max(0, bins[k] - BIN_DECAY);

      // Histogram: blue shadow pass then red bars
      const binW   = canvasW / columns;
      const maxBin = Math.max(...bins, MAX_BIN);
      for (let k = 0; k < columns; k++) {
        if (bins[k] < 0.05) continue;
        const norm = bins[k] / maxBin;
        const bh   = norm * HISTO_ZONE;
        ctx.fillStyle = `rgba(${colors.shadowColorRgb}, 0.30)`;
        ctx.fillRect(k * binW + 1.5, histoBase - bh + 2, binW - 1, bh);
      }
      for (let k = 0; k < columns; k++) {
        if (bins[k] < 0.05) continue;
        const norm  = bins[k] / maxBin;
        const bh    = norm * HISTO_ZONE;
        const alpha = 0.55 + norm * 0.35;
        ctx.fillStyle = `rgba(${colors.charColorRgb}, ${alpha})`;
        ctx.fillRect(k * binW + 0.5, histoBase - bh, binW - 1, bh);
      }

      // Mean marker: dashed blue guideline + bone triangle (drawn last, always on top)
      const mx = meanXRef.current * canvasW;

      // Triangle pointing up — apex at histoBase baseline
      ctx.fillStyle = palette.bone;
      ctx.beginPath();
      ctx.moveTo(mx,          histoBase + 2);
      ctx.lineTo(mx - TRI_W,  histoBase + 2 + TRI_H);
      ctx.lineTo(mx + TRI_W,  histoBase + 2 + TRI_H);
      ctx.closePath();
      ctx.fill();
    };

    document.fonts.ready.then(() => {
      build();
      raf = requestAnimationFrame(tick);
    });

    const onResize = () => { build(); };
    window.addEventListener('resize', onResize);
    return () => { cancelAnimationFrame(raf); window.removeEventListener('resize', onResize); };
  }, []);

  // ── Drag handling ──────────────────────────────────────────────────────────
  const nearTriangle = (cssX: number, cssY: number) => {
    const mx = meanXRef.current * canvasWRef.current;
    const hb = histoBaseRef.current;
    return Math.abs(cssX - mx) < TRI_W + 8 && cssY >= hb && cssY <= hb + TRI_H + 10;
  };

  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    if (nearTriangle(e.clientX - rect.left, e.clientY - rect.top)) {
      isDragging.current = true;
      e.currentTarget.setPointerCapture(e.pointerId);
      e.currentTarget.style.cursor = 'ew-resize';
    }
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    if (isDragging.current) {
      meanXRef.current = Math.max(0, Math.min(x / canvasWRef.current, 1));
    } else {
      e.currentTarget.style.cursor =
        nearTriangle(x, e.clientY - rect.top) ? 'ew-resize' : 'default';
    }
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLCanvasElement>) => {
    isDragging.current = false;
    e.currentTarget.style.cursor = 'default';
  };

  return (
    <div ref={wrapRef} style={{ position: 'relative', paddingBottom: HISTO_ZONE + 'px' }}>
      <h1 className="text-5xl md:text-7xl font-bold leading-tight relative z-10 text-bone">
        AstroStat<br />
        <span className="text-bone">Academy</span>
      </h1>
      <canvas
        ref={canvasRef}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        style={{ position: 'absolute', inset: 0, pointerEvents: 'auto' }}
        aria-hidden="true"
      />
    </div>
  );
}
