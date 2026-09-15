import React from 'react';
import { Corners, SiteNav, SiteFooter, Rail } from '../components/SiteChrome.jsx';
import { PH_CTX, HeroPanel } from '../components/ServiceHero.jsx';
import { schools, participants } from '../data/schools.js';
import { WORLD_LAND } from '../data/world-land.js';
/* Schools overview. Data comes from assets/schools/data via the data module.
   Edition links lead to the individual schools' external websites. */
function yearOf(date) { const m = String(date || '').match(/\d{4}/); return m ? m[0] : ''; }

/* Split "16–20 Jun 2025" → { dm:"16–20 Jun", year:"2025" } so the year
   can be rendered larger than the specific day/month in the console. */
function splitDate(date) {
  const s = String(date || '').trim();
  const m = s.match(/^(.*?)\s*(\d{4})\s*$/);
  return m ? { dm: m[1].trim(), year: m[2] } : { dm: s, year: '' };
}
function DateStamp({ date }) {
  const { dm, year } = splitDate(date);
  return (
    <span className="sk-ds">
      <span className="sk-ds-yr">{year}</span>
      {dm ? <span className="sk-ds-dm">{dm}</span> : null}
    </span>
  );
}

function deriveSchools() {
  const data = schools;
  const editions = (data.editions || []).map(e => ({ ...e, year: yearOf(e.date) }));
  if (editions[0]) editions[0].featured = true;          // top entry == featured
  const LATEST = editions[0] || null;
  const PAST = editions.slice(1);
  // globe markers: group editions by city, count them; the featured city glows
  const order = [], byCity = {};
  editions.forEach(e => {
    if (!byCity[e.city]) { byCity[e.city] = { name: e.city, lat: e.lat, lon: e.lon, eds: 0, latest: false }; order.push(e.city); }
    byCity[e.city].eds++;
  });
  if (LATEST) byCity[LATEST.city].latest = true;
  const SITES = order.map(c => byCity[c]);

  /* Header stats — values flagged `auto` in the YAML are computed from data:
     editions = count of editions; alumni = accepted participants in
     participants.csv, floored to the nearest 10 with a trailing "+". */
  
  const alumni = participants.filter(p => String(p.accepted).toUpperCase() === 'TRUE');
  const countrySet = new Set();
  participants.forEach(p => { if (p.country) countrySet.add(p.country); if (p.country2) countrySet.add(p.country2); });
  const floorPlus = n => Math.floor(n / 10) * 10 + '+';
  const meta = data.meta || {};
  const stats = (meta.stats || []).map(s => {
    if (s.auto === 'editions') return { ...s, value: String(editions.length) };
    if (s.auto === 'alumni' && alumni.length) return { ...s, value: floorPlus(alumni.length) };
    if (s.auto === 'countries' && countrySet.size) return { ...s, value: floorPlus(countrySet.size) };
    return s;
  });
  return { editions, LATEST, PAST, SITES, meta: { ...meta, stats } };
}

/* ── Alumni origins ──────────────────────────────────────────────
   Home countries of accepted participants (nationality where known,
   else the institute's country), mapped to approximate centroids so
   they can be plotted on the globe. Counts drive the marker size. */
const COUNTRY_COORDS = {
  Greece: [39.0, 22.0], Italy: [42.8, 12.8], Germany: [51.0, 10.0], UAE: [24.0, 54.0],
  Spain: [40.2, -3.7], France: [46.6, 2.5], India: [22.0, 79.0], Estonia: [58.6, 25.0],
  Croatia: [45.1, 15.5], Chile: [-35.0, -71.0], Russia: [56.0, 45.0], UK: [54.0, -2.5],
  Jordan: [31.2, 36.5], Oman: [21.0, 57.0], Czechia: [49.8, 15.5], USA: [39.5, -98.0],
  SouthAfrica: [-29.0, 24.0], Poland: [52.0, 19.0], Belgium: [50.6, 4.6], Mexico: [23.5, -102.0],
  Syria: [35.0, 38.0], Pakistan: [30.0, 70.0], Egypt: [26.8, 30.0], Algeria: [28.0, 3.0],
  Serbia: [44.0, 20.9], Israel: [31.5, 34.9], Ireland: [53.2, -8.0], Finland: [64.0, 26.0],
  Netherlands: [52.2, 5.3], Portugal: [39.5, -8.0], Switzerland: [46.8, 8.2], Romania: [45.9, 25.0],
  Djibouti: [11.8, 42.6], SaudiArabia: [24.0, 45.0], 'Saudi Arabia': [24.0, 45.0], Iraq: [33.0, 44.0],
  Tunisia: [34.0, 9.5],
};
const COUNTRY_ALIAS = { 'United States of America': 'USA' };
function deriveAlumniOrigins() {
  
  const counts = {};
  participants.forEach(p => {
    if (String(p.accepted).toUpperCase() !== 'TRUE') return;
    let c = p.country2 || p.country;
    if (!c) return;
    c = COUNTRY_ALIAS[c] || c;
    counts[c] = (counts[c] || 0) + 1;
  });
  return Object.entries(counts).map(([name, count]) => {
    const co = COUNTRY_COORDS[name];
    return co ? { name, count, lat: co[0], lon: co[1] } : null;
  }).filter(Boolean);
}

/* Resolve each alumni country to its landmass polygon by testing the
   centroid against the Natural-Earth rings (point-in-polygon). The whole
   country can then be filled on the globe. Computed once and cached —
   it doesn't depend on rotation. */
function pointInRing(lon, lat, ring) {
  let inside = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const xi = ring[i][0], yi = ring[i][1], xj = ring[j][0], yj = ring[j][1];
    if (((yi > lat) !== (yj > lat)) && (lon < (xj - xi) * (lat - yi) / (yj - yi) + xi)) inside = !inside;
  }
  return inside;
}
let _alumniRingsCache = null;
function alumniCountryRings() {
  if (_alumniRingsCache) return _alumniRingsCache;
  const land = WORLD_LAND;
  const out = deriveAlumniOrigins().map(o => {
    for (const r of land) { if (pointInRing(o.lon, o.lat, r)) return { ...o, ring: r }; }
    return null;
  }).filter(Boolean);
  if (out.length) _alumniRingsCache = out;
  return out;
}



/* ── Extended Schools page sections (Mission · Method · Curriculum · Attendants)
   Content ported from astrostat.academy, organised below the planisphere. */


function SectionHead({ eyebrow, accent, title, lead }) {
  return (
    <div className="skx-head">
      <span className={'as-eyebrow' + (accent ? ' ' + accent : '')}>{eyebrow}</span>
      <h2 className="as-h2">{title}</h2>
      {lead ? <p className="as-p">{lead}</p> : null}
    </div>
  );
}

function SkillSpectrum({ lo = 0.25, hi = 0.62 } = {}) {
  // direct gradient between the two brand primaries: blue (#0465ad) -> crimson (#8c0527)
  const stops = [
    [4, 101, 173], [140, 5, 39],
  ];
  const lerp = (a, b, t) => Math.round(a + (b - a) * t);
  const colorAt = (t) => {
    const x = Math.max(0, Math.min(1, t)) * (stops.length - 1);
    const i = Math.min(stops.length - 2, Math.floor(x));
    const f = x - i, a = stops[i], b = stops[i + 1];
    return `rgb(${lerp(a[0], b[0], f)},${lerp(a[1], b[1], f)},${lerp(a[2], b[2], f)})`;
  };
  const N = 40;

  const reduce = typeof window !== 'undefined' && window.matchMedia &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const [level, setLevel] = React.useState(reduce ? hi : lo);
  React.useEffect(() => {
    if (reduce) return;
    let raf;
    const rnd = (a, b) => a + Math.random() * (b - a);
    // rev sweeps between the lo floor and the hi peak
    let phase = 'up', t0 = performance.now(), from = lo, to = rnd(hi - 0.04, hi + 0.04), dur = rnd(300, 460);
    const advance = (cur) => {
      if (phase === 'up') { phase = 'hold'; from = cur; to = cur; dur = rnd(160, 300); }
      else if (phase === 'hold') { phase = 'down'; from = cur; to = rnd(lo - 0.03, lo + 0.03); dur = rnd(420, 640); }
      else if (phase === 'down') { phase = 'gap'; from = cur; to = cur; dur = rnd(180, 460); }
      else { phase = 'up'; from = cur; to = rnd(hi - 0.04, hi + 0.04); dur = rnd(260, 460); }
    };
    const tick = (now) => {
      let x = (now - t0) / dur;
      if (x >= 1) { t0 = now; advance(to); x = 0; }
      let v;
      if (phase === 'hold') v = to + Math.sin(now / 38) * 0.035;        // redline jitter
      else if (phase === 'up') v = from + (to - from) * (1 - Math.pow(1 - x, 2));
      else if (phase === 'down') v = from + (to - from) * (x * x);
      else v = to;                                                       // gap idle
      setLevel(Math.max(0, Math.min(1, v)));
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [reduce, lo, hi]);

  return (
    <div className="skx-skill">
      <div className="skx-skill-plot">
        {Array.from({ length: N }).map((_, i) => {
          const pos = i / (N - 1);
          const c = colorAt(pos);
          const lit = pos <= level + 0.001;
          const tip = lit && pos > level - (1 / N);
          return (
            <div key={i} className="skx-sb" style={{
              height: (18 + 82 * (1 - (1 - pos) * (1 - pos))) + '%',
              background: c,
              opacity: lit ? 1 : 0.12,
              filter: tip ? 'brightness(1.45)' : 'none',
              boxShadow: tip ? '0 0 10px ' + c : 'none',
            }}></div>
          );
        })}
      </div>
      <div className="skx-skill-axis">
        <span>Basic<br />knowledge</span>
        <span>Novice<br />practitioner</span>
        <span>Professional<br />practitioner</span>
        <span>Teacher</span>
      </div>
    </div>
  );
}

function MissionSection() {
  return (
    <Rail n="03" label="Fronts" variant="matrix">
      <SectionHead
        eyebrow="How we operate"
        title="We operate on two fronts" />
      <div className="skx-two" style={{ marginTop: 22 }}>
        <div className="skx-mission">
          <span className="skx-kick">01 · Support</span>
          <p className="skx-mtext">We help <b>early-career researchers and data scientists</b> master the analysis tools they may know only superficially — or have struggled to learn without structured guidance.</p>
          <SkillSpectrum />
        </div>
        <div className="skx-mission">
          <span className="skx-kick">02 · Train</span>
          <p className="skx-mtext">We prepare <b>additional personnel to become instructors</b>, and assist institutes in organising teaching events of their own.</p>
          <SkillSpectrum lo={0.62} hi={0.98} />
        </div>
      </div>
    </Rail>
  );
}

function MethodSection() {
  return (
    <Rail n="04" label="Method" variant="matrix">
      <SectionHead
        eyebrow="The School · Method"
        title="Theory, then your own keyboard"
        lead={<>Our lectures are a mix of theory and hands-on applications, usually via Python notebooks. This successful recipe provides the necessary variety to keep the interest alive and the students engaged.<br /><br />Our teaching philosophy is to go hand-in-hand with the students so that no one is left behind! We encourage both teacher–student and student–student interactions.</>} />
      <div className="skx-method">
        <div className="skx-strip">
          <div className="skx-mrow"><span className="mk">Format</span><span className="mv">Theory<span className="dot">·</span>hands-on applications, interleaved</span></div>
          <div className="skx-mrow"><span className="mk">Notebooks</span><span className="mv">Python<span className="dot">·</span>reusable code you can refactor to your own work</span></div>
          <div className="skx-mrow"><span className="mk">Ethos</span><span className="mv">Hand-in-hand<span className="dot">·</span>no one left behind</span></div>
          <div className="skx-mrow"><span className="mk">Exchange</span><span className="mv">Teacher–student<span className="dot">·</span>and student–student interaction</span></div>
        </div>
        <figure className="skx-video" style={{ margin: 0 }}>
          <span className="as-c as-tl"></span><span className="as-c as-tr"></span>
          <span className="as-c as-bl"></span><span className="as-c as-br"></span>
          <span className="skx-vtop">Field recording · 06</span>
          <span className="skx-play"></span>
          <figcaption className="skx-vcap">Sharjah 2025 — the School in action</figcaption>
        </figure>
      </div>
    </Rail>
  );
}

const CURRICULUM = {
  core: ['Classical Statistics', 'Hypothesis Testing', 'Optimization', 'Bayesian Statistics', 'MCMC', 'ML / DL Introduction', 'Clustering', 'Classification', 'Regression', 'Model Selection', 'ML Best Practices'],
  seasonal: ['Time Series', 'CNNs', 'Diffusion Models', 'Simulation-Based Inference', 'GPU Parallelization', 'Gaussian Processes', 'Bayesian Optimization', 'Citizen Science'],
  future: ['LLM Pipelines', 'AI Agents', 'Knowledge Maps'],
};
function CurriculumSection() {
  const Col = ({ cls, label, count, cap, items }) => (
    <div className={'skx-col ' + cls}>
      <div className="skx-ch"><b>{label}</b><i>{String(count).padStart(2, '0')}</i></div>
      <div className="skx-cc">{cap}</div>
      <ul className="skx-topics">{items.map(t => <li key={t} className="skx-t">{t}</li>)}</ul>
    </div>
  );
  return (
    <Rail n="05" label="Curriculum" variant="matrix">
      <SectionHead
        eyebrow="Curriculum"
        title="What we cover"
        lead="Every schedule balances core foundations — the fundamentals every researcher must master — with seasonal, state-of-the-art topics, plus a horizon of subjects we're preparing for future editions." />
      <div className="skx-syllabus">
        <Col cls="core" label="Core" count={CURRICULUM.core.length} cap="Always on the schedule" items={CURRICULUM.core} />
        <Col cls="seasonal" label="Seasonal" count={CURRICULUM.seasonal.length} cap="Rotates each edition" items={CURRICULUM.seasonal} />
        <Col cls="future" label="Future" count={CURRICULUM.future.length} cap="On the horizon" items={CURRICULUM.future} />
      </div>
      <p className="skx-fine">However complex the topic, our notebooks always ship reusable code a student can refactor to their own purposes with minimal effort.</p>
    </Rail>
  );
}

const ATTEND_STATS = [
  { v: '≈32', l: 'Number of participants, median' },
  { v: '650+', l: 'Applications to date' },
  { v: '200+', l: 'Students taught' },
];
function AttendantsSection() {
  return (
    <Rail n="06" label="Attendants" variant="matrix">
      <SectionHead
        eyebrow="Who attends"
        title="Open to all"
        lead={<>Our ideal attendee is an astrophysics PhD candidate — but we welcome everyone from BSc students to professors, and from Computer Science to Signal Processing. After all, everybody needs a hand with statistics.<br /><br />At every event we like to keep the number of attendants constrained in order to maximise the interactions between students and teachers.<br /><br />This mix benefits everyone: students see the techniques applied across domains, while teachers meet a wider range of needs that keeps them current with the latest in Machine Learning.</>} />
      <div className="skx-stats">
        {ATTEND_STATS.map(s => (
          <div key={s.l} className="skx-stat"><span className="sv">{s.v}</span><span className="sl">{s.l}</span></div>
        ))}
      </div>
      <p className="skx-fine">We deliberately cap each cohort near thirty — small enough to maximise student–teacher interaction, broad enough to keep the room interdisciplinary and the instructors current.</p>
    </Rail>
  );
}

function SchoolsHead() {
  const { meta } = deriveSchools();
  const stats = meta.stats || [];
  return (
    <div className="sk-head">
      <span className="as-eyebrow">{meta.eyebrow || 'Schools · Editions'}</span>
      <h2 className="as-h1pg" style={{ marginTop: 12 }}>{meta.title || 'The AstroStat School'}</h2>
      <p className="as-p">{meta.blurb}</p>
      <div className="sk-lead">
        {stats.map((s, i) => s.prefix
          ? <span key={i}>{s.label} <b>{s.value}</b></span>
          : <span key={i}><b>{s.value}</b> {s.label}</span>)}
      </div>
    </div>
  );
}

function FeaturedHero() {
  const { LATEST } = deriveSchools();
  const topics = LATEST.topics || [];
  return (
    <a className="sk-hero" href={LATEST.url} target="_blank" rel="noopener noreferrer">
      <div className="tag">{LATEST.upcoming ? 'Next edition' : 'Latest edition · № ' + String(LATEST.ed).padStart(2, '0')}</div>
      <div className="cy">{LATEST.city} {LATEST.year}</div>
      <div className="meta">{LATEST.venue} · {LATEST.country} · {LATEST.date}</div>
      {topics.length
        ? <div className="chips2">{topics.map(t => <span key={t} className="as-chip">{t}</span>)}</div>
        : null}
      <div className="go">{LATEST.upcoming ? 'Visit the edition ↗' : 'View the edition ↗'}</div>
    </a>
  );
}

function Globe({ W = 980, H = 560, speed = 5, showSites = true, showLand = true, showAlumni = false }) {
  const R = Math.min(W * 0.26, H * 0.46);
  const cx = W * 0.33, cy = H / 2;
  const reduce = typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const [rot, setRot] = React.useState(-25);
  React.useEffect(() => {
    if (reduce || !speed) return;
    let raf, last = performance.now();
    const tick = t => { const dt = Math.min(0.05, (t - last) / 1000); last = t; setRot(r => (r + dt * speed) % 360); raf = requestAnimationFrame(tick); };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [reduce, speed]);

  const lat0 = 22 * Math.PI / 180, lon0 = rot * Math.PI / 180;
  const sL0 = Math.sin(lat0), cL0 = Math.cos(lat0);
  const pt = (lonD, latD) => {
    const lon = lonD * Math.PI / 180 - lon0, lat = latD * Math.PI / 180;
    const cp = Math.cos(lat), sp = Math.sin(lat), cl = Math.cos(lon), sl = Math.sin(lon);
    const cosc = sL0 * sp + cL0 * cp * cl;
    return { x: cx + R * cp * sl, y: cy - R * (cL0 * sp - sL0 * cp * cl), front: cosc >= 0 };
  };
  const segs = pts => {
    const out = []; let cur = null, cf = null;
    for (const p of pts) {
      if (cur && p.front !== cf) { out.push({ front: cf, pts: cur }); cur = null; }
      if (!cur) { cur = []; cf = p.front; }
      cur.push(p);
    }
    if (cur) out.push({ front: cf, pts: cur });
    return out;
  };
  const dstr = pts => pts.map((p, i) => (i ? 'L' : 'M') + p.x.toFixed(1) + ' ' + p.y.toFixed(1)).join(' ');

  const lines = [];
  for (let lon = -180; lon < 180; lon += 15) { const p = []; for (let la = -90; la <= 90; la += 2) p.push(pt(lon, la)); lines.push({ major: lon === 0, segs: segs(p) }); }
  for (let la = -75; la <= 75; la += 15) { const p = []; for (let lo = -180; lo <= 180; lo += 2) p.push(pt(lo, la)); lines.push({ major: la === 0, segs: segs(p) }); }

  const back = [], front = [];
  lines.forEach((L, i) => L.segs.forEach((s, j) => {
    (s.front ? front : back).push(
      <path key={i + '-' + j} d={dstr(s.pts)} fill="none"
        stroke={L.major && s.front ? '#7cc4f5' : '#3b9be0'}
        strokeWidth={L.major ? 1.5 : 1.1}
        strokeOpacity={s.front ? (L.major ? 0.85 : 0.4) : 0.11} />
    );
  }));

  // country / coastline outlines projected onto the sphere
  const land = WORLD_LAND;
  const lback = [], lfront = [];
  land.forEach((ring, i) => {
    segs(ring.map(c => pt(c[0], c[1]))).forEach((s, j) => {
      if (s.pts.length < 2) return;
      (s.front ? lfront : lback).push(
        <path key={i + '-' + j} d={dstr(s.pts)} fill="none"
          stroke={s.front ? '#d6ecff' : '#5aa6dc'}
          strokeWidth={s.front ? 1 : 0.8}
          strokeOpacity={s.front ? 0.62 : 0.07}
          strokeLinejoin="round" strokeLinecap="round" />
      );
    });
  });

  // host-city markers — derived from the YAML (cities grouped + counted),
  // project, keep the visible hemisphere, then declutter labels vertically
  // (the Mediterranean editions cluster tightly) with leader lines.
  const SCHOOL_SITES = deriveSchools().SITES;
  const sites = SCHOOL_SITES
    .map(s => { const p = pt(s.lon, s.lat); return { ...s, x: p.x, y: p.y, front: p.front }; })
    .filter(s => s.front);
  // alumni origins — fill the whole home country of accepted participants;
  // fill opacity scales with headcount. Centroid must face the viewer.
  const alumniFills = showAlumni
    ? alumniCountryRings()
        .map(o => ({ ...o, proj: o.ring.map(c => pt(c[0], c[1])), front: pt(o.lon, o.lat).front }))
        .filter(o => o.front)
        .sort((a, b) => a.count - b.count)
    : [];
  const LH = 17;
  ['L', 'R'].forEach(side => {
    const grp = sites.filter(s => (side === 'R') === (s.x >= cx)).sort((a, b) => a.y - b.y);
    grp.forEach((s, i) => {
      s.side = side;
      s.ly = i === 0 ? s.y + 3.6 : Math.max(s.y + 3.6, grp[i - 1].ly + LH);
    });
  });

  return (
    <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label="Rotating celestial coordinate globe">
      <defs>
        <radialGradient id="gl-atm" cx="50%" cy="50%" r="50%">
          <stop offset="60%" stopColor="rgba(59,155,224,0)" />
          <stop offset="93%" stopColor="rgba(59,155,224,.20)" />
          <stop offset="100%" stopColor="rgba(59,155,224,0)" />
        </radialGradient>
        <radialGradient id="gl-core" cx="50%" cy="44%" r="58%">
          <stop offset="0%" stopColor="rgba(4,101,173,.16)" />
          <stop offset="100%" stopColor="rgba(0,0,0,0)" />
        </radialGradient>
        <filter id="gl-glow" x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation="3.2" /></filter>
      </defs>
      <circle cx={cx} cy={cy} r={R * 1.07} fill="url(#gl-atm)" />
      <circle cx={cx} cy={cy} r={R} fill="url(#gl-core)" />
      <g>{back}</g>
      {showLand && <g>{lback}</g>}
      {showAlumni && <g>{alumniFills.map(o => {
        const fp = o.proj.filter(p => p.front);
        if (fp.length < 3) return null;
        const op = (0.18 + Math.min(0.42, o.count / 50 * 0.42)).toFixed(3);
        return <path key={o.name} d={dstr(fp) + 'Z'} fill={'rgba(0,140,140,' + op + ')'} stroke="rgba(0,140,140,.9)" strokeWidth="1" strokeLinejoin="round" strokeLinecap="round" />;
      })}</g>}
      <g filter="url(#gl-glow)" opacity="0.5">{front}</g>
      <g>{front}</g>
      {showLand && <g filter="url(#gl-glow)" opacity="0.45">{lfront}</g>}
      {showLand && <g>{lfront}</g>}
      <circle cx={cx} cy={cy} r={R} fill="none" stroke="#8fcdf7" strokeWidth="2" strokeOpacity="0.85" filter="url(#gl-glow)" />
      <circle cx={cx} cy={cy} r={R} fill="none" stroke="#8fcdf7" strokeWidth="1.3" strokeOpacity="0.95" />
      {showSites && <g>{sites.map(s => {
        const right = s.side === 'R';
        const lx = right ? s.x + 13 : s.x - 13;
        const big = s.eds >= 5;
        return (
          <g key={s.name}>
            {s.latest && <circle className="sk-ping" cx={s.x} cy={s.y} r="4" fill="none" stroke="#e8506f" strokeWidth="1.4" />}
            <path d={`M${s.x.toFixed(1)} ${s.y.toFixed(1)} L${(right ? lx - 3 : lx + 3).toFixed(1)} ${(s.ly - 3.4).toFixed(1)}`} stroke="rgba(251,246,236,.32)" strokeWidth="0.8" fill="none" />
            {big && <circle cx={s.x} cy={s.y} r="7.5" fill="none" stroke="#fbf6ec" strokeWidth="1" strokeOpacity="0.45" />}
            <circle cx={s.x} cy={s.y} r={s.latest ? 4.2 : big ? 4 : 3} fill={s.latest ? '#ff5d79' : '#fbf6ec'} stroke="#000" strokeWidth="1" />
            <text className={'sk-site-lbl' + (s.latest ? ' latest' : '')} x={lx} y={s.ly} textAnchor={right ? 'start' : 'end'}>
              {s.name}{s.eds > 1 ? '  ×' + s.eds : ''}
            </text>
          </g>
        );
      })}</g>}
    </svg>
  );
}

const SKY_RATES = [{ k: 'Off', v: 0, icon: 'pause' }, { k: 'Slow', v: 5, icon: 'play' }, { k: 'Fast', v: 20, icon: 'ffwd' }];
function SpinIcon({ type }) {
  return (
    <svg className="sk-spin-ic" viewBox="0 0 14 12" fill="currentColor" aria-hidden="true">
      {type === 'pause' && <g><rect x="3.4" y="2" width="2.4" height="8" /><rect x="8.2" y="2" width="2.4" height="8" /></g>}
      {type === 'play' && <path d="M4 2 L11 6 L4 10 Z" />}
      {type === 'ffwd' && <g><path d="M1 2.5 L6 6 L1 9.5 Z" /><path d="M7.5 2.5 L12.5 6 L7.5 9.5 Z" /></g>}
    </svg>
  );
}

function SkyPanel() {
  const [rate, setRate] = React.useState(() => {
    try { const s = localStorage.getItem('sk-rate'); if (s !== null) return Number(s); } catch (e) { /* ignore */ }
    return 5;
  });
  const [sites, setSites] = React.useState(() => {
    try { const s = localStorage.getItem('sk-sites'); if (s !== null) return s === '1'; } catch (e) { /* ignore */ }
    return true;
  });
  const [land, setLand] = React.useState(() => {
    try { const s = localStorage.getItem('sk-land'); if (s !== null) return s === '1'; } catch (e) { /* ignore */ }
    return true;
  });
  const [alumni, setAlumni] = React.useState(() => {
    try { const s = localStorage.getItem('sk-alumni'); if (s !== null) return s === '1'; } catch (e) { /* ignore */ }
    return false;
  });
  const chooseRate = v => { setRate(v); try { localStorage.setItem('sk-rate', String(v)); } catch (e) { /* ignore */ } };
  const chooseSites = on => { setSites(on); try { localStorage.setItem('sk-sites', on ? '1' : '0'); } catch (e) { /* ignore */ } };
  const chooseLand = on => { setLand(on); try { localStorage.setItem('sk-land', on ? '1' : '0'); } catch (e) { /* ignore */ } };
  const chooseAlumni = on => { setAlumni(on); try { localStorage.setItem('sk-alumni', on ? '1' : '0'); } catch (e) { /* ignore */ } };
  return (
    <div className="sk-sky">
      <span className="sk-cnr tl"></span><span className="sk-cnr tr"></span>
      <span className="sk-cnr bl"></span><span className="sk-cnr br"></span>
      <div className="sk-sky-top"><span>Host Cities · Legacy</span><span className="dim">Orthographic · 3D</span></div>
      <div className="sk-sky-fig">
        <Globe speed={rate} showSites={sites} showLand={land} showAlumni={alumni} />
        <div className="sk-ctrl">
          <div className="sk-ctrl-h">Controls</div>
          <div className="sk-ctrl-row">
            <span className="lbl">Spin Velocity</span>
            <span className="sk-rate-seg" role="group" aria-label="Rotation speed">
              {SKY_RATES.map(r => (
                <button key={r.k} type="button" className={'sk-rate-b sk-rate-sym' + (r.v === rate ? ' on' : '')} aria-pressed={r.v === rate} aria-label={r.k} title={r.k} onClick={() => chooseRate(r.v)}><SpinIcon type={r.icon} /></button>
              ))}
            </span>
          </div>
          <div className="sk-ctrl-row">
            <span className="lbl">Locations</span>
            <span className="sk-rate-seg" role="group" aria-label="Show locations">
              <button type="button" className={'sk-rate-b' + (sites ? ' on' : '')} aria-pressed={sites} onClick={() => chooseSites(true)}>On</button>
              <button type="button" className={'sk-rate-b' + (!sites ? ' on' : '')} aria-pressed={!sites} onClick={() => chooseSites(false)}>Off</button>
            </span>
          </div>
          <div className="sk-ctrl-row">
            <span className="lbl">Country Outlines</span>
            <span className="sk-rate-seg" role="group" aria-label="Show country outlines">
              <button type="button" className={'sk-rate-b' + (land ? ' on' : '')} aria-pressed={land} onClick={() => chooseLand(true)}>On</button>
              <button type="button" className={'sk-rate-b' + (!land ? ' on' : '')} aria-pressed={!land} onClick={() => chooseLand(false)}>Off</button>
            </span>
          </div>
          <div className="sk-ctrl-row">
            <span className="lbl">Past Alumni Origins</span>
            <span className="sk-rate-seg" role="group" aria-label="Show alumni origins">
              <button type="button" className={'sk-rate-b' + (alumni ? ' on' : '')} aria-pressed={alumni} onClick={() => chooseAlumni(true)}>On</button>
              <button type="button" className={'sk-rate-b' + (!alumni ? ' on' : '')} aria-pressed={!alumni} onClick={() => chooseAlumni(false)}>Off</button>
            </span>
          </div>
        </div>
      </div>
      <div className="sk-sky-bot"><span>{alumni ? 'Alumni Origins · Editions' : 'Coastlines · Editions'}</span><span>Equatorial sphere</span></div>
    </div>
  );
}

/* ── Option D+ · Full Schools page · featured + planisphere, then the
   rest of the astrostat.academy story below it ────────────────────── */
function Schools() {
  const { PAST } = deriveSchools();
  return (
    <div className="as-page">
      <SiteNav active="schools" />
      <main id="main-content" className="as-wrap">
        <div style={{ marginBottom: 14 }}><HeroPanel ctx={PH_CTX.schools} /></div>
        <div className="as-panel"><Corners />
          <Rail n="02" label="Editions" variant="matrix">
            <SchoolsHead />
            <FeaturedHero />
            <div className="sk-d2">
              <div className="sk-d2-left">
                <div className="sk-arch" style={{ marginTop: 0 }}>
                  <h4>Past editions</h4>
                  <div className="sk-arows one">
                    {PAST.map(s => (
                      <a key={s.ed} className="sk-arow" href={s.url} target="_blank" rel="noopener noreferrer">
                        <span className="ds-col"><DateStamp date={s.date} /></span>
                        <span className="ac">{s.city}</span>
                        <span className="ax">↗</span>
                      </a>
                    ))}
                  </div>
                </div>
              </div>
              <div className="sk-d2-right"><SkyPanel /></div>
            </div>
          </Rail>
          <MissionSection />
          <MethodSection />
          <CurriculumSection />
          <AttendantsSection />
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}


export { Schools };
