import { useEffect, useRef } from 'react';

const CHARS = 'αβγδεζηθικλμνξπρστφχψωΣ∑∫∂∇∞≈±√⊕⊙☉★✦χμσ0123456789';
const FONT_SIZE     = 14;
const FRAME_MS      = 110;   // ~9 fps — classic Matrix pace
const HISTO_ZONE    = 80;
const MAX_BIN       = 40;
const BIN_INCREMENT = 0.7;
const BIN_DECAY     = 0.002;
// Fade color matches navy-900 hero background
const FADE = 'rgba(7, 13, 26, 0.22)';

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
    let rainBottom   = 0;   // y where drops are captured (h1 bottom)
    let histoBase    = 0;   // y where histogram bars anchor (canvas bottom)
    let columns  = 0;
    let drops: number[] = [];
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

      rainBottom = hRect.bottom - wRect.top;          // h1 bottom edge
      histoBase  = rainBottom + HISTO_ZONE - 4;       // histogram baseline

      columns = Math.floor(canvasW / FONT_SIZE);
      bins    = new Float32Array(columns);

      // Start drops at random rows so they don't all land at once
      drops = Array.from({ length: columns }, () =>
        -Math.floor(Math.random() * (rainBottom / FONT_SIZE))
      );
    };

    const tick = (now: number) => {
      raf = requestAnimationFrame(tick);
      if (now - lastTick < FRAME_MS) return;
      lastTick = now;

      // Fade trail — covers only the rain zone (above rainBottom)
      ctx.fillStyle = FADE;
      ctx.fillRect(0, 0, canvasW, rainBottom);

      // Clear histogram zone each frame (bars are redrawn cleanly)
      ctx.clearRect(0, rainBottom, canvasW, HISTO_ZONE);

      ctx.font = `${FONT_SIZE}px ui-monospace, monospace`;
      ctx.textBaseline = 'top';
      ctx.fillStyle = '#e8dcc8';

      for (let i = 0; i < columns; i++) {
        const y = drops[i] * FONT_SIZE;
        if (y >= 0 && y < rainBottom) {
          const char = CHARS[Math.floor(Math.random() * CHARS.length)];
          ctx.fillText(char, i * FONT_SIZE, y);
        }

        // Drop reached the baseline — register hit, reset
        if (y >= rainBottom) {
          bins[i] = Math.min(bins[i] + BIN_INCREMENT, MAX_BIN);
          drops[i] = -Math.floor(Math.random() * 8);   // random delay before next drop
        } else {
          drops[i]++;
        }
      }

      // Bin decay
      for (let k = 0; k < columns; k++) bins[k] = Math.max(0, bins[k] - BIN_DECAY);

      // Histogram — bars grow upward from histoBase
      const binW = canvasW / columns;
      for (let k = 0; k < columns; k++) {
        if (bins[k] < 0.05) continue;
        const bh    = (bins[k] / MAX_BIN) * HISTO_ZONE;
        const alpha = 0.55 + (bins[k] / MAX_BIN) * 0.35;
        ctx.fillStyle = `rgba(232,220,200,${alpha})`;
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
        <span className="text-accent-teal">Academy</span>
      </h1>
      <canvas
        ref={canvasRef}
        style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}
        aria-hidden="true"
      />
    </div>
  );
}
