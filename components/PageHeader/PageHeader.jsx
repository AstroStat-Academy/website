import { Corners } from '../../src/components/SiteChrome.jsx';
import { CodeRainBG } from '../../src/components/Effects.jsx';

/* Default page header: framed Hackathons card with a channel bar, code rain,
   title on the left, and an empty right panel unless `aside` is supplied. */
export function PageHeader({
  section, kicker, title, lede, accent = 'blue', variant,
  channel = '// AstroStat Academy', status, aside = null, children,
}) {
  // The existing home wordmark is the only explicit alternative layout.
  if (variant === 'home') return (
    <div className="as-hero-l">
      <div className="as-tagline">{kicker}<span className="as-cur"></span></div>
      <h1 className="as-title">{title.split('\n').map((line, i) => <span key={i}>{i > 0 && <br />}{line}</span>)}</h1>
      <div className="as-lede">{lede}</div>
      {children}
    </div>
  );

  const family = ['blue', 'red', 'teal'].includes(accent) ? accent : 'blue';
  return (
    <header className="as-panel page-header" style={{ '--ph-accent': `var(--${family})` }}>
      <Corners />
      <div className="ph-con-head">
        <span className="as-tagline">{channel} · {section}</span>
        {status && <span className="ph-con-coord">{status}</span>}
      </div>
      <div className="ph-split">
        <div className="ph-split-l">
          <div className="as-rain"><CodeRainBG colorToken={`--${family}-rgb`} alpha={0.2} /></div>
          <div className="ph-split-in">
            <div className="ph-con-num">// {section}{kicker && <> <b>— {kicker}</b></>}</div>
            <h1 className="ph-con-title">{title}</h1>
            {lede && <p className="ph-con-lede">{lede}</p>}
            {children}
          </div>
        </div>
        <div className="ph-split-r" aria-hidden={aside == null ? true : undefined}>{aside}</div>
      </div>
    </header>
  );
}
