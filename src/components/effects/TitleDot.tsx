import { useEffect, useRef } from 'react';

const LINE1 = 'AstroStat';
const LINE2 = 'Academy';
const DOT_SPEED = 1;  // path units per frame
const DOT_R = 3;
const EDGE_STEP = 2;  // sample every N px for edge detection

const HISTO_ZONE = 80;   // extra canvas height (px) for histogram
const BINS       = 60;   // histogram column count
const MAX_BIN    = 40;   // bin cap — maps to full bar height
const MAX_PARTICLES = 60;
const SPAWN_EVERY   = 4;   // frames between spawns
const DECAY_RATE    = 0.005;
const BIN_INCREMENT = 0.6;
const BIN_DECAY     = 0.001;

export default function TitleDot() {
  const wrapRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const wrap = wrapRef.current;
    const canvas = canvasRef.current;
    if (!wrap || !canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let raf = 0;
    let progress = 0;
    let path: Array<{ x: number; y: number }> = [];
    let canvasW = 0, canvasH = 0;
    let landingY = 0;
    let bins = new Float32Array(BINS);
    let binW = 0;
    type Particle = { x: number; y: number; vx: number; vy: number; life: number };
    let particles: Particle[] = [];
    let frameCount = 0;

    const build = () => {
      const h1 = wrap.querySelector('h1') as HTMLElement;
      if (!h1) return;

      const dpr = window.devicePixelRatio || 1;
      const wRect = wrap.getBoundingClientRect();
      const hRect = h1.getBoundingClientRect();
      canvasW = wRect.width;
      canvasH = wRect.height + HISTO_ZONE;   // extend downward

      canvas.width  = Math.ceil(canvasW * dpr);
      canvas.height = Math.ceil(canvasH * dpr);
      canvas.style.width  = canvasW + 'px';
      canvas.style.height = canvasH + 'px';
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      landingY = hRect.bottom - wRect.top + HISTO_ZONE - 4;  // histogram baseline
      binW     = canvasW / BINS;
      bins     = new Float32Array(BINS);     // reset on resize

      // Offscreen canvas: rasterise the title text to detect letter outlines
      const off = document.createElement('canvas');
      off.width = Math.ceil(canvasW * dpr);
      off.height = Math.ceil(canvasH * dpr);
      const oc = off.getContext('2d')!;
      oc.setTransform(dpr, 0, 0, dpr, 0, 0);

      const cs = window.getComputedStyle(h1);
      const fontSize = parseFloat(cs.fontSize);
      oc.font = `700 ${fontSize}px ${cs.fontFamily}`;
      oc.fillStyle = '#fff';
      oc.textAlign = 'center';
      oc.textBaseline = 'top';

      const relTop = hRect.top - wRect.top;
      const cx = hRect.left - wRect.left + hRect.width / 2;
      const lh = fontSize * 1.25; // leading-tight

      oc.fillText(LINE1, cx, relTop);
      oc.fillText(LINE2, cx, relTop + lh);

      // Collect edge pixels: filled with at least one empty neighbour
      const { data } = oc.getImageData(0, 0, off.width, off.height);
      const pw = off.width, ph = off.height;
      const S = EDGE_STEP;

      const opaque = (x: number, y: number) =>
        x >= 0 && y >= 0 && x < pw && y < ph && data[(y * pw + x) * 4 + 3] > 64;

      const pts: Array<{ x: number; y: number }> = [];
      for (let y = 0; y < ph; y += S) {
        for (let x = 0; x < pw; x += S) {
          if (!opaque(x, y)) continue;
          if (!opaque(x - S, y) || !opaque(x + S, y) || !opaque(x, y - S) || !opaque(x, y + S)) {
            pts.push({ x: x / dpr, y: y / dpr });
          }
        }
      }

      if (pts.length < 2) return;

      // Spatial grid for fast nearest-neighbour lookup
      const CELL = 12;
      const cols = Math.ceil(canvasW / CELL) + 1;
      const grid = new Map<number, number[]>();
      pts.forEach((p, i) => {
        const k = Math.floor(p.y / CELL) * cols + Math.floor(p.x / CELL);
        if (!grid.has(k)) grid.set(k, []);
        grid.get(k)!.push(i);
      });

      // Walk all edge pixels in nearest-neighbour order
      const visited = new Uint8Array(pts.length);
      const ordered: Array<{ x: number; y: number }> = [pts[0]];
      visited[0] = 1;

      for (let iter = 1; iter < pts.length; iter++) {
        const p = ordered[ordered.length - 1];
        const gx = Math.floor(p.x / CELL);
        const gy = Math.floor(p.y / CELL);
        let bestD = Infinity, bestI = -1;

        // Expand search radius before giving up — handles gaps between letters
        for (let r = 2; r <= 10 && bestI < 0; r += 2) {
          for (let dy = -r; dy <= r; dy++) {
            for (let dx = -r; dx <= r; dx++) {
              const cell = grid.get((gy + dy) * cols + (gx + dx));
              if (!cell) continue;
              for (const i of cell) {
                if (visited[i]) continue;
                const q = pts[i];
                const d = (q.x - p.x) ** 2 + (q.y - p.y) ** 2;
                if (d < bestD) { bestD = d; bestI = i; }
              }
            }
          }
        }

        // Global fallback: scan all remaining points (handles large cross-word gaps)
        if (bestI < 0) {
          bestD = Infinity;
          for (let i = 0; i < pts.length; i++) {
            if (visited[i]) continue;
            const q = pts[i];
            const d = (q.x - p.x) ** 2 + (q.y - p.y) ** 2;
            if (d < bestD) { bestD = d; bestI = i; }
          }
        }

        if (bestI < 0) break;
        visited[bestI] = 1;
        ordered.push(pts[bestI]);
      }

      // Fill long jumps (between disconnected letter parts) with straight-line steps
      const smooth: Array<{ x: number; y: number }> = [];
      for (let i = 0; i < ordered.length; i++) {
        const a = ordered[i];
        const b = ordered[(i + 1) % ordered.length];
        smooth.push(a);
        const dist = Math.hypot(b.x - a.x, b.y - a.y);
        if (dist > 12) {
          const steps = Math.round(dist / 3);
          for (let s = 1; s < steps; s++) {
            smooth.push({ x: a.x + (b.x - a.x) * s / steps, y: a.y + (b.y - a.y) * s / steps });
          }
        }
      }

      path = smooth;
      progress = 0;
    };

    const tick = () => {
      raf = requestAnimationFrame(tick);
      if (path.length < 2) return;

      ctx.clearRect(0, 0, canvasW, canvasH);

      // dot position
      progress = (progress + DOT_SPEED) % path.length;
      const i = Math.floor(progress);
      const t = progress - i;
      const a = path[i];
      const b = path[(i + 1) % path.length];
      const dotX = a.x + (b.x - a.x) * t;
      const dotY = a.y + (b.y - a.y) * t;

      // spawn
      frameCount++;
      if (frameCount % SPAWN_EVERY === 0 && particles.length < MAX_PARTICLES) {
        particles.push({
          x:    dotX + (Math.random() - 0.5) * 1,
          y:    dotY,
          vx:   (Math.random() - 0.5) * 0.2,
          vy:   0.4 + Math.random() * 0.3,
          life: 1,
        });
      }

      // update + draw particles
      for (let j = particles.length - 1; j >= 0; j--) {
        const p = particles[j];
        p.x  += p.vx;
        p.y  += p.vy;
        p.vy += 0.01;
        p.life -= DECAY_RATE;

        if (p.y >= landingY) {
          const binIdx = Math.min(Math.floor(p.x / binW), BINS - 1);
          if (binIdx >= 0) bins[binIdx] = Math.min(bins[binIdx] + BIN_INCREMENT, MAX_BIN);
          particles.splice(j, 1);
          continue;
        }

        if (p.life > 0) {
          ctx.beginPath();
          ctx.arc(p.x, p.y, 1.2, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(232,220,200,${p.life * 0.85})`;
          ctx.fill();
        }
      }

      // dot (on top)
      ctx.beginPath();
      ctx.arc(dotX, dotY, DOT_R, 0, Math.PI * 2);
      ctx.shadowBlur = 10;
      ctx.shadowColor = '#e8dcc8';
      ctx.fillStyle = '#e8dcc8';
      ctx.fill();
      ctx.shadowBlur = 0;

      // bin decay
      for (let k = 0; k < BINS; k++) bins[k] = Math.max(0, bins[k] - BIN_DECAY);

      // histogram — bars grow upward from landingY
      for (let k = 0; k < BINS; k++) {
        if (bins[k] < 0.05) continue;
        const bh    = (bins[k] / MAX_BIN) * HISTO_ZONE;
        const alpha = 0.55 + (bins[k] / MAX_BIN) * 0.35;
        ctx.fillStyle = `rgba(232,220,200,${alpha})`;
        ctx.fillRect(k * binW + 0.5, landingY - bh, binW - 1, bh);
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
      <h1 className="text-5xl md:text-7xl font-bold leading-tight">
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
