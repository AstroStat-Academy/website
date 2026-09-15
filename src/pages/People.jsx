import React from 'react';
import { SiteNav, SiteFooter } from '../components/SiteChrome.jsx';
import { PageHeader } from '../../components/PageHeader/PageHeader.jsx';
/* Personnel terminal. The roster and profiles are loaded from assets/people/. */

/* ── data ─────────────────────────────────────────────────────────────── */
const TP_BASE = '/assets/people';
const TP_ROLE = {
  councellors: 'Council',
  advisors:    'Advisory board',
  lecturers:   'Lecturer',
  TAs:         'Teaching assistant',
};
const TP_ORDER = ['councellors', 'advisors', 'lecturers', 'TAs'];

function tpParseRoster(text) {
  const out = []; let cur = null;
  text.split(/\r?\n/).forEach(raw => {
    const line = raw.replace(/#.*$/, '');
    if (!line.trim()) return;
    const sec = line.match(/^([A-Za-z][\w-]*):\s*(\[\s*\])?\s*$/);
    if (sec) { cur = { role: sec[1], slugs: [] }; out.push(cur); return; }
    const it = line.match(/^\s*-\s*(.+?)\s*$/);
    if (it && cur) cur.slugs.push(it[1]);
  });
  return out;
}
function tpParsePerson(text) {
  const m = text.match(/^\s*---\s*\n([\s\S]*?)\n---\s*\n?([\s\S]*)$/);
  const meta = { links: {} }; let body = text;
  if (m) {
    body = m[2] || '';
    let inLinks = false;
    m[1].split(/\r?\n/).forEach(line => {
      if (!line.trim()) return;
      const indented = /^\s/.test(line);
      const kv = line.match(/^\s*([\w-]+):\s*(.*)$/);
      if (!kv) return;
      const key = kv[1], val = kv[2].trim();
      if (key === 'links' && val === '') { inLinks = true; return; }
      if (inLinks && indented) { if (val) meta.links[key] = val; return; }
      inLinks = false;
      if (val !== '') meta[key] = val;
    });
  }
  meta.bio = body.trim();
  return meta;
}
async function tpLoad() {
  const roster = tpParseRoster(await fetch(`${TP_BASE}/people.yml`).then(r => { if (!r.ok) throw new Error('people.yml'); return r.text(); }));
  const flat = [];
  await Promise.all(roster.map(async ({ role, slugs }) => {
    await Promise.all(slugs.map(async (slug, i) => {
      try {
        const md = await fetch(`${TP_BASE}/${role}/${slug}.md`).then(r => { if (!r.ok) throw new Error(`${role}/${slug}.md`); return r.text(); });
        const p = tpParsePerson(md);
        flat.push({
          id: `${role}/${slug}`, roleKey: role, role: TP_ROLE[role] || role,
          name: p.name || slug, inst: p.affiliation || '', title: p.title || '',
          bio: p.bio || '', links: p.links || {}, photoUrl: `${TP_BASE}/${role}/${p.photo || slug + '.jpg'}`,
          order: TP_ORDER.indexOf(role) * 100 + i,
        });
      } catch (e) { console.warn('[term]', e.message); }
    }));
  }));
  flat.sort((a, b) => a.order - b.order);
  return flat;
}

function tpInitials(name) {
  const c = String(name).replace(/^(Dr\.|Prof\.|Mr\.|Ms\.)\s+/i, '').split(/\s+/);
  return (c[0][0] + (c[c.length - 1][0] || '')).toUpperCase();
}
function tpSurname(name) {
  const c = String(name).replace(/^(Dr\.|Prof\.|Mr\.|Ms\.)\s+/i, '').split(/\s+/);
  return c[c.length - 1].toUpperCase();
}
function tpHex(id) {
  let h = 0; for (const ch of id) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  return ('0000' + (h & 0xffff).toString(16).toUpperCase()).slice(-4);
}

/* ── styles ───────────────────────────────────────────────────────────── */

function TermCSS() { return null; } /* styles now in css/kit-terminal.css */

/* ── visual id ────────────────────────────────────────────────────────── */
function TPhoto({ p }) {
  const [bad, setBad] = React.useState(false);
  const show = p.photoUrl && !bad;
  return (
    <div className="tphoto">
      {show
        ? <img src={p.photoUrl} alt={p.name} onError={() => setBad(true)} />
        : <div className="tphoto-lost"><span className="tpi">{tpInitials(p.name)}</span><span className="tpl">NO VISUAL · ARCHIVE</span></div>}
      <div className="tphoto-hold"></div>
      <div className="tphoto-cap">VISUAL ID // {tpHex(p.id)}</div>
    </div>
  );
}

/* ── dossier (boot → file) ────────────────────────────────────────────── */
function Dossier({ p, big, power, closable }) {
  const [phase, setPhase] = React.useState('boot');
  React.useEffect(() => {
    setPhase('boot');
    const t = setTimeout(() => setPhase('show'), 620);
    return () => clearTimeout(t);
  }, [p.id]);

  const bootLines = [
    `> QUERY PERSONNEL :: ${tpSurname(p.name)}`,
    '> UPLINK ASTROSTAT-NET ........ OK',
    '> DECRYPT DOSSIER 0x' + tpHex(p.id) + ' .... OK',
    '> RENDER VISUAL ID',
  ];

  return (
    <div className={'crt' + (power ? ' power' : '')}>
      <span className="as-c as-tl"></span><span className="as-c as-tr"></span>
      <span className="as-c as-bl"></span><span className="as-c as-br"></span>
      <div className="crt-screen">
        <div className="crt-inner">
          {phase === 'boot' && (
            <div className="boot">
              {bootLines.map((l, i) => (
                <div key={i} className="bl" style={{ animationDelay: `${i * 0.12}s` }}>
                  {l.replace(/OK$/, '')}{/OK$/.test(l) && <span className="ok">OK</span>}
                </div>
              ))}
            </div>
          )}
          <div className={'dsr-wrap' + (phase === 'show' ? ' show' : '')}>
            <div className={'dsr' + (big ? ' big' : '')}>
              <div className="dsr-top">
                <span>{big ? 'MU-TH-UR 6000 // PERSONNEL FILE' : 'PERSONNEL FILE // ASTROSTAT-NET'}</span>
                <span className="dsr-rec"><i></i> REC</span>
              </div>
              <div className="dsr-body">
                <TPhoto p={p} />
                <div>
                  <div className="dsr-id">FILE 0x{tpHex(p.id)} — CLEARANCE 3</div>
                  <h3 className="dsr-name">{p.name}</h3>
                  <div className="dsr-role">{p.role}{p.title ? ` · ${p.title}` : ''}</div>
                  <div className="dsr-aff">{p.inst}</div>
                  <div className="dsr-field">
                    <span className="lbl">FIELD OF INTEREST</span>
                    {p.bio ? <p>{p.bio}</p> : <p className="none">// no record on file</p>}
                  </div>
                  {p.links && Object.keys(p.links).length > 0 && (
                    <div className="dsr-field dsr-links">
                      <span className="lbl">UPLINK</span>
                      <div className="dsr-linkrow">
                        {Object.entries(p.links).map(([k, v]) => {
                          const href = /^https?:\/\//.test(v) ? v : `https://${v}`;
                          return <a key={k} className="dsr-link" href={href} target="_blank" rel="noreferrer" onClick={(e) => e.stopPropagation()}>▸ {k.toUpperCase()}</a>;
                        })}
                      </div>
                    </div>
                  )}
                </div>
              </div>
              <div className="dsr-foot">
                <span>STATUS: ACTIVE · NODE ASX-{tpHex(p.id).slice(0, 2)}</span>
                {closable && <span className="dsr-hint">◄ CLICK SCREEN TO CLOSE</span>}
                <span className="dsr-cur">READY</span>
              </div>
            </div>
          </div>
        </div>
        <div className="crt-sweep"></div>
        <div className="crt-scan"></div>
        <div className="crt-vig"></div>
        <div className="crt-flick"></div>
      </div>
    </div>
  );
}

function Standby() {
  return (
    <div className="crt">
      <span className="as-c as-tl"></span><span className="as-c as-tr"></span>
      <span className="as-c as-bl"></span><span className="as-c as-br"></span>
      <div className="crt-screen">
        <div className="crt-inner">
          <div className="stby">
            <div className="ring"></div>
            <div className="big">ASTROSTAT-NET // STANDBY</div>
            <div className="hint">◄ SELECT PERSONNEL TO OPEN FILE</div>
          </div>
        </div>
        <div className="crt-sweep"></div>
        <div className="crt-scan"></div>
        <div className="crt-vig"></div>
        <div className="crt-flick"></div>
      </div>
    </div>
  );
}

/* ── shared roster ────────────────────────────────────────────────────── */
function Roster({ people, selId, onSelect, cols = 1 }) {
  const groups = [];
  people.forEach((p, i) => {
    let g = groups.find(x => x.role === p.roleKey);
    if (!g) { g = { role: p.roleKey, label: p.role, items: [] }; groups.push(g); }
    g.items.push({ ...p, n: i + 1 });
  });
  return (
    <div className="tp-roster">
      {groups.map(g => (
        <React.Fragment key={g.role}>
          <div className="tp-rgrp">{g.label}</div>
          <div className="tp-rgroup" style={{ gridTemplateColumns: `repeat(${cols}, minmax(0,1fr))` }}>
            {g.items.map(p => (
              <button key={p.id} className={'tp-item' + (p.id === selId ? ' on' : '')} onClick={(e) => { e.stopPropagation(); onSelect(p.id); }}>
                <span className="tp-idx">{String(p.n).padStart(2, '0')}</span>
                <div style={{ minWidth: 0, flex: 1 }}>
                  <div className="tp-nm">{p.name}</div>
                  <div className="tp-af">{p.title || p.role}</div>
                </div>
                <span className="tp-go">OPEN ▸</span>
              </button>
            ))}
          </div>
        </React.Fragment>
      ))}
    </div>
  );
}

function useRoster() {
  const [people, setPeople] = React.useState(null);
  React.useEffect(() => { tpLoad().then(setPeople).catch(e => { console.warn(e); setPeople([]); }); }, []);
  return people;
}

function TermShell({ lede, children }) {
  return (
    <div className="as-page">
      <TermCSS />
      <SiteNav active="people" />
      <main id="main-content" className="as-wrap">
        <PageHeader section="People" kicker="who we are" title={'Personnel\nterminal'} lede={lede || 'Select a name to open their file.'} />
        <section className="as-panel page-content people-content" aria-label="Personnel roster and dossier">
          {children}
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}


function People() {
  const people = useRoster();
  const [sel, setSel] = React.useState(null);
  const p = people && people.find(x => x.id === sel);
  return (
    <TermShell>
      <div onClick={() => p && setSel(null)} style={{ paddingBottom: 40 }}>
        <div className="people-console" style={{ display: 'grid', gridTemplateColumns: '0.92fr 1.12fr', gap: 26, marginTop: 22, alignItems: 'stretch' }}>
          <div style={{ minWidth: 0 }}>
            {people === null ? <p className="pp-inst">// loading…</p> : <Roster people={people} selId={sel} onSelect={setSel} cols={2} />}
          </div>
          <div className="people-display" style={{ minHeight: 600, position: 'sticky', top: 16 }} onClick={(e) => e.stopPropagation()}>
            {p ? <Dossier p={p} key={p.id} /> : <Standby />}
          </div>
        </div>
        </div>
    </TermShell>
  );
}


export { People };
