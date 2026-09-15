# People assets

Headshots and bio assets for the People page, organised by role.

Photography is the one place the brand uses real imagery (the rest is
generative canvas). Drop each person's headshot into the subfolder for their
role.

**File convention:** `firstname-lastname.jpg` (lowercase, hyphenated).
Square crop, ≥800×800px, neutral/dark background preferred to sit on the
black canvas.

## Bios & the People page

`people.yml` (in this folder) is the **roster / source of truth**. It lists,
per role, an ordered set of slugs — nothing else:

```yaml
councellors:
  - paolo-bonfini
lecturers:
  - andreas-tersenov
```

Each slug loads two **independent files** from the matching role folder:

- `<role>/<slug>.md` — the person's bio + metadata (front-matter: `name`,
  `affiliation`, `title`, `photo`, `links`; markdown body = the bio).
- `<role>/<slug>.jpg` — the headshot (optional; falls back to an initials
  avatar).

So:

- **Remove someone from the page** → delete their line in `people.yml`. Their
  `.md`/`.jpg` stay on disk untouched; re-add the line to bring them back.
- **Edit a bio / title / photo** → edit that person's `.md` (or swap the jpg).
- **Add someone** → drop `<slug>.md` (+ `<slug>.jpg`) in the role folder, then
  add `- <slug>` under the right role in `people.yml`.

The website People page (`ui_kits/website/people.jsx`) reads all of this live.

## Roles

- **councellors/** — Academy leadership / founders.
- **lecturers/** — Teaching faculty across the schools & workshops.
- **TAs/** — Teaching assistants supporting the schools & workshops.
- **advisors/** — Advisory / scientific board.
