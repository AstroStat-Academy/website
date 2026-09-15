import React from 'react';
import { routes } from '../routes.js';
/* AstroStat Academy — full-site kit (Instrument Panel style).
   Chrome components: nav, footer, corner marks, rail modules.
   Styles live in css/kit-chrome.css (loaded via styles.css) — not in this file.
   Shared by all website pages. */

function Corners() {
  return (<>
    <span className="as-c as-tl"></span><span className="as-c as-tr"></span>
    <span className="as-c as-bl"></span><span className="as-c as-br"></span>
  </>);
}

function SiteNav({ active = 'home' }) {
  return (
    <header className="as-nav">
      <a className="as-brand" href="/" aria-label="AstroStat Academy home"><img src="/assets/logo-bone.svg" alt="" />AstroStat Academy</a>
      <nav className="as-nl" aria-label="Main navigation">
        {routes.map(n => <a key={n.id} href={n.path} className={n.id === active ? 'on' : ''} aria-current={n.id === active ? 'page' : undefined}>{n.label}</a>)}
      </nav>
    </header>
  );
}

function SiteFooter() {
  return (
    <footer className="as-foot">
      {/* no link list: the top nav is present on every page and never
          scrolls out of reach, so repeating it here bought nothing */}
      <span>© AstroStat Academy</span>
      <span>astrostat.academy</span>
    </footer>
  );
}

/* Left-rail section module. accent: 'blue' | 'red' */
/* Scanning LED matrix — a cols×rows grid with one cell lit, sweeping on a loop
   with a short fading trail. phase desyncs each instance. */
function RailMatrix({ accent, cols = 8, rows = 2, phase = 0, speed = 150 }) {
  const total = cols * rows;
  const [t, setT] = React.useState(phase);
  React.useEffect(() => {
    const id = setInterval(() => setT(v => v + 1), speed);
    return () => clearInterval(id);
  }, [speed]);
  const active = t % total;
  const color = accent === 'red' ? '#c8607a' : '#3b9be0';
  const cells = [];
  for (let i = 0; i < total; i++) {
    const dist = (active - i + total) % total;
    const op = dist === 0 ? 1 : dist === 1 ? 0.5 : dist === 2 ? 0.28 : 0.14;
    cells.push(<span key={i} className="as-mx-c" style={{ background: color, opacity: op }}></span>);
  }
  return <div className="as-mx" style={{ gridTemplateColumns: `repeat(${cols}, 1fr)` }}>{cells}</div>;
}

/* Left-rail section module. accent: 'blue' | 'red'.
   variant: 'number' (default) | 'glyph' | 'label' | 'tag' | 'matrix'. */
function Rail({ n, label, accent, variant = 'number', keyword, children }) {
  const r = accent === 'red';
  let idx;
  if (variant === 'matrix') {
    idx = <><RailMatrix accent={accent} phase={(parseInt(n, 10) || 0) * 5} /><div className={'l' + (r ? ' red' : '')}>{label}</div></>;
  } else if (variant === 'glyph') {
    idx = <><div className={'as-rx' + (r ? ' red' : '')}><span className="ring"></span></div><div className={'l' + (r ? ' red' : '')}>{label}</div></>;
  } else if (variant === 'label') {
    idx = <><div className={'as-rtick' + (r ? ' red' : '')}></div><div className={'l lg' + (r ? ' red' : '')}>{label}</div></>;
  } else if (variant === 'tag') {
    idx = <div className={'as-rtag' + (r ? ' red' : '')}><span className="sl">//</span> {keyword}</div>;
  } else {
    idx = <><div className="n">{n}</div><div className={'l' + (r ? ' red' : '')}>{label}</div></>;
  }
  return (
    <div className="as-rail">
      <div className="as-rail-idx">{idx}</div>
      <div className="as-rail-body">{children}</div>
    </div>
  );
}


export { Corners, SiteNav, SiteFooter, Rail, RailMatrix };
