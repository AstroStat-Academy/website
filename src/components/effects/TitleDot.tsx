import { useEffect, useRef } from 'react';
import { canvas as colors } from '../../styles/tokens';

const CHARS = 'αβγδεζηθικλμνξπρστφχψωΣ∑∫∂∇∞≈±√⊕⊙☉★✦χμσ0123456789';
const FONT_SIZE     = 14;
const FRAME_MS      = 110;   // ~9 fps — classic Matrix pace
const HISTO_ZONE    = 80;
const MAX_BIN       = 40;    // fixed ceiling — normalise only above this
const BIN_INCREMENT = 5.0;
const BIN_DECAY     = 0.25;

export default function TitleDot() {
  const wrapRef  = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const wrap   = wrapRef.current;
    const canvas = canvasRef.current;
    if (!wrap || !canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let raf      = 0;
    let lastTick = 0;
    let canvasW  = 0, canvasH = 0;
    let rainTop      = 0;   // y where rain starts (bottom of "AstroStat" row)
    let rainBottom   = 0;   // y where drops are captured (h1 bottom)
    let histoBase    = 0;   // y where histogram bars anchor (canvas bottom)
    let columns  = 0;
    let drops: number[] = [];
    let speeds: number[] = [];
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
      rainBottom = hRect.bottom - wRect.top;          // h1 bottom edge
      histoBase  = rainBottom + HISTO_ZONE - 4;       // histogram baseline

      columns = Math.floor(canvasW / FONT_SIZE);
      bins    = new Float32Array(columns);

      const rainRows = Math.ceil((histoBase - rainTop) / FONT_SIZE);
      drops  = Array.from({ length: columns }, () =>
        rainTop / FONT_SIZE - Math.floor(Math.random() * rainRows)
      );
      speeds = Array.from({ length: columns }, () => 0.5 + Math.random() * 1.5);
    };

    const tick = (now: number) => {
      raf = requestAnimationFrame(tick);
      if (now - lastTick < FRAME_MS) return;
      lastTick = now;

      // Fade trail — rain zone fades toward background colour
      ctx.fillStyle = colors.rainFade;
      ctx.fillRect(0, rainTop, canvasW, rainBottom - rainTop);

      // Histogram zone fades toward transparency (no colour accumulation)
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
      ctx.fillStyle = colors.charColor;

      for (let i = 0; i < columns; i++) {
        const y = drops[i] * FONT_SIZE;
        if (y >= 0 && y < histoBase) {
          const char = CHARS[Math.floor(Math.random() * CHARS.length)];
          ctx.fillText(char, i * FONT_SIZE, y);
        }

        // Drop reached the histogram baseline — register hit, reset
        if (y >= histoBase) {
          bins[i] += BIN_INCREMENT;
          drops[i] = -Math.floor(Math.random() * 8);
        } else {
          drops[i] += speeds[i];
        }
      }

      ctx.restore();

      // Bin decay
      for (let k = 0; k < columns; k++) bins[k] = Math.max(0, bins[k] - BIN_DECAY);

      // Histogram — bars normalised to current max so tallest bar always fills HISTO_ZONE
      const binW   = canvasW / columns;
      const maxBin = Math.max(...bins, MAX_BIN);
      for (let k = 0; k < columns; k++) {
        if (bins[k] < 0.05) continue;
        const norm  = bins[k] / maxBin;
        const bh    = norm * HISTO_ZONE;
        const alpha = 0.55 + norm * 0.35;
        ctx.fillStyle = `rgba(${colors.charColorRgb}, ${alpha})`;
        ctx.fillRect(k * binW + 0.5, histoBase - bh, binW - 1, bh);
      }
    };

    document.fonts.ready.then(() => {
      build();
      raf = requestAnimationFrame(tick);
    });

    const onResize = () => { build(); };
    window.addEventListener('resize', onResize);
    return () => { cancelAnimationFrame(raf); window.removeEventListener('resize', onResize); };
  }, []);

  return (
    <div ref={wrapRef} style={{ position: 'relative', paddingBottom: HISTO_ZONE + 'px' }}>
      <h1 className="text-5xl md:text-7xl font-bold leading-tight relative z-10">
        AstroStat<br />
        <span className="text-accent">Academy</span>
      </h1>
      <canvas
        ref={canvasRef}
        style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}
        aria-hidden="true"
      />
    </div>
  );
}
