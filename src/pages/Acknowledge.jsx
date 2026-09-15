import { PageLayout } from '../components/PageLayout.jsx';
import { PageHeader } from '../../components/PageHeader/PageHeader.jsx';
import React from 'react';
import { SiteNav, SiteFooter, Corners, Rail } from '../components/SiteChrome.jsx';

function CreditedPapers() {
  const [state, setState] = React.useState({ status: 'loading', papers: [], updated: null });
  React.useEffect(() => {
    let live = true;
    (async () => {
      const tryFetch = async (u) => {
        const r = await fetch(u);
        if (!r.ok) throw new Error(String(r.status));
        const data = await r.json();
        if (!Array.isArray(data.papers) || !Number.isFinite(Date.parse(data.updated))) throw new Error('Invalid paper list');
        return data;
      };
      let data = null;
      try { data = await tryFetch('/api/papers'); } catch {
        try { data = { ...await tryFetch('/assets/papers.json'), stale: true }; } catch { data = null; }
      }
      if (!live) return;
      if (!data) setState({ status: 'error', papers: [], updated: null });
      else setState({ status: 'ok', papers: data.papers || [], updated: data.updated, stale: data.stale });
    })();
    return () => { live = false; };
  }, []);

  const byYear = React.useMemo(() => {
    const g = new Map();
    for (const p of state.papers) {
      const y = p.year || '—';
      if (!g.has(y)) g.set(y, []);
      g.get(y).push(p);
    }
    return [...g.entries()].sort((a, b) => Number(b[0]) - Number(a[0]));
  }, [state.papers]);

  const authorLine = (a = []) => {
    if (!a.length) return '';
    const short = a.slice(0, 3).join('; ');
    return a.length > 3 ? short + ' et al.' : short;
  };
  const stamp = state.updated
    ? new Date(state.updated).toISOString().slice(0, 10)
    : null;

  return (
    <div>
      <div className="as-eyebrow" style={{ display: 'block' }}>Papers crediting us</div>
      <p className="as-p" style={{ maxWidth: 640, marginTop: 8 }}></p>

      {state.status === 'loading' && (
        <div className="as-mono" style={{ fontSize: 12, color: 'var(--fg3)', marginTop: 20 }}>// fetching…</div>
      )}
      {state.status === 'error' && (
        <div className="as-mono" style={{ fontSize: 12, color: 'var(--fg3)', marginTop: 20 }}>// paper list unavailable</div>
      )}
      {state.status === 'ok' && state.stale && (
        <p className="as-mono" style={{ fontSize: 12, color: 'var(--fg3)', marginTop: 20 }}>Showing the last available list.</p>
      )}
      {state.status === 'ok' && !state.papers.length && (
        <div className="as-mono" style={{ fontSize: 12, color: 'var(--fg3)', marginTop: 20 }}>// no papers indexed yet</div>
      )}

      {state.status === 'ok' && state.papers.length > 0 && (
        <div style={{ marginTop: 24, maxWidth: 760 }}>
          <div className="as-mono" style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, letterSpacing: '.06em', color: 'var(--fg3)', borderBottom: '1px solid var(--border)', paddingBottom: 8 }}>
            <span>{state.papers.length} paper{state.papers.length === 1 ? '' : 's'}</span>
            {stamp && <span>updated {stamp}</span>}
          </div>
          {byYear.map(([year, list]) => (
            <div key={year} style={{ display: 'grid', gridTemplateColumns: '64px minmax(0,1fr)', gap: 16, paddingTop: 18 }}>
              <div className="as-mono" style={{ fontSize: 13, color: 'var(--blue)', paddingTop: 2 }}>{year}</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
                {list.map(p => (
                  <div key={p.bibcode} style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                    <a href={p.url} target="_blank" rel="noopener noreferrer" style={{ fontSize: 15, fontWeight: 600, lineHeight: 1.4, color: 'var(--fg1)', textDecoration: 'none' }}>{p.title}</a>
                    <div style={{ fontSize: 13, color: 'var(--fg3)', lineHeight: 1.5 }}>{authorLine(p.authors)}</div>
                    <div className="as-mono" style={{ display: 'flex', flexWrap: 'wrap', gap: 14, fontSize: 11, letterSpacing: '.04em', color: 'var(--fg4)' }}>
                      {p.journal && <span>{p.journal}</span>}
                      {p.arxiv && <span>arXiv:{p.arxiv}</span>}
                      {typeof p.citations === 'number' && <span>{p.citations} cited</span>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* Acknowledge — how to credit the Academy in published work. */
function PageAcknowledge() {
  const ACK = 'We wish to thank the AstroStat Academy for providing training on the analysis methods adopted in this work.';
  const [copyStatus, setCopyStatus] = React.useState('idle');
  const ct = React.useRef(null);
  const copy = async () => {
    let copied = false;
    try {
      await navigator.clipboard.writeText(ACK);
      copied = true;
    } catch {
      const field = document.createElement('textarea');
      field.value = ACK;
      field.style.position = 'fixed';
      field.style.opacity = '0';
      document.body.appendChild(field);
      field.select();
      try { copied = document.execCommand('copy'); } catch { /* Show manual-copy guidance below. */ }
      field.remove();
    }
    setCopyStatus(copied ? 'copied' : 'error');
    clearTimeout(ct.current);
    ct.current = setTimeout(() => setCopyStatus('idle'), 2000);
  };
  React.useEffect(() => () => clearTimeout(ct.current), []);

  const acknowledgement = (
    <div className="acknowledgement">
      <div className="as-eyebrow">Suggested acknowledgement</div>
      <blockquote className="ack-quote">
        <span className="ack-quote-mark" aria-hidden="true">“</span>
        {ACK}
      </blockquote>
      <span className="ph-cta-wrap">
        <span className={'ph-toast' + (copyStatus !== 'idle' ? ' show' : '')} role="status" aria-hidden={copyStatus === 'idle'}>
          {copyStatus === 'error' ? 'Please select and copy the text above.' : 'Text copied to clipboard'}
        </span>
        <button type="button" className="as-btn solid" onClick={copy}>Copy text</button>
      </span>
    </div>
  );

  return (
    <div className="as-page">
      <SiteNav active="acknowledge" />
      <PageLayout header={<PageHeader section="Acknowledge us" kicker="crediting the Academy" title={'Crediting\nAstroStat Academy'} lede={<>Helped your research? <span className="b">Acknowledge</span> us in your work.</>} aside={acknowledgement} />}>
        <div className="as-panel"><Corners />
          <Rail n="06" label="Credit" variant="matrix">
            <CreditedPapers />
          </Rail>
        </div>
      </PageLayout>
      <SiteFooter />
    </div>
  );
}

export { PageAcknowledge };
