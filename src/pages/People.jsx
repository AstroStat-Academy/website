import { PageLayout } from '../components/PageLayout.jsx';
import React from 'react';
import { SiteNav, SiteFooter, Rail, Corners } from '../components/SiteChrome.jsx';
import { PageHeader } from '../../components/PageHeader/PageHeader.jsx';
import { schools } from '../data/schools.js';
/* Personnel terminal. The roster and profiles are loaded from assets/people/. */

/* ── data ─────────────────────────────────────────────────────────────── */
const TP_BASE = '/assets/people';
const TP_ROLE = {
  councellors: 'Council',
  advisors:    'Advisory board',
  lecturers:   'Lecturer',
  TAs:         'Teaching assistant',
  guests:      'Invited',
  partners:    'Organizing partner',
};
const TP_ORDER = ['councellors', 'advisors', 'lecturers', 'TAs', 'guests', 'partners'];

/* ── page structure ───────────────────────────────────────────────────
   Two tiers. The Administration Board is a standing body whose details we
   keep current; everyone below it has worked with us at some point and
   their record is a snapshot of that collaboration. Every capacity a
   collaborator served in — lecturer, TA, invited, organizer — is a tab in one
   switch rather than a section of its own, so a new kind never costs a new
   heading and the reader never scrolls to find out a list is empty. */
const TP_BOARD_GROUPS = ['councellors', 'advisors'];
const TP_EDUCATOR_KINDS = ['lecturers', 'TAs', 'guests'];
const TP_PARTNER_KINDS = ['partners'];
/* Every kind of collaborator is a tab in one switch — teaching and organizing
   are different contributions, but they are the same question ("who worked
   with us, in what capacity"), so they belong in one control, not two lists.
   The order is by size and expectation, not TP_ORDER's seniority ranking:
   that governs the tiers, where rank is the point; here the reader is picking
   a list, so the biggest list leads. */
const TP_COLLAB_KINDS = ['TAs', 'lecturers', 'guests', 'partners'];
/* Tabs offered whether or not anyone holds them: the set of capacities is
   part of the page's structure, not a product of who happens to be on file. */
const TP_COLLAB_ALWAYS = TP_COLLAB_KINDS;
/* What the selected tab means, shown above the names: the labels alone do not
   say what the capacity was, and the distinctions (lecturer vs. invited,
   TA vs. organizer) are exactly what a reader comes to this panel to settle.
   Kept parallel and to one line so switching tabs swaps a line, not a block. */
const TP_TAB_DESC = {
  lecturers: 'Taught a course at one of our events.',
  TAs:       'Teaching assistants — supported the lecturers and the students through an event.',
  guests:    'Invited speakers, who delivered a lecture connected to an event.',
  partners:  'Helped organize one of our events.',
};
/* how each kind reads inside a sentence, for the empty state — the tab
   labels are too terse ("No invited on record yet") to reuse here */
const TP_EMPTY_LABEL = {
  lecturers: 'lecturers', TAs: 'teaching assistants',
  guests: 'invited contributors', partners: 'organizing partners',
};
/* tab labels: plural except Invited, which reads wrong as "Inviteds" */
const TP_TAB_LABEL = { lecturers: 'Lecturers', TAs: 'TAs', guests: 'Invited', partners: 'Organizers' };
/* Section headings read as groups; TP_ROLE stays singular for one person. */
const TP_GROUP_LABEL = {
  councellors: 'Council',
  advisors:    'Advisors',
  lecturers:   'Lecturers',
  TAs:         'Teaching assistants',
  guests:      'Invited',
  partners:    'Organizing partners',
};

/* A labelled line in a dossier. Used by both file kinds so the fields line
   up identically whether or not they sit under a section heading. */
function Field({ label, value }) {
  return (
    <div className="dsr-field">
      <span className="lbl">{label}</span>
      {value ? <p>{value}</p> : <p className="none">// no record on file</p>}
    </div>
  );
}

/* ── service record ───────────────────────────────────────────────────
   A person's role is a property of (person × edition), not of the person:
   the same person can be a TA at one school and a lecturer at the next.
   Their .md therefore carries

       service:
         - { ed: 6, role: lecturer, topic: "Bayesian inference" }
         - { ed: 3, role: TA }
       standing: council        # optional, ongoing (council / advisor)

   `ed` joins to assets/schools/data/schools.yaml, so city, venue and date
   are never duplicated here. Someone with no `service:` block behaves
   exactly as before — they are filed under the folder they live in. */
const TP_SERVICE_ROLE = {
  TA: 'Teaching assistant', ta: 'Teaching assistant', TAs: 'Teaching assistant',
  lecturer: 'Lecturer', lecturers: 'Lecturer',
  council: 'Council', councellor: 'Council', councellors: 'Council',
  advisor: 'Advisory board', advisors: 'Advisory board',
  guest: 'Invited', guests: 'Invited', invited: 'Invited',
  partner: 'Organizing partner', partners: 'Organizing partner',
};
/* folder key each service role maps onto, so grouping stays in TP_ORDER terms */
const TP_SERVICE_GROUP = {
  TA: 'TAs', ta: 'TAs', TAs: 'TAs',
  lecturer: 'lecturers', lecturers: 'lecturers',
  council: 'councellors', councellor: 'councellors', councellors: 'councellors',
  advisor: 'advisors', advisors: 'advisors',
  guest: 'guests', guests: 'guests', invited: 'guests',
  partner: 'partners', partners: 'partners',
};
/* Sections we do NOT keep current. The caveat covers the two fields that go
   stale — affiliation and field of interest — so it sits directly above them,
   below the role line, which stays accurate. Council and advisory-board
   entries are maintained and carry no caveat. */
const TP_STALE = new Set([...TP_EDUCATOR_KINDS, ...TP_PARTNER_KINDS]);

/* seniority, used to pick the group for someone who has held several roles */
const TP_RANK = { guests: 1, partners: 1, TAs: 2, lecturers: 3, advisors: 4, councellors: 5 };

const TP_EDITIONS = new Map((schools.editions || []).map(e => [Number(e.ed), e]));
const tpEdition = ed => TP_EDITIONS.get(Number(ed)) || { ed, city: '', date: '' };

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
/* One "- { ed: 6, role: lecturer, topic: \"MCMC\" }" line → an object.
   Deliberately narrow: inline flow maps only, which is the form the
   README documents. Anything unparseable is skipped, not thrown. */
function tpParseServiceEntry(line) {
  const inner = line.match(/^\s*-\s*\{(.*)\}\s*$/);
  if (!inner) return null;
  const out = {};
  inner[1].split(',').forEach(pair => {
    const kv = pair.match(/^\s*([\w-]+)\s*:\s*(.*?)\s*$/);
    if (!kv) return;
    out[kv[1]] = kv[2].replace(/^["']|["']$/g, '');
  });
  if (out.ed === undefined || !out.role) return null;
  out.ed = Number(out.ed);
  return Number.isFinite(out.ed) ? out : null;
}
function tpParsePerson(text) {
  const m = text.match(/^\s*---\s*\n([\s\S]*?)\n---\s*\n?([\s\S]*)$/);
  const meta = { links: {}, service: [] }; let body = text;
  if (m) {
    body = m[2] || '';
    let block = null;                       // 'links' | 'service' | null
    m[1].split(/\r?\n/).forEach(line => {
      if (!line.trim()) return;
      const indented = /^\s/.test(line);
      if (block === 'service' && indented) {
        const entry = tpParseServiceEntry(line);
        if (entry) meta.service.push(entry);
        if (/^\s*-/.test(line)) return;     // list item consumed either way
      }
      const kv = line.match(/^\s*([\w-]+):\s*(.*)$/);
      if (!kv) return;
      const key = kv[1], val = kv[2].trim();
      if (key === 'links' && val === '') { block = 'links'; return; }
      if (key === 'service' && val === '') { block = 'service'; return; }
      if (block === 'links' && indented) { if (val) meta.links[key] = val; return; }
      block = null;
      if (val !== '') meta[key] = val;
    });
  }
  meta.bio = body.trim();
  return meta;
}

/* Newest edition first; the group someone is filed under is their standing
   if they have one, else the most senior role they have ever held, else the
   folder they live in (which is how every existing person still works). */
function tpBuildService(p, folderRole) {
  const service = (p.service || [])
    .filter(s => TP_SERVICE_GROUP[s.role])
    .sort((a, b) => b.ed - a.ed);
  const standing = TP_SERVICE_GROUP[p.standing] || null;
  let group = standing;
  if (!group && service.length) {
    group = service.reduce((best, s) => {
      const g = TP_SERVICE_GROUP[s.role];
      return !best || TP_RANK[g] > TP_RANK[best] ? g : best;
    }, null);
  }
  return { service, group: group || folderRole };
}

/* Distinct roles held, oldest → newest, ending on any standing position.
   This is the "TA → Lecturer → Council" trajectory shown in the dossier. */
function tpTrajectory(person) {
  const arc = [];
  person.service.slice().reverse().forEach(s => {
    const g = TP_SERVICE_GROUP[s.role];
    if (arc[arc.length - 1] !== g) arc.push(g);
  });
  const st = TP_SERVICE_GROUP[person.standing];
  if (st && arc[arc.length - 1] !== st) arc.push(st);
  return arc;
}
async function tpLoad() {
  const roster = tpParseRoster(await fetch(`${TP_BASE}/people.yml`).then(r => { if (!r.ok) throw new Error('people.yml'); return r.text(); }));
  const flat = [];
  await Promise.all(roster.map(async ({ role, slugs }) => {
    await Promise.all(slugs.map(async (slug, i) => {
      try {
        const md = await fetch(`${TP_BASE}/${role}/${slug}.md`).then(r => { if (!r.ok) throw new Error(`${role}/${slug}.md`); return r.text(); });
        const p = tpParsePerson(md);
        const { service, group } = tpBuildService(p, role);
        flat.push({
          id: `${role}/${slug}`, roleKey: group, role: TP_ROLE[group] || group,
          folderRole: role, service, standing: p.standing || '',
          editions: new Set(service.map(x => x.ed)).size,
          name: p.name || slug, inst: p.affiliation || '', title: p.title || '',
          founder: /^(yes|true)$/i.test(p.founder || ''),
          bio: p.bio || '', links: p.links || {},
          photoUrl: /^(none|no|false)$/i.test(p.photo || '') ? '' : `${TP_BASE}/${role}/${p.photo || slug + '.jpg'}`,
          order: TP_ORDER.indexOf(group) * 100 + i,
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

/* ── service record ───────────────────────────────────────────────────
   Every edition this person worked and what they did there. Hidden
   entirely for anyone whose .md carries no `service:` block, so existing
   files render exactly as they did before. */
function ServiceRecord({ p }) {
  if (!p.service || !p.service.length) return null;
  const arc = tpTrajectory(p);
  return (
    <>
      {arc.length > 1 && (
        <div className="dsr-field">
          <span className="lbl">TRAJECTORY</span>
          <div className="tp-arc">
            {arc.map((r, i) => (
              <React.Fragment key={r}>
                {i > 0 && <span className="tp-arc-sep">→</span>}
                <span className={'tp-tag ' + r}>{TP_ROLE[r]}</span>
              </React.Fragment>
            ))}
          </div>
        </div>
      )}
      <div className="dsr-sect svc">Service record</div>
      <div className="dsr-field">
        <table className="tp-svc">
          <thead>
            <tr><th>Ed</th><th>Where</th><th>Role</th><th>Taught</th></tr>
          </thead>
          <tbody>
            {p.service.map((sv, i) => {
              const e = tpEdition(sv.ed);
              return (
                <tr key={`${sv.ed}-${sv.role}-${i}`}>
                  <td className="ed">{String(sv.ed).padStart(2, '0')}</td>
                  <td>{e.city || '—'}{e.date ? <><br /><span className="dim">{e.date}</span></> : null}</td>
                  <td><span className={'tp-tag ' + TP_SERVICE_GROUP[sv.role]}>{TP_SERVICE_ROLE[sv.role]}</span></td>
                  <td>{sv.topic || <span className="dim">—</span>}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </>
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
                  {/* The list marks founding with a chevron because it has no
                      room to spell it out; the file does, and a dossier that
                      omits it would be the less complete of the two. */}
                  {p.founder && <span className="tp-tag founder dsr-fdr">Founder</span>}
                  {TP_STALE.has(p.roleKey)
                    /* Historical file: the role changed between editions, so it
                       belongs to the service record below and never to the
                       header. Everything under the heading is a snapshot. */
                    ? <>
                        <div className="dsr-sect">Data at the latest collaboration</div>
                        <Field label="TITLE" value={p.title} />
                      </>
                    /* Maintained file: the role is current, so it stays under
                       the name and the fields carry no caveat. */
                    : <div className="dsr-role">{p.role}{p.title ? ` · ${p.title}` : ''}</div>}
                  <Field label="AFFILIATION" value={p.inst} />
                  <Field label="FIELD OF INTEREST" value={p.bio} />
                  <ServiceRecord p={p} />
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
/* One roster row. */
function RosterRow({ p, n, selId, onSelect }) {
  return (
    <button className={'tp-item' + (p.id === selId ? ' on' : '')} onClick={(e) => { e.stopPropagation(); onSelect(p.id); }}>
      <span className="tp-idx">{String(n).padStart(2, '0')}</span>
      <div style={{ minWidth: 0, flex: 1 }}>
        <div className="tp-nm">{p.name}</div>
        {/* Board members are identified by the post they hold in the Academy —
            Chair, Secretary, Treasurer — which is what the reader is looking
            for. An edition count is the right line only for a collaborator,
            whose record is a history of appearances rather than a post. */}
        <div className="tp-af">
          {TP_BOARD_GROUPS.includes(p.roleKey) || p.editions === 0
            ? (p.title || p.role)
            : `${p.editions} edition${p.editions > 1 ? 's' : ''}`}
        </div>
      </div>
      {p.editions > 0
        ? <span className="tp-pips" aria-hidden="true">
            {tpTrajectory(p).map(r => <span key={r} className={'tp-pip ' + r} title={TP_ROLE[r]}></span>)}
            {p.founder && <span className="tp-pip founder" title="Founder"></span>}
          </span>
        : <span className="tp-go">OPEN ▸</span>}
    </button>
  );
}

/* Numbering restarts inside each list, so a row reads as the nth of what you
   are looking at rather than the nth of the page. */
function RosterList({ items, cols, selId, onSelect }) {
  return (
    <div className="tp-rgroup" style={{ gridTemplateColumns: `repeat(${cols}, minmax(0,1fr))` }}>
      {items.map((p, i) => <RosterRow key={p.id} p={p} n={i + 1} selId={selId} onSelect={onSelect} />)}
    </div>
  );
}

/* Collaborators, with the capacity as a tab rather than a section: adding a
   kind costs a tab, never a new heading. Every kind is always offered so the
   row always reads as a switch — an empty one says "none yet" rather than
   vanishing and leaving a lone tab that looks like a label. */
function CollabTabs({ people, cols, selId, onSelect }) {
  /* Membership of a tab comes from the service record, not from the section a
     person is filed under: a council member who taught is a lecturer of that
     edition, and the tab that claims to list lecturers has to say so. A person
     therefore appears under every capacity they actually served in. */
  const held = (p, k) => p.service.some(x => TP_SERVICE_GROUP[x.role] === k);
  const inKind = k => people.filter(p => held(p, k));
  const count = k => inKind(k).length;
  const kinds = TP_COLLAB_KINDS
    .filter(k => TP_COLLAB_ALWAYS.includes(k) || count(k) > 0);
  /* open on the first kind that actually has people, so the panel never
     lands on an empty tab while a populated one sits next to it */
  const [tab, setTab] = React.useState(
    kinds.find(k => count(k) > 0) || kinds[0] || TP_COLLAB_KINDS[0]);
  if (!kinds.length) return null;
  const active = kinds.includes(tab) ? tab : kinds[0];
  /* one order across every tab, so a name sits where the reader expects it */
  const shown = inKind(active)
    .sort((a, b) => tpSurname(a.name).localeCompare(tpSurname(b.name)));
  /* arrows move between tabs, the roving-tabstop convention for a tablist */
  const onKeyDown = (e) => {
    const d = e.key === 'ArrowRight' ? 1 : e.key === 'ArrowLeft' ? -1 : 0;
    if (!d) return;
    e.preventDefault();
    setTab(kinds[(kinds.indexOf(active) + d + kinds.length) % kinds.length]);
  };
  return (
    <>
      <div className="tp-stabs" role="tablist" aria-label="Collaborator kind" onKeyDown={onKeyDown}>
        {kinds.map(k => (
          <button key={k} type="button" role="tab" aria-selected={k === active}
            tabIndex={k === active ? 0 : -1}
            className={'tp-stab' + (k === active ? ' on' : '')}
            onClick={(e) => { e.stopPropagation(); setTab(k); }}>
            {TP_TAB_LABEL[k] || TP_GROUP_LABEL[k]}
            <span className="n">{count(k)}</span>
          </button>
        ))}
      </div>
      {TP_TAB_DESC[active] && <p className="tp-stab-desc">{TP_TAB_DESC[active]}</p>}
      {shown.length
        ? <RosterList items={shown} cols={cols} selId={selId} onSelect={onSelect} />
        : <p className="tp-stab-empty">No {TP_EMPTY_LABEL[active] || active} on record yet.</p>}
    </>
  );
}

function Roster({ people, selId, onSelect, cols = 1 }) {
  const byGroup = k => people.filter(p => p.roleKey === k);
  const board = TP_BOARD_GROUPS.map(k => ({ key: k, items: byGroup(k) })).filter(g => g.items.length);
  /* everyone is a candidate: the tabs pick by what a person did, not by the
     tier they sit in, so council and advisory members appear under the
     capacities they served in while keeping their own section above */

  /* Rails carry the home-page motif; the tiers above them carry the one
     distinction that matters — who runs this vs. who has worked with us. */
  let railN = 0;
  const rail = (label, body, key) => {
    railN += 1;
    return (
      <Rail key={key} n={String(railN).padStart(2, '0')} label={label}
        accent={railN % 2 === 0 ? 'red' : undefined} variant="matrix">
        {body}
      </Rail>
    );
  };

  return (
    <div className="tp-roster tp-roster-rails">
      <section className="as-panel tp-tier board" aria-label="Administration Board">
        <Corners />
        <header className="tp-tier-hd">
          <span className="t">Administration Board</span>
        </header>
        {board.map(g => rail(TP_GROUP_LABEL[g.key] || g.key,
          <RosterList items={g.items} cols={cols} selId={selId} onSelect={onSelect} />, g.key))}
      </section>

      <section className="as-panel tp-tier" aria-label="Collaborators">
        <Corners />
        <header className="tp-tier-hd">
          <span className="t">Collaborators Database</span>
          <span className="d">Records are snapshots of the last collaboration</span>
        </header>
        {rail('Educators',
          <CollabTabs people={people} cols={cols} selId={selId} onSelect={onSelect} />, 'collabs')}
      </section>
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
      <PageLayout header={<PageHeader section="People" kicker="who we are" title={'Personnel\nterminal'} lede={lede || <>Select a <span className="b">name</span> to open their file.</>} />}>
        <section className="people-content" aria-label="Personnel roster and dossier">
          {children}
        </section>
      </PageLayout>
      <SiteFooter />
    </div>
  );
}


function PersonnelTerminal({ person }) {
  return (
    <aside className="people-display" aria-label="Personnel terminal" onClick={event => event.stopPropagation()}>
      {person ? <Dossier p={person} key={person.id} /> : <Standby />}
    </aside>
  );
}

function People() {
  const people = useRoster();
  const [sel, setSel] = React.useState(null);
  const p = people && people.find(x => x.id === sel);
  return (
    <TermShell>
      <div onClick={() => p && setSel(null)} style={{ paddingBottom: 40 }}>
        <div className="people-console">
          <div style={{ minWidth: 0 }}>
            {people === null ? <p className="pp-inst">// loading…</p> : <Roster people={people} selId={sel} onSelect={setSel} cols={2} />}
          </div>
          <PersonnelTerminal person={p} />
        </div>
        </div>
    </TermShell>
  );
}


export { People };
