import { timingSafeEqual } from 'node:crypto';

function authorised(actual, secret) {
  if (!secret || typeof actual !== 'string') return false;
  const expected = Buffer.from(`Bearer ${secret}`);
  const supplied = Buffer.from(actual);
  return expected.length === supplied.length && timingSafeEqual(expected, supplied);
}

export function createPapersHandler({ service, refresh = false, cronSecret = () => process.env.CRON_SECRET }) {
  return async function handler(req, res) {
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.setHeader('Cache-Control', 'no-store');
    res.setHeader('Vercel-CDN-Cache-Control', 'no-store');
    res.setHeader('X-Content-Type-Options', 'nosniff');
    const send = (status, data) => { res.statusCode = status; res.end(JSON.stringify(data)); };
    if (req.method !== 'GET') {
      res.setHeader('Allow', 'GET');
      return send(405, { error: 'Method not allowed.' });
    }
    if (refresh && !authorised(req.headers.authorization, cronSecret())) {
      return send(401, { error: 'Unauthorized.' });
    }
    try {
      const data = await service.getPapers({ refresh });
      return send(200, refresh ? { refreshed: true, updated: data.updated, count: data.count } : data);
    } catch (error) {
      // Never forward upstream bodies, request headers or tokens to visitors/logs.
      const code = typeof error.code === 'string' && /^(ADS_[A-Z0-9_]+|CACHE_WRITE_FAILED)$/.test(error.code) ? error.code : 'ADS_UNAVAILABLE';
      console.warn(`[papers] ${code}`);
      return send(503, { error: 'The paper list is temporarily unavailable.' });
    }
  };
}
