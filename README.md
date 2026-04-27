# AstroStat Academy Website

Official website for [AstroStat Academy](https://astrostat.academy/), an organisation running statistics schools and workshops for astronomers.

## Stack

- [Astro 4](https://astro.build/) — static site generation, routing, content collections
- [React 18](https://react.dev/) — interactive islands (charts, filters, forms)
- [Tailwind CSS 3](https://tailwindcss.com/) — styling
- [Plotly.js](https://plotly.com/javascript/) — attendance charts
- [React Hook Form](https://react-hook-form.com/) — registration/interest forms
- TypeScript throughout

## Getting started

```bash
npm install
npm run dev       # http://localhost:4321
npm run build     # output to dist/
npm run preview   # preview the built site locally
```

## Adding a school

Drop a Markdown file in `src/content/schools/`. The filename becomes the URL slug.

```
src/content/schools/my-school-2025.md  →  /schools/my-school-2025
```

### Required frontmatter

```yaml
---
title: "AstroStat Summer School 2025"
date: 2025-07-14            # start date
endDate: 2025-07-25         # end date (optional but recommended)
location: "Garching, Germany"
description: "One-paragraph summary shown in listings and used as the meta description."
lecturers:
  - name: "Dr. Jane Smith"
    affiliation: "ESO"       # optional
    url: "https://..."       # optional
topics:
  - "Bayesian inference"
  - "MCMC methods"
attendees: 52               # optional — enables the attendance chart
applicationUrl: "https://astrostat.academy/apply"   # optional
tags: ["bayesian", "2025"]  # optional, used by future filters
---

Write the full school description here in Markdown.
```

The site automatically:
- shows the school in the homepage **Upcoming** or **Past** section based on `endDate` (or `date` if no `endDate`)
- generates `/schools/<slug>` with lecturers, topics, and a Plotly attendance chart (if `attendees` is set)
- includes the school in the year/topic filter on `/schools`

## Project structure

```
src/
├── content/
│   ├── config.ts               # Zod schemas for all content collections
│   ├── schools/                # one .md per event
│   ├── videos/                 # stub (coming soon)
│   └── consulting/             # stub (coming soon)
├── layouts/
│   └── BaseLayout.astro        # HTML shell shared by all pages
├── components/
│   ├── ui/
│   │   ├── Nav.astro
│   │   └── Footer.astro
│   ├── schools/
│   │   ├── SchoolCard.astro    # static card (used on homepage)
│   │   └── SchoolFilter.tsx    # React island — year/topic dropdowns
│   ├── charts/
│   │   └── AttendanceChart.tsx # React island — Plotly bar chart
│   └── forms/
│       └── ApplicationForm.tsx # React island — interest form
└── pages/
    ├── index.astro             # homepage
    ├── about.astro
    ├── videos.astro            # stub
    ├── consulting.astro        # stub
    └── schools/
        ├── index.astro         # /schools listing
        └── [slug].astro        # /schools/<slug> detail page
```

## Wiring up the interest form

`ApplicationForm.tsx` is a stub. The `onSubmit` handler simulates a delay and does nothing. Before going live, replace the stub with a real endpoint:

```ts
// src/components/forms/ApplicationForm.tsx
const onSubmit = async (data: FormValues) => {
  setServerError('');
  try {
    await fetch('https://formspree.io/f/YOUR_ID', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ school: schoolTitle, ...data }),
    });
    setSubmitted(true);
    reset();
  } catch {
    setServerError('Something went wrong. Please try again or email us directly.');
  }
};
```

Options: [Formspree](https://formspree.io/), [Netlify Forms](https://www.netlify.com/products/forms/), or your own API endpoint.

## Deployment

The build output is a folder of static files — no Node.js required on the server.

```bash
npm run build        # generates dist/
rsync -av dist/ user@server:/var/www/astrostat.academy/
```

Or upload `dist/` via FTP. The server just needs to serve static files (Apache or Nginx).

## Theme

Dark academic: `navy-900` (#070d1a) background, `accent-teal` (#14b8a6) and `accent-blue` (#3b82f6) accents. Colors are defined in `tailwind.config.mjs` under `theme.extend.colors`.
