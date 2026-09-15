import React from 'react';
/* Shared effects for the full-site directions.
   CodeRainBG  — configurable falling Greek/maths glyph rain.
   HeroWidget  — the dual-mode hero: ∩ Gaussian histogram (drag mean / σ)
                 ⟷ 〜 AR(1) time series. Toggle restored (∩ / 〜). */

const EXP_RAIN = 'αβγδεζηθικλμνξπρστφχψωΛΦΨΩΣ∑∏∫∮∂∇∆√∝∞≈≠≡≤≥±×÷∈∉⊂∪∩∅∴⊕⊗⊙ℓℏℝℕ☉★0123456789';

function hexToRgb(hex) {
  const m = hex.replace('#', '');
  return [0, 2, 4].map(i => parseInt(m.slice(i, i + 2), 16)).join(', ');
}

function CodeRainBG({ color = '#8c0527', colorToken, alpha = 0.5, font = 16, frame = 110 }) {
  const ref = React.useRef(null);
  React.useEffect(() => {
    const canvas = ref.current, ctx = canvas.getContext('2d');
    const rgb = colorToken ? getComputedStyle(canvas).getPropertyValue(colorToken).trim() : hexToRgb(color);
    let cols = 0, drops = [];
    const init = () => {
      const w = canvas.parentElement.clientWidth, h = canvas.parentElement.clientHeight;
      canvas.width = w; canvas.height = h;
      cols = Math.floor(w / font);
      drops = Array.from({ length: cols }, () => (Math.random() * h) / font);
      ctx.fillStyle = '#000'; ctx.fillRect(0, 0, w, h); // initial paint
    };
    const tick = () => {
      ctx.fillStyle = 'rgba(0,0,0,0.12)'; ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.font = font + 'px ui-monospace, monospace'; ctx.textBaseline = 'top';
      for (let i = 0; i < cols; i++) {
        ctx.fillStyle = `rgba(${rgb}, ${alpha})`;
        ctx.fillText(EXP_RAIN[(Math.random() * EXP_RAIN.length) | 0], i * font, drops[i] * font);
        if (drops[i] * font > canvas.height && Math.random() > 0.975) drops[i] = 0;
        drops[i]++;
      }
    };
    init();
    // Pre-roll a few frames so glyphs are visible immediately, then animate.
    for (let i = 0; i < 40; i++) tick();
    const id = setInterval(tick, frame);
    const ro = new ResizeObserver(() => { init(); for (let i = 0; i < 40; i++) tick(); }); ro.observe(canvas.parentElement);
    return () => { clearInterval(id); ro.disconnect(); };
  }, [color, colorToken, alpha, font, frame]);
  return <canvas ref={ref} aria-hidden="true"
    style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none' }} />;
}

const TIME_SERIES_CONTROLS = {
  phi: { initial: 0.95, min: 0.91, max: 0.99 },
  noise: { initial: 0.8, min: 0.4, max: 1.2 },
};

/* Dual-mode hero widget. mode: 'hist' (Beta distribution) | 'ts' (AR(1)).
   Drag the figure in hist mode: centre = mean (α:β skew), grips = concentration. */
function HeroWidget({ accent = '#0465ad', data = '#8c0527', w = 440, h = 190, toggleStyle = 'pill', mode: cMode, onMode, onReadout, hideToggle = false, hideGrips = false, alpha: cAlpha, beta: cBeta, phi: cPhi, noise: cNoise }) {
  const [iMode, setIMode] = React.useState('ts');
  const mode = cMode ?? iMode;
  const setMode = onMode ?? setIMode;
  const ref = React.useRef(null);
  const st = React.useRef({ alpha: 2, beta: 2, phi: TIME_SERIES_CONTROLS.phi.initial, noise: TIME_SERIES_CONTROLS.noise.initial, drag: 'none', series: [] });
  // Controlled params: external sliders write here without re-running the effect.
  if (cAlpha != null) st.current.alpha = cAlpha;
  if (cBeta != null) st.current.beta = cBeta;
  if (cPhi != null) st.current.phi = cPhi;
  if (cNoise != null) st.current.noise = cNoise;

  React.useEffect(() => {
    const canvas = ref.current, ctx = canvas.getContext('2d');
    const dpr = window.devicePixelRatio || 1;
    canvas.width = w * dpr; canvas.height = h * dpr;
    canvas.style.width = w + 'px'; canvas.style.height = h + 'px';
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const aRGB = hexToRgb(accent), dRGB = hexToRgb(data);
    const BASE = h - 42;
    const gauss = () => (Math.random() + Math.random() + Math.random() + Math.random() - 2);
    // Start with the same parameters and variation as the running series.
    if (!st.current.series.length) {
      let v = 0; const arr = [];
      for (let i = 0; i < 90; i++) { v = st.current.phi * v + st.current.noise * gauss(); arr.push(v); }
      st.current.series = arr;
    }
    let raf = 0, last = 0, phase = 0;
    const draw = (now) => {
      ctx.clearRect(0, 0, w, h);
      if (mode === 'hist') {
        // Ease the *displayed* α/β toward their targets so the shape morphs slowly
        // when dragged or slid, instead of snapping. Smaller ease = slower glide.
        if (st.current.dAlpha == null) { st.current.dAlpha = st.current.alpha; st.current.dBeta = st.current.beta; }
        const ease = 0.16;
        st.current.dAlpha += (st.current.alpha - st.current.dAlpha) * ease;
        st.current.dBeta += (st.current.beta - st.current.dBeta) * ease;
        // Beta(α, β) density over [0,1] — the histogram x-axis.
        const alpha = st.current.dAlpha, beta = st.current.dBeta, cols = 28, bw = w / cols, amp = BASE * 0.9, wig = now / 900;
        const dens = []; let peak = 1e-9;
        for (let k = 0; k < cols; k++) {
          const xf = (k + 0.5) / cols;
          const d = Math.pow(xf, alpha - 1) * Math.pow(1 - xf, beta - 1);
          dens.push(d); if (d > peak) peak = d;
        }
        for (let k = 0; k < cols; k++) {
          const g = dens[k] / peak;                 // normalised height 0..1
          const bh = Math.max(0, g * amp + Math.sin(wig + k * 0.7) * 5 * g);
          ctx.fillStyle = `rgba(${aRGB}, 0.28)`; ctx.fillRect(k * bw + 1.5, BASE - bh + 2, bw - 1, bh);
          ctx.fillStyle = `rgba(${dRGB}, ${0.5 + g * 0.4})`; ctx.fillRect(k * bw + 0.5, BASE - bh, bw - 1, bh);
        }
        if (!hideGrips) {
          // Draggable mean / ±σ control bracket beneath the bars.
          const s = alpha + beta, mean = alpha / s;
          const sd = Math.sqrt((alpha * beta) / (s * s * (s + 1)));
          const mx = mean * w, half = sd * w, lx = Math.max(6, mx - half), rx = Math.min(w - 6, mx + half);
          const py = BASE + 18, pulse = 0.5 + 0.5 * Math.sin(now / 2000 * Math.PI * 2);
          ctx.strokeStyle = `rgba(${aRGB}, 0.45)`; ctx.lineWidth = 1.5;
          ctx.beginPath(); ctx.roundRect(lx, py - 3, rx - lx, 6, 3); ctx.stroke();
          const grip = (x) => { ctx.save(); ctx.shadowColor = `rgba(${aRGB},0.5)`; ctx.shadowBlur = 3 + pulse * 4;
            ctx.fillStyle = `rgba(${aRGB}, ${0.65 + pulse * 0.1})`; ctx.beginPath(); ctx.roundRect(x - 3, py - 8, 6, 16, 3); ctx.fill(); ctx.restore(); };
          grip(lx); grip(rx);
          ctx.save(); ctx.shadowColor = `rgba(${aRGB},0.5)`; ctx.shadowBlur = 3 + pulse * 4;
          ctx.fillStyle = `rgba(${aRGB}, ${0.65 + pulse * 0.1})`; ctx.beginPath(); ctx.arc(mx, py, 6, 0, Math.PI * 2); ctx.fill(); ctx.restore();
        }
      } else {
        // Live AR(1): stream a new sample each frame so the series visibly runs.
        const phi = st.current.phi, noise = st.current.noise;
        const arr = st.current.series;
        const lastV = arr.length ? arr[arr.length - 1] : 0;
        arr.push(phi * lastV + noise * gauss());
        while (arr.length > 90) arr.shift();
        const n = arr.length;
        // Locked y-axis: keep the original reference scale so the axis no longer
        // breathes with the params. Now σ and φ genuinely move the line relative to μ —
        // small σ hugs the mean, large σ (or φ→1) swings wide and clips.
        const REF_SD = 0.5 / Math.sqrt(1 - 0.92 * 0.92);
        const div = 3.2 * REF_SD, midY = BASE / 2 + 12, ampY = BASE / 2 - 6;
        const PW = w - 6; // plot width
        const yOf = (v) => midY - Math.max(-1, Math.min(1, v / div)) * ampY;
        // μ baseline — the level the AR(1) regresses toward (μ = 0 here).
        ctx.save();
        ctx.strokeStyle = `rgba(${aRGB},0.5)`; ctx.lineWidth = 1; ctx.setLineDash([4, 4]);
        ctx.beginPath(); ctx.moveTo(0, midY); ctx.lineTo(PW, midY); ctx.stroke();
        ctx.restore();
        ctx.beginPath(); ctx.moveTo(0, BASE + 6);
        arr.forEach((v, i) => ctx.lineTo((i / (n - 1)) * PW, yOf(v)));
        ctx.lineTo(PW, BASE + 6); ctx.closePath();
        const grd = ctx.createLinearGradient(0, 0, 0, BASE); grd.addColorStop(0, `rgba(${dRGB},0.22)`); grd.addColorStop(1, `rgba(${dRGB},0)`);
        ctx.fillStyle = grd; ctx.fill();
        ctx.strokeStyle = `rgba(${dRGB},0.9)`; ctx.lineWidth = 2; ctx.beginPath();
        arr.forEach((v, i) => { const x = (i / (n - 1)) * PW, y = yOf(v); i ? ctx.lineTo(x, y) : ctx.moveTo(x, y); });
        ctx.stroke();
        const ly = yOf(arr[n - 1]);
        ctx.fillStyle = `rgba(${aRGB},0.9)`; ctx.beginPath(); ctx.arc(PW - 2, ly, 4, 0, Math.PI * 2); ctx.fill();
      }
    };
    draw(performance.now());
    if (onReadout) onReadout(st.current.alpha, st.current.beta);
    const drawId = setInterval(() => draw(performance.now()), 70);

    const pos = (e) => { const r = canvas.getBoundingClientRect(); return (e.clientX - r.left); };
    const params = () => { const { alpha, beta } = st.current, s = alpha + beta;
      return { mean: alpha / s, sd: Math.sqrt((alpha * beta) / (s * s * (s + 1))), s }; };
    const down = (e) => { if (mode !== 'hist' || hideGrips) return; const x = pos(e), { mean, sd } = params();
      const mx = mean * w, lx = mx - sd * w, rx = mx + sd * w;
      if (Math.abs(x - mx) < 12) st.current.drag = 'move';
      else if (Math.abs(x - lx) < 10 || Math.abs(x - rx) < 10) st.current.drag = 'spread';
      canvas.setPointerCapture(e.pointerId); };
    const move = (e) => { const x = pos(e), d = st.current.drag; if (d === 'none') return;
      let { mean, s } = params();
      if (d === 'move') { mean = Math.max(0.1, Math.min(0.9, x / w)); }
      else if (d === 'spread') { const sd = Math.max(0.04, Math.min(0.42, Math.abs(x - mean * w) / w));
        s = Math.max(1.4, Math.min(40, mean * (1 - mean) / (sd * sd) - 1)); }
      const alpha = Math.max(0.4, Math.min(8, mean * s)), beta = Math.max(0.4, Math.min(8, (1 - mean) * s));
      st.current.alpha = alpha; st.current.beta = beta;
      if (onReadout) onReadout(alpha, beta);
      canvas.style.cursor = 'grabbing'; };
    const up = () => { st.current.drag = 'none'; canvas.style.cursor = (mode === 'hist' && !hideGrips) ? 'grab' : 'default'; };
    canvas.addEventListener('pointerdown', down); canvas.addEventListener('pointermove', move); canvas.addEventListener('pointerup', up);
    return () => { clearInterval(drawId); canvas.removeEventListener('pointerdown', down); canvas.removeEventListener('pointermove', move); canvas.removeEventListener('pointerup', up); };
  }, [mode, accent, data, w, h]);

  return (
    <div style={{ position: 'relative', width: w, maxWidth: '100%' }}>
      <canvas ref={ref} style={{ cursor: (mode === 'hist' && !hideGrips) ? 'grab' : 'default', touchAction: 'none', display: 'block' }} />
      {!hideToggle && (
      <div className={'hw-toggle hw-toggle-' + toggleStyle}>
        <button className={mode === 'ts' ? 'on' : ''} onClick={() => setMode('ts')} title="Time series" aria-label="Time-series view">〜</button>
        <button className={mode === 'hist' ? 'on' : ''} onClick={() => setMode('hist')} title="Beta distribution" aria-label="Distribution view">∩</button>
      </div>
      )}
    </div>
  );
}

/* Small draggable parameter slider (μ, σ …) — instrument styled, label-light. */
function ParamSlider({ label, value, min, max, onChange }) {
  const ref = React.useRef(null);
  const frac = Math.max(0, Math.min(1, (value - min) / (max - min)));
  const setFromX = (clientX) => {
    const r = ref.current.getBoundingClientRect();
    const f = Math.max(0, Math.min(1, (clientX - r.left) / r.width));
    onChange(min + f * (max - min));
  };
  const down = (e) => {
    setFromX(e.clientX);
    const mv = (ev) => setFromX(ev.clientX);
    const up = () => { window.removeEventListener('pointermove', mv); window.removeEventListener('pointerup', up); };
    window.addEventListener('pointermove', mv); window.addEventListener('pointerup', up);
  };
  return (
    <div className="ps">
      <span className="ps-l">{label}</span>
      <div className="ps-track" ref={ref} onPointerDown={down}>
        <div className="ps-fill" style={{ width: (frac * 100) + '%' }}></div>
        <div className="ps-knob" style={{ left: (frac * 100) + '%' }}></div>
      </div>
    </div>
  );
}

/* Standalone toggle — tiny, icon-only. Sliders carry the parameter values. */
function HeroControls({ mode, onMode }) {
  return (
    <div className="hwc-mini">
      <button className={mode === 'ts' ? 'on' : ''} onClick={() => onMode('ts')} title="Time series" aria-label="Time series">〜</button>
      <button className={mode === 'hist' ? 'on' : ''} onClick={() => onMode('hist')} title="Distribution" aria-label="Distribution">∩</button>
    </div>
  );
}

/* AstroTerminal — a fake LLM-on-a-Linux-shell streaming pseudo-statistical
   blather, typed line by line with a blinking caret, then looping.
   Used in the home page's Problem band. */
function AstroTerminal({ accent = '#c8607a', w = 380, h = 210, fs = 'clamp(8px, 1.15vw, 12px)' }) {
  const SCRIPT = [
    { t: 'in', s: '$ astro-llm "is p significant?"' },
    { t: 'sys', s: '▸ loading posterior weights … ok' },
    { t: 'out', s: 'Fitting a hierarchical model to your' },
    { t: 'out', s: 'noise. Bootstrapping 10,000 resamples…' },
    { t: 'ok', s: '✓ p = 0.049 → "basically significant"' },
    { t: 'warn', s: '⚠ assumptions: not checked' },
    { t: 'warn', s: '⚠ multiple comparisons: ignored' },
    { t: 'out', s: 'Recommendation: ship it. Looks right.' },
    { t: 'in', s: '$ _' },
  ];
  const [ln, setLn] = React.useState(0);
  const [ch, setCh] = React.useState(0);
  React.useEffect(() => {
    const cur = SCRIPT[ln];
    if (!cur) { const r = setTimeout(() => { setLn(0); setCh(0); }, 2200); return () => clearTimeout(r); }
    if (ch < cur.s.length) { const id = setTimeout(() => setCh(ch + 1), 26); return () => clearTimeout(id); }
    const id = setTimeout(() => { setLn(ln + 1); setCh(0); }, cur.t === 'in' ? 420 : 240);
    return () => clearTimeout(id);
  }, [ln, ch]);
  const colorFor = (t) => t === 'in' ? '#fbf6ec' : t === 'ok' ? '#3fb9b9' : t === 'warn' ? accent : t === 'sys' ? 'rgba(251,246,236,.45)' : 'rgba(251,246,236,.72)';
  const shown = SCRIPT.slice(0, ln);
  const typing = SCRIPT[ln];
  return (
    <div style={{ width: w, maxWidth: '100%', height: h, border: '1px solid rgba(251,246,236,.24)', background: '#040404', fontFamily: 'ui-monospace,monospace', fontSize: fs, lineHeight: 1.55, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 10px', borderBottom: '1px solid rgba(251,246,236,.16)' }}>
        <span style={{ width: 8, height: 8, borderRadius: '50%', background: accent, opacity: .8 }}></span>
        <span style={{ fontSize: 10, letterSpacing: '.12em', textTransform: 'uppercase', color: 'rgba(251,246,236,.4)' }}>astro-llm — bash</span>
      </div>
      <div style={{ padding: '10px 12px', flex: 1, overflow: 'hidden' }}>
        {shown.map((l, i) => <div key={i} style={{ color: colorFor(l.t), whiteSpace: 'pre' }}>{l.s}</div>)}
        {typing && <div style={{ color: colorFor(typing.t), whiteSpace: 'pre' }}>{typing.s.slice(0, ch)}<span style={{ display: 'inline-block', width: 7, height: 13, background: accent, verticalAlign: '-2px', animation: 'atb 1s steps(1) infinite' }}></span></div>}
      </div>
      <style>{`@keyframes atb{50%{opacity:0}}`}</style>
    </div>
  );
}


export { CodeRainBG, HeroWidget, HeroControls, ParamSlider, AstroTerminal, TIME_SERIES_CONTROLS };
