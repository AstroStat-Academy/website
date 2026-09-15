import React from 'react';
import { PageLayout } from '../components/PageLayout.jsx';
import { PageHeader } from '../../components/PageHeader/PageHeader.jsx';
import { SiteNav, SiteFooter, Rail, Corners } from '../components/SiteChrome.jsx';
import { events, press } from '../data/media.js';
/* Gallery. Two blocks, both driven by assets/media/media.yml:
   01 — what we shot at our own events (photos and videos, by edition);
   02 — what other people published about us (press, radio, TV).
   Nothing here is hardcoded: an empty list renders its own quiet line so the
   page holds its shape before the content arrives. */

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
                'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

/* Two date shapes reach this page: free text on events ("16–20 Jun 2025") and
   ISO on press items ("2025-06-18"). Both end up as { dm, year } so the year
   can be set large and the day/month small, as on the Schools page. */
function splitDate(date) {
  const s = String(date || '').trim();
  const iso = s.match(/^(\d{4})(?:-(\d{2}))?(?:-(\d{2}))?$/);
  if (iso) {
    const [, y, m, d] = iso;
    const dm = m ? (d ? String(Number(d)) + ' ' : '') + (MONTHS[Number(m) - 1] || '') : '';
    return { dm: dm.trim(), year: y };
  }
  const m = s.match(/^(.*?)\s*(\d{4})\s*$/);
  return m ? { dm: m[1].trim(), year: m[2] } : { dm: s, year: '' };
}

function DateStamp({ date }) {
  const { dm, year } = splitDate(date);
  return (
    <span className="gl-ds">
      <span className="gl-ds-yr">{year}</span>
      {dm ? <span className="gl-ds-dm">{dm}</span> : null}
    </span>
  );
}

function Empty({ children }) {
  return <p className="gl-empty">{children}</p>;
}

/* An edition can be missing either half — Rome has photos and no video, Sharjah
   the reverse. A held frame of the same size keeps the two columns balanced, so
   a half-documented edition reads as "not shot yet" rather than as a broken
   layout. */
function HeldFrame({ children }) {
  return (
    <div className="gl-frame gl-frame-held">
      <span className="as-c as-tl"></span><span className="as-c as-tr"></span>
      <span className="as-c as-bl"></span><span className="as-c as-br"></span>
      <span className="gl-held">{children}</span>
    </div>
  );
}

/* ── 01 · Our own event media ──────────────────────────────────────

   One rail — Schools — with an event selector on top. Picking an edition
   swaps the body: the single video on the left, the contact sheet of stills
   on the right. Two columns rather than one grid because the two kinds of
   material are read differently — you watch one thing, you scan the other. */

function EventPicker({ items, active, onPick }) {
  /* A native select: the list of editions grows every year, and a row of
     buttons stops being a row long before that becomes a problem. It also
     gives us keyboard and touch behaviour for free. */
  const count = ev => ev.photos.length + (ev.video ? 1 : 0);
  return (
    <div className="gl-pick">
      <label className="gl-pick-l" htmlFor="gl-edition">Edition</label>
      <div className="gl-pick-f">
        <select id="gl-edition" className="gl-pick-s" value={active}
          onChange={e => onPick(Number(e.target.value))}>
          {items.map((ev, i) => (
            <option key={ev.id} value={i}>
              {ev.tab}{count(ev) ? '  ·  ' + count(ev) + ' item' + (count(ev) > 1 ? 's' : '') : '  ·  empty'}
            </option>
          ))}
        </select>
        <span className="gl-pick-c" aria-hidden="true">▾</span>
      </div>
      <span className="gl-pick-n">{String(active + 1).padStart(2, '0')} / {String(items.length).padStart(2, '0')}</span>
    </div>
  );
}

function VideoColumn({ ev }) {
  return (
    <div className="gl-col gl-col-video">
      <div className="gl-col-hd"><span className="k">Video</span></div>
      {ev.video
        ? <figure className="gl-frame gl-frame-v">
            <span className="as-c as-tl"></span><span className="as-c as-tr"></span>
            <span className="as-c as-bl"></span><span className="as-c as-br"></span>
            <video className="gl-media" controls preload="metadata"
              poster={ev.video.poster || undefined} src={ev.video.src} />
            {ev.video.caption
              ? <figcaption className="gl-cap">{ev.video.caption}</figcaption> : null}
          </figure>
        : <HeldFrame>No video on file for this edition</HeldFrame>}
    </div>
  );
}

/* Contact sheet: one lead frame, a counter, and a film strip of every other
   still underneath. Hovering or clicking a frame promotes it; the lead itself
   links to the full file, so no viewer of our own to maintain. */
function PhotoColumn({ ev }) {
  const shots = ev.photos;
  const [lead, setLead] = React.useState(0);
  /* a new edition resets the sheet — otherwise index 7 survives into an
     edition that only has three photos */
  React.useEffect(() => { setLead(0); }, [ev.id]);
  const i = Math.min(lead, Math.max(0, shots.length - 1));
  const cur = shots[i];
  const step = d => setLead((i + d + shots.length) % shots.length);

  return (
    <div className="gl-col gl-col-photos">
      <div className="gl-col-hd">
        <span className="k">Photos</span>
        {shots.length > 1 ? (
          <span className="gl-count">
            {String(i + 1).padStart(2, '0')} / {String(shots.length).padStart(2, '0')}
          </span>
        ) : null}
      </div>
      {shots.length ? (
        <>
          <div className="gl-frame">
            <span className="as-c as-tl"></span><span className="as-c as-tr"></span>
            <span className="as-c as-bl"></span><span className="as-c as-br"></span>
            {/* The stage is the positioning context for the arrows, so they
                centre on the picture itself rather than on the framed block —
                and they sit beside the link rather than inside it, since a
                button nested in an anchor is neither valid nor clickable. */}
            <div className="gl-stage">
              <a className="gl-shot" href={cur.src} target="_blank" rel="noopener noreferrer">
                <img className="gl-media" src={cur.src} alt={cur.caption || ''} />
              </a>
              {shots.length > 1 ? (
                <>
                  <button type="button" className="gl-arrow prev" aria-label="Previous photo"
                    onClick={() => step(-1)}>‹</button>
                  <button type="button" className="gl-arrow next" aria-label="Next photo"
                    onClick={() => step(1)}>›</button>
                </>
              ) : null}
            </div>
            <span className="gl-cap">{cur.caption || 'Open full size ↗'}</span>
          </div>
          {shots.length > 1 ? (
            <div className="gl-strip" role="tablist" aria-label="Photo">
              {shots.map((ph, n) => (
                <button key={ph.src} type="button" role="tab" aria-selected={n === i}
                  tabIndex={n === i ? 0 : -1}
                  className={'gl-thumb' + (n === i ? ' on' : '')}
                  onMouseEnter={() => setLead(n)} onFocus={() => setLead(n)}
                  onClick={() => setLead(n)}>
                  <img src={ph.thumb} alt={ph.caption || 'Photo ' + (n + 1)} loading="lazy"
                    onError={e => { if (e.target.src !== ph.src) e.target.src = ph.src; }} />
                </button>
              ))}
            </div>
          ) : null}
        </>
      ) : <HeldFrame>No photos on file for this edition</HeldFrame>}
    </div>
  );
}

function EventBrowser() {
  const [active, setActive] = React.useState(0);
  if (!events.length) return <Empty>No events on file yet.</Empty>;
  const i = Math.min(active, events.length - 1);
  const ev = events[i];
  return (
    <div className="gl-ev">
      <EventPicker items={events} active={i} onPick={setActive} />
      <div className="gl-ev-hd">
        <span className="gl-ev-pl">{ev.event} · {ev.place}</span>
        <DateStamp date={ev.date} />
      </div>
      <div className="gl-two">
        <PhotoColumn ev={ev} />
        <VideoColumn ev={ev} />
      </div>
    </div>
  );
}

function EventsBlock() {
  return (
    <section className="as-panel gl-tier" aria-label="Event photos and videos">
      <Corners />
      <header className="gl-tier-hd">
        <span className="t">From our events</span>
      </header>
      <Rail n="01" label="Schools" variant="matrix">
        <EventBrowser />
      </Rail>
    </section>
  );
}

/* ── 02 · Press coverage — what others published about us ──────────── */

const PRESS_KIND = {
  article: 'Article', interview: 'Interview',
  radio: 'Radio', tv: 'TV', web: 'Web',
};

function PressRow({ item }) {
  return (
    <div className="gl-news">
      <a className="gl-arow" href={item.url} target="_blank" rel="noopener noreferrer">
        <span className="ds-col"><DateStamp date={item.date} /></span>
        <span className="ao">{item.outlet}</span>
        {/* hovering shows the headline as it was actually published */}
        <span className="at" title={item.title_original || undefined}>{item.title}</span>
        {item.lang && item.lang !== 'en' ? <span className="al">{item.lang}</span> : null}
        <span className="ax">↗</span>
      </a>
      {/* Same two-column shape as the events block above: the written piece on
          the left, the recording on the right. A headline rarely says whether
          a piece is worth opening, and half of these are not in English — the
          note is what a reader who will not follow the link gets to keep. */}
      {item.youtube ? (
        <div className="gl-two gl-news-body">
          <div className="gl-col gl-col-photos">
            <div className="gl-col-hd">
              <span className="k">{PRESS_KIND[item.kind] || 'Article'}</span>
            </div>
            {item.note ? <p className="gl-note">{item.note}</p> : null}
          </div>
          <div className="gl-col gl-col-video">
            <div className="gl-col-hd"><span className="k">Video</span></div>
            {/* nocookie + lazy: the player is only contacted once it scrolls
                into view, and sets no cookie before the viewer presses play */}
            <figure className="gl-embed">
              <span className="as-c as-tl"></span><span className="as-c as-tr"></span>
              <span className="as-c as-bl"></span><span className="as-c as-br"></span>
              <iframe
                src={'https://www.youtube-nocookie.com/embed/' + item.youtube}
                title={item.title || 'Broadcast report'}
                loading="lazy" allowFullScreen
                allow="accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture" />
            </figure>
          </div>
        </div>
      ) : (item.note ? <p className="gl-note">{item.note}</p> : null)}
    </div>
  );
}

function PressBlock() {
  return (
    <section className="as-panel gl-tier" aria-label="Press and public outreach">
      <Corners />
      <header className="gl-tier-hd">
        <span className="t">In the media</span>
      </header>
      <Rail n="02" label="Press coverage" accent="red" variant="matrix">
        {press.length
          ? <div className="gl-arows">{press.map((p, i) => <PressRow key={i} item={p} />)}</div>
          : <Empty>Nothing on record yet — coverage will be listed here as it appears.</Empty>}
      </Rail>
    </section>
  );
}

/* ── page ──────────────────────────────────────────────────────────── */

export function Gallery() {
  return (
    <div className="as-page">
      <SiteNav active="gallery" />
      <PageLayout header={<PageHeader
          section="Gallery"
          kicker="photos and videos"
          title={'Moments from\nour events'}
          lede={<>Photos, videos and <span className="b">press material</span> from our schools, hackathons and events.</>} />} >
        <div className="gl-page">
          <EventsBlock />
          <PressBlock />
        </div>
      </PageLayout>
      <SiteFooter />
    </div>
  );
}
