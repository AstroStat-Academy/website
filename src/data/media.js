import { load } from 'js-yaml';
import mediaSource from '../../assets/media/media.yml?raw';

// assets/media/media.yml stays hand-editable; Vite bundles it locally.
const data = load(mediaSource) || {};

const BASE = '/assets/media/';

/* Paths in the YAML are relative to assets/media/ so the file stays short and
   the folder can move in one place. */
const resolve = p => (p ? BASE + String(p).replace(/^\/+/, '') : '');

/* YAML resolves a bare 2025-06-18 to a Date; the page wants the literal the
   author typed. Anything already a string (a free-text event date, or a
   partial "2024-11") passes through untouched. */
const asDate = d => (d instanceof Date
  ? d.toISOString().slice(0, 10)
  : (d == null ? '' : String(d)));

export const events = (data.events || []).map(e => ({
  ...e,
  date: asDate(e.date),
  tab: e.tab ? String(e.tab) : e.event,
  /* One video per edition, so it is a field and not a list — the page gives it
     a column of its own rather than a slot in a grid. */
  video: e.video && e.video.file
    ? { ...e.video, src: resolve(e.video.file),
        poster: e.video.poster ? resolve(e.video.poster) : '' }
    : null,
  /* The strip draws 74px squares; without a small file it would pull the full
     frame for each one. By convention the thumbnail is the same name under a
     thumbs/ folder next to the photo — the page falls back to the full image
     if that file was never generated, so the convention can stay implicit. */
  photos: (e.photos || []).map(ph => ({
    ...ph,
    src: resolve(ph.file),
    thumb: resolve(ph.thumb || String(ph.file).replace(/([^/]+)$/, 'thumbs/$1')),
  })),
}));

export const press = (data.press || [])
  .map(p => ({ ...p, date: asDate(p.date) }))
  .sort((a, b) => b.date.localeCompare(a.date));

/* The Schools page shows the same Sharjah recording in its Method section.
   Both pages read it from here so the path and caption live in one file. */
export const videoFor = id => (events.find(e => e.id === id) || {}).video || null;
export const eventFor = id => events.find(e => e.id === id) || null;
