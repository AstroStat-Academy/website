# AstroStat Academy

The AstroStat Academy website, built with React and Vite. Home, Schools,
Hackathons, Consulting, People, Gallery and Acknowledge us share one navigation and design
system. React and JSX are compiled locally; the live site does not load React,
Babel, or the generated design-system bundle from a CDN.

## Run locally

Use Node.js 22.12+ (or 20.19+) and npm.

```sh
npm ci
npm run dev
```

Open **http://localhost:4321/**. The root is the actual home page.
If the port is occupied, use `npm run dev -- --port 4323`.
`npm start` also starts the development server.

## Build and preview

```sh
npm run build
npm run preview
```

For automatic paper discovery, deploy this repository to **Vercel** (see below).
The contents of `dist/` can also be deployed to a static host, using only the
committed paper snapshot. Every
route has its own HTML entry, so direct visits and refreshes work without a
server rewrite to the home page. Page content is rendered by React in the
browser. Configure the host to use `404.html` for missing pages.

| Page | URL |
| --- | --- |
| Home | `/` |
| Schools | `/schools/` |
| Hackathons | `/hackathons/` |
| Consulting | `/consulting/` |
| People | `/people/` |
| Gallery | `/gallery/` |
| Acknowledge us | `/acknowledge/` |

Selected old `.html` URLs and the old `/hackatons/` spelling redirect to the
new routes. Regular anchors support opening new tabs and browser back/forward.

## Project structure

```text
index.html                 Website entry point
src/
  main.jsx                 React startup and page metadata
  App.jsx                  Route-to-page mapping
  routes.js                Shared URLs, labels, descriptions and redirects
  pages/                   Home, Schools, People, Gallery and Acknowledge pages
  components/              Navigation, footer, rails, effects and service hero
  data/                    School data parsing and globe geometry
  styles/site.css          Link behavior and responsive website rules
public/
  assets -> ../assets      Public assets, linked to the canonical source
assets/
  people/people.yml        Roster source of truth; profiles and photos alongside it
  schools/data/            School editions and participant statistics
  papers.json              Committed papers snapshot
components/PageHeader/     Default framed page header
styles.css                 Shared stylesheet entry, preserving import order
colors_and_type.css        Shared colour and typography tokens
css/                       Original design layers
vite.config.js             Build config, static page entries and legacy redirects
archive/                   Compressed historical design reference
dist/                      Generated website (ignored by git)
```

`public/assets` is a relative symbolic link, so there is only one editable roster
and asset tree. Vite copies its contents into `dist/assets` during builds. Keep
that link intact when copying the repository.

Contact buttons retain the design's email-copy interaction. The papers list
loads `/api/papers`, with `assets/papers.json` as an outage/static-host fallback. School edition URLs and programme content
come directly from the supplied YAML. Fonts currently load from Google Fonts.

## Editing

- Change website pages in `src/pages/` and shared UI in `src/components/`.
- Add or change routes in `src/routes.js`, then map their component in `src/App.jsx`.
- All page headers use `components/PageHeader/`. The default is the Hackathons
  card: corner marks, channel bar, animated code rain, 46px title, 17px lede,
  and a two-column body. The right panel is empty unless `aside` is supplied.
  People leaves it empty; Acknowledge supplies the credit text and copy button.
  Place page content below the header. Only the existing home wordmark uses
  `variant="home"`.
- Inner pages use `src/components/PageLayout.jsx`: it owns the shared 14px gap
  between the header and first content block. Header styling lives alongside
  the component in `components/PageHeader/PageHeader.css`. People uses the
  same column proportions and standard Rail gutters; its terminal stays sticky.
- With the local server running, verify all header alignments using
  `node tests/layout/page-layout.mjs`. Set `TEST_BASE_URL` if using another port.
  The check covers desktop, tablet and phone widths and preserves Home's hero.
- Shared CSS retains the original cascade. Website-only responsive rules live
  in `src/styles/site.css` so the design canvas stays unchanged.
- Follow `AGENTS.md` for tokens, typography and roster rules. Existing off-palette
  literals were carried over from the prototype; palette cleanup is separate work.

## Automatic acknowledgement discovery

`server/ads.js` searches NASA ADS full text for these complete phrases joined by `OR`:

- We wish to thank the "Summer School for Astrostatistics in Crete" for providing training on the statistical methods adopted in this work.
- We wish to thank the AstroStat Academy for providing training on the analysis methods adopted in this work.

Nested quotes are escaped for ADS. This is an indexed phrase search: ADS normalizes
text and punctuation, so it is not a byte-for-byte comparison against PDFs. Only
papers covered by its full-text index can appear. Different acknowledgement wording
is intentionally excluded. See [ADS search syntax](https://ui.adsabs.harvard.edu/help/search/search-syntax).

### Local setup

Copy `.env.example` to `.env` only if `.env` does not already exist. Set `ADS_TOKEN`
and a random `CRON_SECRET`. The supplied token and a generated cron secret are
already configured locally. `.env` is ignored by Git; never use a `VITE_` prefix
for credentials. `npm run dev` and `npm run preview` load these server-side and
serve the API using a local memory cache. With `ADS_TOKEN` configured, they also
refresh immediately on startup and then daily at **06:00 UTC**, without requiring
a page visit. Keep the server running and the computer awake for scheduled runs.
Stopping the server stops the scheduler; restarting it performs a fresh lookup.
Reload the acknowledgement page to see new results. Local refreshes update the
running server's cache, not the committed `assets/papers.json` fallback. The local
scheduler calls the service directly and does not require `CRON_SECRET`.

### Vercel setup

1. Import this repository into Vercel. The checked-in `vercel.json` configures Vite
   and the two Node serverless functions.
2. Add `ADS_TOKEN` and `CRON_SECRET` from your local `.env` to the production
   environment variables (and preview variables if desired), then deploy.
3. `/api/papers` supplies public metadata. `/api/refresh-papers` requires
   `Authorization: Bearer <CRON_SECRET>`. Vercel supplies this header automatically
   for the configured daily cron at 06:00 UTC. Cron runs on production deployments;
   timing on Hobby may vary within the scheduled hour.

The two functions share [Vercel Runtime Cache](https://vercel.com/docs/caching/runtime-cache)
in `iad1`. Results are fresh for 24 hours. Cache misses query ADS on demand; daily
cron forces a refresh. Cache entries retain the last successful result for up to
seven days, with a five-minute retry delay after upstream failures. Runtime Cache
can evict entries; it is not permanent storage. The dated committed snapshot is the
browser fallback when the endpoint is unavailable. CDN response caching is disabled
so cron updates are immediately visible on the next page load.

No additional database is required. Do not deploy just `dist/` if you want the
API and cron. See [Vercel cron security](https://vercel.com/docs/cron-jobs/manage-cron-jobs).
The initial snapshot contains 21 matches, fetched on 2026-09-15.

### Server files and tests

- `api/`: public lookup and authenticated scheduled-refresh entry points.
- `server/`: ADS query, metadata normalization, cache and HTTP handlers.
- `vercel.json`: deployment region, function timeout and daily schedule.
- `tests/server/`: query, pagination, caching, outage and authentication tests.

Run `npm test` and `npm run build`. The historical Playwright configuration is
retained, but its original browser test sources are absent from this checkout.

