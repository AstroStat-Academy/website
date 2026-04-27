# CLAUDE.md — AstroStat Academy Website

## Project overview
This is the official website for AstroStat Academy, an organization running
statistics schools and workshops for astronomers. Built with Astro + React + Tailwind.

## Stack
- Astro 4.x (site framework, routing, content collections)
- React 18 (interactive components only, via Astro islands)
- Tailwind CSS (styling)
- Plotly.js via react-plotly.js (charts)
- React Hook Form (forms)
- TypeScript throughout

## Key conventions
- All content lives in src/content/ as Markdown files with typed frontmatter
- React components are only used when interactivity is needed (charts, forms, filters)
- Everything else should be plain Astro components (.astro files) for SEO
- Component files go in src/components/, organized by feature (schools/, ui/, charts/)
- Page files go in src/pages/
- Use Tailwind utility classes directly, no custom CSS unless unavoidable
- All TypeScript types for content collections are defined in src/content/config.ts

## Content collections
- schools: one .md per event, schema defined in src/content/config.ts
- videos: stub, not yet active
- consulting: stub, not yet active

## Style guidelines
- Dark academic theme: deep navy/slate backgrounds, electric blue or teal accents
- Font: system font stack or a clean sans-serif from Google Fonts
- Mobile-first responsive design

## Deployment
- Build with: npm run build
- Output folder: dist/
- Upload dist/ to server via FTP or rsync
- Server: Apache or Nginx, static files only, no Node.js on server

## Do not
- Do not add a backend or database
- Do not use any CSS framework other than Tailwind
- Do not use client-side routing (Astro handles routing statically)
- Do not put business logic inside .astro files — keep it in .ts utility files or React components