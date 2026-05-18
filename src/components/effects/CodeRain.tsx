import { useEffect, useRef } from 'react';
import { canvas as colors } from '../../styles/tokens';

const CHARS = 'αβγδεζηθικλμνξπρστφχψωΣ∑∫∂∇∞≈±√⊕⊙☉★✦χμσ0123456789';
const FONT_SIZE = 16;
const FRAME_INTERVAL_MS = 110;

export default function CodeRain() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let columns = 0;
    let drops: number[] = [];
    let raf = 0;
    let lastTick = 0;

    const tick = (now: number) => {
      raf = requestAnimationFrame(tick);
      if (now - lastTick < FRAME_INTERVAL_MS) return;
      lastTick = now;

      ctx.fillStyle = colors.rainFadeAlt;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.font = `${FONT_SIZE}px ui-monospace, monospace`;
      ctx.textBaseline = 'top';

      for (let i = 0; i < columns; i++) {
        const char = CHARS[Math.floor(Math.random() * CHARS.length)];
        ctx.fillStyle = `rgba(${colors.shadowColorRgb}, 0.45)`;
        ctx.fillText(char, i * FONT_SIZE + 1, drops[i] * FONT_SIZE + 1);
        ctx.fillStyle = colors.charColor;
        ctx.fillText(char, i * FONT_SIZE, drops[i] * FONT_SIZE);
        if (drops[i] * FONT_SIZE > canvas.height && Math.random() > 0.975) drops[i] = 0;
        drops[i]++;
      }
    };

    const init = (w: number, h: number) => {
      canvas.width = w;
      canvas.height = h;
      columns = Math.floor(w / FONT_SIZE);
      drops = Array.from({ length: columns }, () => (Math.random() * h) / FONT_SIZE);
    };

    // Measure from the parent section, not the canvas itself, since the canvas
    // offsetWidth/Height may lag behind CSS when first inserted into the DOM.
    // canvas.parentElement is an <astro-island> wrapper with no dimensions;
    // walk up to the first ancestor that has a real height.
    const container = (): HTMLElement => {
      let el: HTMLElement = canvas;
      while (el.parentElement) {
        el = el.parentElement;
        if (el.offsetWidth > 0 && el.offsetHeight > 0) return el;
      }
      return document.documentElement;
    };

    const tryStart = () => {
      const el = container();
      const w = el.offsetWidth;
      const h = el.offsetHeight;
      if (w > 0 && h > 0) {
        init(w, h);
        raf = requestAnimationFrame(tick);
      } else {
        requestAnimationFrame(tryStart);
      }
    };

    requestAnimationFrame(tryStart);

    const onResize = () => {
      const el = container();
      const w = el.offsetWidth;
      const h = el.offsetHeight;
      if (w > 0 && h > 0) init(w, h);
    };
    window.addEventListener('resize', onResize);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', onResize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none' }}
      aria-hidden="true"
    />
  );
}
