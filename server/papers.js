import { createHash } from 'node:crypto';
import { ADS_QUERY, AdsError, searchAcknowledgingPapers } from './ads.js';

export const FRESH_FOR_MS = 24 * 60 * 60 * 1000;
const RETAIN_FOR_SECONDS = 7 * 24 * 60 * 60;
const RETRY_AFTER_MS = 5 * 60 * 1000;
// Include the query in the key so changed search terms cannot reuse older results.
export const CACHE_KEY = `astrostat:acknowledging-papers:v1:${createHash('sha256').update(ADS_QUERY).digest('hex')}`;

export function createMemoryCache() {
  const entries = new Map();
  return {
    async get(key) {
      const entry = entries.get(key);
      return entry && entry.expires > Date.now() ? entry.value : undefined;
    },
    async set(key, value, { ttl }) { entries.set(key, { value, expires: Date.now() + ttl * 1000 }); },
  };
}

export function createPapersService({ cache, token = () => process.env.ADS_TOKEN, search = searchAcknowledgingPapers, now = Date.now }) {
  let lastGood;
  let inFlight;
  let retryAfter = 0;
  const valid = data => data?.query === ADS_QUERY && Array.isArray(data.papers) && Number.isFinite(Date.parse(data.updated));

  async function getPapers({ refresh = false } = {}) {
    let saved;
    try { saved = await cache.get(CACHE_KEY); } catch { /* Cache misses can be recovered from ADS. */ }
    if (valid(saved?.data) && (!lastGood || Date.parse(saved.data.updated) > Date.parse(lastGood.updated))) lastGood = saved.data;
    retryAfter = Math.max(retryAfter, saved?.retryAfter || 0);
    if (!refresh && lastGood && now() - Date.parse(lastGood.updated) < FRESH_FOR_MS) {
      return { ...lastGood, stale: false };
    }
    if (!refresh && now() < retryAfter) {
      if (lastGood) return { ...lastGood, stale: true };
      throw new AdsError('ADS_RETRY_LATER');
    }
    if (inFlight) return inFlight;

    inFlight = (async () => {
      let data;
      try {
        data = await search({ token: token(), now });
      } catch (error) {
        retryAfter = now() + RETRY_AFTER_MS;
        try { await cache.set(CACHE_KEY, { data: lastGood, retryAfter }, { ttl: RETAIN_FOR_SECONDS }); } catch { /* Keep the local fallback. */ }
        if (lastGood && !refresh) return { ...lastGood, stale: true };
        throw error;
      }
      lastGood = data;
      retryAfter = 0;
      // A scheduled refresh must report a failed shared-cache write, not claim success.
      try { await cache.set(CACHE_KEY, { data, retryAfter: 0 }, { ttl: RETAIN_FOR_SECONDS }); }
      catch { if (refresh) throw new AdsError('CACHE_WRITE_FAILED'); }
      return { ...data, stale: false };
    })();
    try { return await inFlight; } finally { inFlight = undefined; }
  }

  return { getPapers };
}
