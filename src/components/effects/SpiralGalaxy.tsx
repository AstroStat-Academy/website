import React, { useEffect, useRef } from 'react';

// ── Physics constants ─────────────────────────────────────────────────────
const PITCH  = 0.30;         // logarithmic spiral pitch
const INCL   = Math.PI / 4;  // 45° inclination
const COS_I  = Math.cos(INCL);
const V_MAX  = 0.00014;      // outer flat rotation speed (rad/frame)
const R_CORE = 0.13;         // core radius (normalised 0–1)
const G_FRAC = 0.40;         // galaxy radius as fraction of min(W,H)

const omega   = (r: number) => V_MAX / Math.sqrt(r * r + R_CORE * R_CORE);
const spiralA = (r: number, arm: number) => -Math.log(Math.max(r, 0.02)) / PITCH + arm * Math.PI;
const gauss   = () => Math.sqrt(-2 * Math.log(1 - Math.random())) * Math.cos(2 * Math.PI * Math.random());

export type GalaxyLayer = 'bulge' | 'ob' | 'arm' | 'hii' | 'dust' | 'disk';

interface Particle {
  r: number; th: number; dth: number;
  sz: number; col: string; a: number;
  type: GalaxyLayer;
  isGas: boolean; gR: number;
}

function buildGalaxy(): Particle[] {
  const mobile = window.innerWidth < 768;
  const q = mobile ? 0.35 : 1.0;
  const ps: Particle[] = [];

  const add = (
    r: number, th: number, sz: number,
    h: number, s: number, l: number, a: number,
    type: GalaxyLayer, isGas = false, gR = 0,
  ) => ps.push({
    r, th, dth: omega(r), sz,
    col: `${Math.round(h)},${Math.round(s)}%,${Math.round(l)}%`,
    a, type, isGas, gR,
  });

  // Bulge
  for (let i = 0; i < Math.round(400 * q); i++) {
    const r = Math.min(Math.abs(gauss()) * 0.15, 0.95);
    add(r, Math.random() * 2 * Math.PI,
      0.4 + Math.random() * 1.6,
      28 + Math.random() * 28, 45 + Math.random() * 45, 72 + Math.random() * 25,
      0.5 + Math.random() * 0.5, 'bulge');
  }

  // Two spiral arms
  for (let arm = 0; arm < 2; arm++) {
    for (let i = 0; i < Math.round(700 * q); i++) {
      const r   = 0.06 + Math.pow(Math.random(), 0.65) * 0.91;
      const hot = Math.random() < 0.13;
      const sig = hot ? 0.07 : 0.14 + r * 0.18;
      add(r, spiralA(r, arm) + gauss() * sig,
        hot ? 1.0 + Math.random() * 2.2 : 0.3 + Math.random() * 0.9,
        hot ? 205 + Math.random() * 35  : 162 + Math.random() * 75,
        hot ? 80 : 30 + Math.random() * 50,
        hot ? 88 + Math.random() * 10   : 60 + Math.random() * 28,
        hot ? 0.7 + Math.random() * 0.3 : 0.22 + Math.random() * 0.5,
        hot ? 'ob' : 'arm');
    }
    // HII gas clouds
    for (let i = 0; i < Math.round(60 * q); i++) {
      const r = 0.10 + Math.pow(Math.random(), 0.75) * 0.72;
      add(r, spiralA(r, arm) + gauss() * 0.04,
        0, 342 + Math.random() * 22, 85, 65,
        0.06 + Math.random() * 0.10, 'hii', true, 0.030 + Math.random() * 0.055);
    }
    // Dust lanes
    for (let i = 0; i < Math.round(40 * q); i++) {
      const r = 0.12 + Math.pow(Math.random(), 0.75) * 0.62;
      add(r, spiralA(r, arm) + 0.09 + gauss() * 0.03,
        0, 18, 55, 12,
        0.04 + Math.random() * 0.09, 'dust', true, 0.022 + Math.random() * 0.038);
    }
  }

  // Diffuse disk — exponential radial profile
  for (let i = 0; i < Math.round(3000 * q); i++) {
    const h = 0.32;
    const r = Math.min(-h * Math.log(1 - Math.random() * 0.98) + 0.03, 0.97);
    add(r, Math.random() * 2 * Math.PI,
      0.25 + Math.random() * 0.6,
      40 + Math.random() * 50, 12 + Math.random() * 30, 52 + Math.random() * 30,
      0.18 + Math.random() * 0.38, 'disk');
  }

  return ps;
}

interface Props {
  enabled?: Partial<Record<GalaxyLayer, boolean>>;
}

export default function SpiralGalaxy({ enabled = {} }: Props) {
  const rootRef   = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const psRef     = useRef<Particle[]>([]);
  const rafRef    = useRef(0);
  const enabledRef = useRef(enabled);
  enabledRef.current = enabled;

  useEffect(() => {
    const root   = rootRef.current!;
    const canvas = canvasRef.current!;
    const ctx    = canvas.getContext('2d')!;

    psRef.current = buildGalaxy();

    const on = (type: GalaxyLayer) => enabledRef.current[type] !== false;

    const onToggle = (e: Event) => {
      enabledRef.current = (e as CustomEvent).detail;
    };
    window.addEventListener('galaxy-enabled', onToggle);

    const resize = () => {
      const dpr = window.devicePixelRatio || 1;
      const w = root.offsetWidth, h = root.offsetHeight;
      canvas.width  = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      canvas.style.width  = w + 'px';
      canvas.style.height = h + 'px';
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    const draw = () => {
      const W = root.offsetWidth, H = root.offsetHeight;
      const cx = W / 2, cy = H / 2;
      const GR = Math.min(W, H) * G_FRAC;

      ctx.clearRect(0, 0, W, H);

      // Disk glow
      const dg = ctx.createRadialGradient(cx, cy, 0, cx, cy, GR);
      dg.addColorStop(0,   'rgba(5,12,45,0.28)');
      dg.addColorStop(0.6, 'rgba(3,6,22,0.10)');
      dg.addColorStop(1,   'rgba(0,0,0,0)');
      ctx.fillStyle = dg;
      ctx.beginPath();
      ctx.ellipse(cx, cy, GR, GR * COS_I, 0, 0, 2 * Math.PI);
      ctx.fill();

      // Gas (back→front by depth)
      const gasPs = psRef.current
        .filter(p => p.isGas && on(p.type))
        .sort((a, b) => Math.sin(a.th) - Math.sin(b.th));
      for (const p of gasPs) {
        const sx = cx + p.r * Math.cos(p.th) * GR;
        const sy = cy + p.r * Math.sin(p.th) * COS_I * GR;
        const alpha = p.a * (0.4 + 0.6 * ((Math.sin(p.th) + 1) * 0.5));
        ctx.beginPath();
        ctx.arc(sx, sy, p.gR * GR, 0, 2 * Math.PI);
        ctx.fillStyle = `hsla(${p.col},${alpha.toFixed(3)})`;
        ctx.fill();
      }

      // Stars
      for (const p of psRef.current) {
        if (p.isGas || !on(p.type)) continue;
        const sx = cx + p.r * Math.cos(p.th) * GR;
        const sy = cy + p.r * Math.sin(p.th) * COS_I * GR;
        const alpha = p.a * (0.35 + 0.65 * ((Math.sin(p.th) + 1) * 0.5));
        if (p.sz > 1.0) {
          ctx.beginPath();
          ctx.arc(sx, sy, p.sz * 2.8, 0, 2 * Math.PI);
          ctx.fillStyle = `hsla(${p.col},${(alpha * 0.15).toFixed(3)})`;
          ctx.fill();
        }
        ctx.beginPath();
        ctx.arc(sx, sy, p.sz, 0, 2 * Math.PI);
        ctx.fillStyle = `hsla(${p.col},${alpha.toFixed(3)})`;
        ctx.fill();
      }

      // Bulge glow overlay
      if (on('bulge')) {
        const BR = GR * 0.17;
        const bg = ctx.createRadialGradient(cx, cy, 0, cx, cy, BR);
        bg.addColorStop(0,    'rgba(255,225,150,0.55)');
        bg.addColorStop(0.45, 'rgba(255,195,100,0.13)');
        bg.addColorStop(1,    'rgba(255,165,70,0)');
        ctx.fillStyle = bg;
        ctx.beginPath();
        ctx.ellipse(cx, cy, BR, BR * COS_I, 0, 0, 2 * Math.PI);
        ctx.fill();
      }
    };

    const frame = () => {
      for (const p of psRef.current) p.th += p.dth;
      draw();
      rafRef.current = requestAnimationFrame(frame);
    };

    resize();
    rafRef.current = requestAnimationFrame(frame);
    window.addEventListener('resize', resize);
    return () => {
      cancelAnimationFrame(rafRef.current);
      window.removeEventListener('resize', resize);
      window.removeEventListener('galaxy-enabled', onToggle);
    };
  }, []);

  return (
    <div ref={rootRef} style={{ width: '100%', height: '100%' }}>
      <canvas ref={canvasRef} style={{ display: 'block' }} aria-hidden="true" />
    </div>
  );
}
