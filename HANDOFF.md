# AstroStat Academy — website handoff

## Current state

This is now a Vite + React website. `npm run dev` serves the actual home page
at `/`; `npm run build` generates a deployable `dist/` tree. See `README.md`
for setup, route URLs, the folder map and browser tests.

The old no-build/CDN instructions apply only to the retained design reference.
The previous handoff is preserved as `docs/DESIGN-HANDOFF.md` inside
`archive/design-reference.tar.gz`.

## Working source

- `src/pages/`: live page components.
- `src/components/`: shared navigation, footer, effects and service hero.
- `src/routes.js`: canonical routes, navigation labels and legacy redirects.
- `components/PageHeader/`: the default Hackathons-style header card. It owns
  the frame, channel bar, code rain and two-column body. Its right panel stays
  empty unless `aside` is explicitly supplied. Acknowledge places the credit
  text and copy button there; People leaves it empty and keeps the roster
  below. Only the existing home wordmark uses `variant="home"`.
- `styles.css`, `colors_and_type.css`, `css/`: original shared style layers,
  with their cascade order preserved.
- `src/styles/site.css`: live-site link, focus and responsive rules.
- `assets/people/people.yml`: still the roster source of truth.
- `public/assets`: symlink to `../assets`; Vite serves/copies this one source.

The live pages use explicit imports/exports. There are no window-global module
exports, CDN React/Babel dependencies or `_ds_bundle.js` runtime dependencies
in the live site. Browser APIs such as `window.matchMedia` are still used for
interactive effects.

## Pages and deployment

Home `/`, Schools `/schools/`, Hackathons `/hackathons/`, Consulting
`/consulting/`, People `/people/`, Gallery `/gallery/`, Acknowledge us `/acknowledge/`.

Gallery appears immediately before Acknowledge us in the navigation. It uses
the default header with an empty right panel and a short introduction for
event photos, videos and press material. Media collections can be added below.

Each route gets a real `index.html` in the build. Navigation uses regular
anchors; opening a deep link or refreshing works with ordinary static hosting.
Deploy `dist/` at the domain root and use its `404.html` for missing pages.
This is client-rendered React, not server-rendered HTML.

## Design reference and remaining scope

The original prototypes, previews, generated design artifacts, deployment tree
and historical notes are archived in `archive/design-reference.tar.gz`. The
visual ground truth is `site/Site Overview.html` inside that package. Shared
style and active asset snapshots are included so the overview can be served
from an extracted copy. The archive includes a verified SHA-256 manifest.

The obsolete exports, UI kits, scratch uploads, thumbnails, unused black logo
at `assets/logo.svg`, and unused Grigoris PNG were deleted. Some historical
preview links to those files are consequently unavailable. The `dev:design`
script was removed. Live shared styles and the canonical PageHeader remain in
the project. Neither `dist/` nor `node_modules/` was removed during cleanup.

Contact CTAs retain email-copy behavior. Papers now use the NASA ADS API through
`api/papers.js`, with a dated committed snapshot as fallback. `server/` owns the
exact two acknowledgement phrase queries and 24-hour cache; `vercel.json` schedules
a protected daily refresh. Deploy the repository to Vercel and configure ADS_TOKEN
and CRON_SECRET from the gitignored local `.env`; see README.md for setup. Existing school dates and URLs
remain as supplied. Google Fonts remains external. Existing prototype colour
literals and content are not normalized in this structural migration.

`npm test` runs the new server tests in `tests/server/`. The original browser
test sources remain absent; the historical Playwright configuration is retained.

Local Vite dev/preview servers refresh papers on startup and daily at 06:00 UTC
when ADS_TOKEN is configured. The scheduler stops with the server and updates its
in-memory API cache; it does not rewrite the committed snapshot.
