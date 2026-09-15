# AstroStat Academy — house rules (read before editing anything)

## Page headers — NON-NEGOTIABLE
Every page, exploration, and template header uses **`PageHeader`**
(`components/PageHeader/`) — the Hackatons hero formatting, now the default:
panel frame + corner marks, channel bar (`// <program> · <section>` left,
status right), mono kicker `// <section> — <kicker>`, 46px/-.03em display title
(`\n` = line break), 17px semibold lede.

Never hand-roll a page header, and never substitute the generic classes
(`as-eyebrow`, `as-h1pg`, `as-p`) for one.

The default `PageHeader` owns the entire Hackathons-style card, including
corner marks, channel bar, code rain, and a two-column body. Its right panel
is empty unless content is explicitly passed through `aside`. Put page body
content below the header. Acknowledge uses `aside` for its copyable credit text;
People leaves it empty. Only the existing home wordmark uses `variant="home"`.

## Colour & type
Only tokens from `colors_and_type.css`: `--blue` #0465ad, `--red` #8c0527,
`--bone`, `--ink`, `--teal`, their `*-rgb` triplets for alpha, and
`--font-sans` / `--font-mono` / `--font-*` sizes. No new hex values, ever.
Active/current = blue. Past/legacy = red.

## People data
`assets/people/people.yml` is the source of truth for the roster.
