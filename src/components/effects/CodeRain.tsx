import { useEffect, useRef } from 'react';

const CHARS = 'αβγδεζηθικλμνξπρστφχψωΣ∑∫∂∇∞≈±√⊕⊙☉★✦χμσ0123456789';

export default function CodeRain() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const FONT_SIZE = 16;
    const FRAME_INTERVAL_MS = 60;
    let columns = 0;
    let drops: number[] = [];

    const resize = () => {
      const w = canvas.offsetWidth;
      const h = canvas.offsetHeight;
      if (w === 0 || h === 0) return;
      canvas.width = w;
      canvas.height = h;
      columns = Math.floor(w / FONT_SIZE);
      drops = Array.from(
        { length: columns },
        () => (Math.random() * h) / FONT_SIZE,
      );
    };

    resize();
    window.addEventListener('resize', resize);

    let lastTick = 0;
    let raf = 0;

    const tick = (now: number) => {
      raf = requestAnimationFrame(tick);
      if (now - lastTick < FRAME_INTERVAL_MS) return;
      lastTick = now;

      ctx.fillStyle = 'rgba(7, 13, 26, 0.07)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      ctx.font = `${FONT_SIZE}px ui-monospace, "JetBrains Mono", monospace`;
      ctx.fillStyle = '#22ff22';
      ctx.textBaseline = 'top';

      for (let i = 0; i < columns; i++) {
        const char = CHARS[Math.floor(Math.random() * CHARS.length)];
        ctx.fillText(char, i * FONT_SIZE, drops[i] * FONT_SIZE);

        if (drops[i] * FONT_SIZE > canvas.height && Math.random() > 0.975) {
          drops[i] = 0;
        }
        drops[i]++;
      }
    };

    raf = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', resize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full -z-10 pointer-events-none"
      aria-hidden="true"
    />
  );
}
