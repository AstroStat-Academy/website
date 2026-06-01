import React, { useEffect, useRef } from 'react';
import { canvas as colors } from '../../styles/tokens';

const CHARS = 'αβγδεζηθικλμνξπρστφχψωΣ∑∫∂∇∞≈±√⊕⊙☉★✦χμσ0123456789';
const FONT_SIZE     = 14;
const FRAME_MS      = 110;
const HISTO_ZONE    = 120;
const WIDGET_BELOW  = 16;  // px below histogram base where the pill sits
const MAX_BIN       = 40;
const BIN_INCREMENT = 5.0;
const BIN_DECAY     = 0.25;
const MEAN_LERP     = 0.40;

// Pill control geometry
const PILL_H        = 6;    // capsule height (straddles baseline)
const GRIP_W        = 6;    // end-tab width

const SIGMA_DEFAULT = 0.20; // σ as fraction of canvas width (≈ columns/5)

const TS_LEN        = 100;   // number of time series points
const AR_PHI        = 0.92;  // AR(1) mean-reversion coefficient
const AR_NOISE      = 0.4;   // noise scale
const TOGGLE_H      = 16;    // button height
const TOGGLE_BW     = 36;    // each button width
const TOGGLE_GAP    = 6;     // gap between buttons
const TOGGLE_W      = TOGGLE_BW * 2 + TOGGLE_GAP;  // total span (for hit-test centre)
const TOGGLE_ABOVE  = 10;    // px above graph area
const GRAPH_OFFSET  = TOGGLE_ABOVE + TOGGLE_H + 8;  // px below rainBottom where graph starts

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
  const viewRef       = useRef<'hist' | 'ts'>('hist');
  const toggleXRef    = useRef(0);
  const toggleYRef    = useRef(0);
  const tsMuRef       = useRef(0);     // AR(1) mean offset [-0.5, 0.5]
  const tsSigmaRef    = useRef(0.3);   // AR(1) noise scale [0.05, 0.8]
  const tsPillBaseRef = useRef(0);     // y of ts pill baseline (histoBase)

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
    let tsData: Float32Array = new Float32Array(TS_LEN);
    let tsHead  = 0;
    let tsAR    = 0;

    const build = () => {
      const h1 = wrap.querySelector('h1') as HTMLElement;
      if (!h1) return;

      const dpr   = window.devicePixelRatio || 1;
      const wRect = wrap.getBoundingClientRect();
      const hRect = h1.getBoundingClientRect();

      canvasW = wRect.width;
      canvasH = wRect.height + GRAPH_OFFSET + HISTO_ZONE + WIDGET_BELOW;

      canvas.width  = Math.ceil(canvasW * dpr);
      canvas.height = Math.ceil(canvasH * dpr);
      canvas.style.width  = canvasW + 'px';
      canvas.style.height = canvasH + 'px';
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      const span = h1.querySelector('span') as HTMLElement;
      rainTop    = (span ? span.getBoundingClientRect().top : hRect.top) - wRect.top;
      rainBottom = hRect.bottom - wRect.top;
      histoBase  = rainBottom + GRAPH_OFFSET + HISTO_ZONE - 4;

      histoBaseRef.current  = histoBase;
      tsPillBaseRef.current = histoBase;
      canvasWRef.current   = canvasW;
      toggleXRef.current = canvasW / 2;
      toggleYRef.current = rainBottom + TOGGLE_ABOVE + TOGGLE_H / 2;

      columns = Math.floor(canvasW / FONT_SIZE);
      bins    = new Float32Array(columns);
      tsData = new Float32Array(TS_LEN);
      tsHead = 0;
      tsAR   = 0;

      const rainRows = Math.ceil((histoBase - rainTop) / FONT_SIZE);
      drops = Array.from({ length: columns }, () =>
        rainTop / FONT_SIZE - Math.floor(Math.random() * rainRows)
      );
      jitter = Array.from({ length: columns }, () => 0.85 + Math.random() * 0.30);
    };

    const drawToggle = (now: number) => {
      const cx = toggleXRef.current;
      const cy = toggleYRef.current;
      const hh = TOGGLE_H / 2;
      const r  = 3;
      const pulse = 0.5 + 0.5 * Math.sin((now / 2000) * Math.PI * 2);

      // Left button (hist) — x: cx - GAP/2 - BW  to  cx - GAP/2
      const lx = cx - TOGGLE_GAP / 2 - TOGGLE_BW;
      // Right button (ts)  — x: cx + GAP/2         to  cx + GAP/2 + BW
      const rx = cx + TOGGLE_GAP / 2;

      const drawBtn = (x: number, label: string, active: boolean) => {
        const glow = active ? 5 + pulse * 12 : 0;
        ctx.save();
        if (active) {
          ctx.shadowColor = `rgba(${colors.shadowColorRgb}, 1)`;
          ctx.shadowBlur  = glow;
        }
        // Fill
        ctx.fillStyle = active
          ? `rgba(${colors.shadowColorRgb}, ${0.18 + pulse * 0.08})`
          : 'rgba(255,255,255,0.04)';
        ctx.beginPath();
        ctx.roundRect(x, cy - hh, TOGGLE_BW, TOGGLE_H, r);
        ctx.fill();
        // Border
        ctx.strokeStyle = active
          ? `rgba(${colors.shadowColorRgb}, ${0.7 + pulse * 0.3})`
          : `rgba(${colors.shadowColorRgb}, 0.25)`;
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.roundRect(x, cy - hh, TOGGLE_BW, TOGGLE_H, r);
        ctx.stroke();
        ctx.restore();
        // Label
        ctx.font = '9px ui-monospace, monospace';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillStyle = active
          ? `rgba(${colors.shadowColorRgb}, ${0.9 + pulse * 0.1})`
          : `rgba(${colors.shadowColorRgb}, 0.3)`;
        ctx.fillText(label, x + TOGGLE_BW / 2, cy);
        ctx.textAlign = 'left';
      };

      drawBtn(lx, '▮▮▮', viewRef.current === 'hist');
      drawBtn(rx, '〜',  viewRef.current === 'ts');
    };

    const tick = (now: number) => {
      raf = requestAnimationFrame(tick);
      if (now - lastTick < FRAME_MS) return;
      lastTick = now;

      // Smooth-follow mean
      smoothMeanRef.current += (meanXRef.current - smoothMeanRef.current) * MEAN_LERP;
      const smoothMean = smoothMeanRef.current;

      // Fade trail (transparency, not black paint, so page background shows through)
      ctx.save();
      ctx.globalCompositeOperation = 'destination-out';
      ctx.fillStyle = colors.rainFade;
      ctx.fillRect(0, rainTop, canvasW, rainBottom - rainTop);
      ctx.restore();

      // Histogram + widget zone → full clear each frame so widget moves crisp
      ctx.clearRect(0, rainBottom, canvasW, canvasH - rainBottom);

      ctx.save();
      ctx.beginPath();
      ctx.rect(0, rainTop, canvasW, histoBase - rainTop);
      ctx.clip();

      ctx.font = `${FONT_SIZE}px ui-monospace, monospace`;
      ctx.textBaseline = 'top';

      for (let i = 0; i < columns; i++) {
        const y = drops[i] * FONT_SIZE;
        if (y >= 0 && y < histoBase) {
          const char = CHARS[Math.floor(Math.random() * CHARS.length)];
          ctx.fillStyle = colors.charColor;
          ctx.fillText(char, i * FONT_SIZE, y);
        }
        if (y >= histoBase) {
          drops[i] = -Math.floor(Math.random() * 8);
        } else {
          drops[i] += jitter[i];
        }
      }

      ctx.restore();

      // Always advance AR(1) buffer so ts view is warm on switch
      tsAR = AR_PHI * tsAR + tsMuRef.current + (Math.random() - 0.5) * tsSigmaRef.current;
      tsData[tsHead % TS_LEN] = tsAR;
      tsHead++;

      if (viewRef.current === 'hist') {
        // Histogram grows independently from a Gaussian centered on smoothMean
        const meanCol = smoothMean * columns;
        const sigma   = sigmaFracRef.current * columns;
        for (let k = 0; k < columns; k++) {
          const g = Math.exp(-0.5 * ((k - meanCol) / sigma) ** 2);
          bins[k] = Math.max(0, bins[k] + g * BIN_INCREMENT - BIN_DECAY);
        }

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
      } else {
        // Time series — draw ordered circular buffer as a line
        const ordered: number[] = [];
        const start = tsHead >= TS_LEN ? tsHead : 0;
        const count = Math.min(tsHead, TS_LEN);
        for (let i = 0; i < count; i++) ordered.push(tsData[(start + i) % TS_LEN]);

        if (ordered.length >= 2) {
          let minV = ordered[0], maxV = ordered[0];
          for (const v of ordered) { if (v < minV) minV = v; if (v > maxV) maxV = v; }
          const range = maxV - minV || 1;
          const graphTop = histoBase - HISTO_ZONE;
          const graphH   = HISTO_ZONE;

          ctx.save();
          ctx.strokeStyle = `rgba(${colors.shadowColorRgb}, 0.30)`;
          ctx.lineWidth = 2.5;
          ctx.beginPath();
          ordered.forEach((v, i) => {
            const x = (i / (TS_LEN - 1)) * canvasW;
            const y = graphTop + graphH - ((v - minV) / range) * (graphH - 4) - 2;
            i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
          });
          ctx.stroke();
          ctx.restore();

          ctx.save();
          ctx.strokeStyle = `rgba(${colors.charColorRgb}, 0.85)`;
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          ordered.forEach((v, i) => {
            const x = (i / (TS_LEN - 1)) * canvasW;
            const y = graphTop + graphH - ((v - minV) / range) * (graphH - 4) - 2;
            i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
          });
          ctx.stroke();
          ctx.restore();
        }
      }

      // ── Pill control (hist mode only) ──────────────────────────────────────
      if (viewRef.current === 'hist') {
      const mx       = smoothMean * canvasW;
      const fwhmHalf = sigmaFracRef.current * canvasW;
      const lx       = Math.max(GRIP_W + 2, mx - fwhmHalf);
      const rx       = Math.min(canvasW - GRIP_W - 2, mx + fwhmHalf);
      const pillTop  = histoBase + WIDGET_BELOW - PILL_H / 2;
      const r        = PILL_H / 2;

      // Pulse: 0→1→0 on a 2 s cycle
      const pulse = 0.5 + 0.5 * Math.sin((now / 2000) * Math.PI * 2);

      // Pill outline
      ctx.strokeStyle = `rgba(${colors.shadowColorRgb}, 0.45)`;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.roundRect(lx, pillTop, rx - lx, PILL_H, r);
      ctx.stroke();

      // Draw a glowing chunky grip at position x
      const drawGrip = (x: number) => {
        const glow = 6 + pulse * 14;
        ctx.save();
        ctx.shadowColor = `rgba(${colors.shadowColorRgb}, 1)`;
        ctx.shadowBlur  = glow;
        ctx.fillStyle   = `rgba(${colors.shadowColorRgb}, ${0.85 + pulse * 0.15})`;
        ctx.beginPath();
        ctx.roundRect(x - GRIP_W / 2, pillTop - 5, GRIP_W, PILL_H + 10, 3);
        ctx.fill();
        ctx.restore();
      };

      drawGrip(lx);
      drawGrip(rx);

      // Mean dot — glowing circle
      const dotR  = 6;
      const dotGlow = 6 + pulse * 16;
      ctx.save();
      ctx.shadowColor = `rgba(${colors.shadowColorRgb}, 1)`;
      ctx.shadowBlur  = dotGlow;
      ctx.fillStyle   = `rgba(${colors.shadowColorRgb}, ${0.85 + pulse * 0.15})`;
      ctx.beginPath();
      ctx.arc(mx, pillTop + PILL_H / 2, dotR, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
      } // end hist-only pill control

      // Toggle widget — always visible
      drawToggle(now);
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
    const fwhmHalf = sigmaFracRef.current * canvasWRef.current;
    const lx       = Math.max(GRIP_W + 2, mx - fwhmHalf);
    const rx       = Math.min(canvasWRef.current - GRIP_W - 2, mx + fwhmHalf);
    const hb       = histoBaseRef.current;
    const pillTop  = hb + WIDGET_BELOW - PILL_H / 2;

    const dotR = 6;
    // Mean dot hit
    if (Math.abs(x - mx) <= dotR + 6 && Math.abs(y - (pillTop + PILL_H / 2)) <= dotR + 6) return 'move';
    // Grips (centered on lx / rx)
    if (Math.abs(x - lx) <= GRIP_W / 2 + 6 && y >= pillTop - 10 && y <= pillTop + PILL_H + 10) return 'left';
    if (Math.abs(x - rx) <= GRIP_W / 2 + 6 && y >= pillTop - 10 && y <= pillTop + PILL_H + 10) return 'right';
    // Pill body
    if (x >= lx && x <= rx && y >= pillTop - 4 && y <= pillTop + PILL_H + 4) return 'move';
    return 'none';
  };

  const hitToggle = (x: number, y: number): 'hist' | 'ts' | null => {
    const cx = toggleXRef.current;
    const cy = toggleYRef.current;
    const hh = TOGGLE_H / 2;
    if (y < cy - hh - 4 || y > cy + hh + 4) return null;
    const lx = cx - TOGGLE_GAP / 2 - TOGGLE_BW;
    const rx = cx + TOGGLE_GAP / 2;
    if (x >= lx - 4 && x <= lx + TOGGLE_BW + 4) return 'hist';
    if (x >= rx - 4 && x <= rx + TOGGLE_BW + 4) return 'ts';
    return null;
  };

  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const tv = hitToggle(x, y);
    if (tv) {
      viewRef.current = tv;
      return;
    }

    const hit = getHit(x, y);
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
      const v = Math.max(0, Math.min(x / cw, 1));
      meanXRef.current = v;
      smoothMeanRef.current = v;
      e.currentTarget.style.cursor = 'grabbing';
    } else if (dragMode.current === 'left' || dragMode.current === 'right') {
      const mx   = smoothMeanRef.current * cw;
      const dist = Math.abs(x - mx);
      sigmaFracRef.current = Math.max(0.05, Math.min(0.45, dist / cw));
    } else {
      if (hitToggle(x, y) !== null) {
        e.currentTarget.style.cursor = 'pointer';
      } else {
        const hit = getHit(x, y);
        e.currentTarget.style.cursor =
          hit === 'move'  ? 'grab'      :
          hit !== 'none'  ? 'ew-resize' : 'default';
      }
    }
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLCanvasElement>) => {
    dragMode.current = 'none';
    e.currentTarget.style.cursor = 'default';
  };

  return (
    <div ref={wrapRef} style={{ position: 'relative', paddingBottom: (GRAPH_OFFSET + HISTO_ZONE + WIDGET_BELOW) + 'px', display: 'inline-block' }}>
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
