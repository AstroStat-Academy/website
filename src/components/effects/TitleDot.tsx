import React, { useEffect, useRef } from 'react';
import { canvas as colors, palette } from '../../styles/tokens';

const CHARS = 'αβγδεζηθικλμνξπρστφχψωΣ∑∫∂∇∞≈±√⊕⊙☉★✦χμσ0123456789';
const FONT_SIZE     = 14;
const FRAME_MS      = 110;
const HISTO_ZONE    = 120;
const MAX_BIN       = 40;
const BIN_INCREMENT = 5.0;
const BIN_DECAY     = 0.25;
const MEAN_LERP     = 0.40;

// Pill control geometry
const PILL_H        = 6;    // capsule height (straddles baseline)
const GRIP_W        = 6;    // end-tab width
const TRI_W         = 9;    // triangle half-width
const TRI_H         = 12;   // triangle height

const SIGMA_DEFAULT = 0.20; // σ as fraction of canvas width (≈ columns/5)
const FWHM_FACTOR   = 2.355;

export default function TitleDot() {
  const wrapRef      = useRef<HTMLDivElement>(null);
  const canvasRef    = useRef<HTMLCanvasElement>(null);

  // Control state — all refs to avoid re-renders
  const meanXRef     = useRef(0.5);        // drag target for mean [0,1]
  const smoothMeanRef = useRef(0.5);       // animated mean [0,1]
  const sigmaFracRef  = useRef(SIGMA_DEFAULT);
  const histoBaseRef  = useRef(0);
  const canvasWRef    = useRef(0);
  const dragMode      = useRef<'none' | 'move' | 'left' | 'right'>('none');

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
      jitter = Array.from({ length: columns }, () => 0.85 + Math.random() * 0.30);
    };

    const tick = (now: number) => {
      raf = requestAnimationFrame(tick);
      if (now - lastTick < FRAME_MS) return;
      lastTick = now;

      // Smooth-follow mean
      smoothMeanRef.current += (meanXRef.current - smoothMeanRef.current) * MEAN_LERP;
      const smoothMean = smoothMeanRef.current;

      // Fade trail
      ctx.fillStyle = colors.rainFade;
      ctx.fillRect(0, rainTop, canvasW, rainBottom - rainTop);

      // Histogram zone → transparency
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

      const meanCol = smoothMean * columns;
      const sigma   = sigmaFracRef.current * columns;

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

      // Histogram — blue shadow then red bars
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

      // ── Pill control ───────────────────────────────────────────────────────
      const mx       = smoothMean * canvasW;
      const fwhmHalf = sigmaFracRef.current * canvasW * FWHM_FACTOR / 2;
      const lx       = Math.max(GRIP_W + 2, mx - fwhmHalf);
      const rx       = Math.min(canvasW - GRIP_W - 2, mx + fwhmHalf);
      const pillTop  = histoBase - PILL_H / 2;
      const r        = PILL_H / 2;

      // Pill outline
      ctx.strokeStyle = palette.bone;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.roundRect(lx, pillTop, rx - lx, PILL_H, r);
      ctx.stroke();

      // Left grip tab (filled)
      ctx.fillStyle = palette.bone;
      ctx.beginPath();
      ctx.roundRect(lx - GRIP_W, pillTop, GRIP_W, PILL_H, [r, 0, 0, r]);
      ctx.fill();

      // Right grip tab (filled)
      ctx.beginPath();
      ctx.roundRect(rx, pillTop, GRIP_W, PILL_H, [0, r, r, 0]);
      ctx.fill();

      // Big centre triangle — base flush with pill top, apex pointing up
      ctx.fillStyle = palette.bone;
      ctx.beginPath();
      ctx.moveTo(mx,          pillTop - TRI_H);   // apex
      ctx.lineTo(mx - TRI_W,  pillTop);            // base-left
      ctx.lineTo(mx + TRI_W,  pillTop);            // base-right
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

  // ── Hit testing (CSS px = canvas CSS px, no DPR scaling needed) ──────────
  const getHit = (x: number, y: number) => {
    const mx       = smoothMeanRef.current * canvasWRef.current;
    const fwhmHalf = sigmaFracRef.current * canvasWRef.current * FWHM_FACTOR / 2;
    const lx       = Math.max(GRIP_W + 2, mx - fwhmHalf);
    const rx       = Math.min(canvasWRef.current - GRIP_W - 2, mx + fwhmHalf);
    const hb       = histoBaseRef.current;
    const pillTop  = hb - PILL_H / 2;

    // Grips first (narrower targets)
    if (x >= lx - GRIP_W - 4 && x <= lx + 4   && y >= pillTop - 4 && y <= hb + PILL_H / 2 + 4) return 'left';
    if (x >= rx - 4           && x <= rx + GRIP_W + 4 && y >= pillTop - 4 && y <= hb + PILL_H / 2 + 4) return 'right';
    // Triangle + pill body
    if (x >= lx && x <= rx && y >= pillTop - TRI_H - 4 && y <= hb + PILL_H / 2 + 4) return 'move';
    if (Math.abs(x - mx) <= TRI_W + 4 && y >= pillTop - TRI_H - 4 && y <= pillTop + 4) return 'move';
    return 'none';
  };

  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const hit = getHit(e.clientX - rect.left, e.clientY - rect.top);
    if (hit !== 'none') {
      dragMode.current = hit;
      e.currentTarget.setPointerCapture(e.pointerId);
      e.currentTarget.style.cursor = hit === 'move' ? 'grab' : 'ew-resize';
    }
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const cw = canvasWRef.current;

    if (dragMode.current === 'move') {
      meanXRef.current = Math.max(0, Math.min(x / cw, 1));
      e.currentTarget.style.cursor = 'grabbing';
    } else if (dragMode.current === 'left' || dragMode.current === 'right') {
      const mx   = smoothMeanRef.current * cw;
      const dist = Math.abs(x - mx);
      sigmaFracRef.current = Math.max(0.05, Math.min(0.45, dist * 2 / (cw * FWHM_FACTOR)));
    } else {
      const hit = getHit(x, y);
      e.currentTarget.style.cursor =
        hit === 'move'  ? 'grab'      :
        hit !== 'none'  ? 'ew-resize' : 'default';
    }
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLCanvasElement>) => {
    dragMode.current = 'none';
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
