// Server-only: never import this module into src/ or expose ADS_TOKEN via VITE_*.
export const ACKNOWLEDGEMENT_PHRASES = [
  'We wish to thank the "Summer School for Astrostatistics in Crete" for providing training on the statistical methods adopted in this work.',
  'We wish to thank the AstroStat Academy for providing training on the analysis methods adopted in this work.',
];

export const ADS_QUERY = ACKNOWLEDGEMENT_PHRASES
  .map(phrase => `full:"${phrase.replace(/[\\"]/g, '\\$&')}"`)
  .join(' OR ');

export class AdsError extends Error {
  constructor(code) {
    super(code);
    this.name = 'AdsError';
    this.code = code;
  }
}

export function normalisePaper(doc) {
  if (typeof doc.bibcode !== 'string' || !Array.isArray(doc.title) || !doc.title[0]) {
    throw new AdsError('ADS_INVALID_RESPONSE');
  }
  const arxiv = (doc.identifier || []).find(id => /^arxiv:/i.test(id))?.replace(/^arxiv:/i, '') || null;
  return {
    bibcode: doc.bibcode,
    title: doc.title[0],
    authors: Array.isArray(doc.author) ? doc.author : [],
    year: Number(doc.year) || null,
    pubdate: doc.pubdate || null,
    journal: doc.pub || null,
    doi: doc.doi?.[0] || null,
    arxiv,
    url: arxiv ? `https://arxiv.org/abs/${encodeURIComponent(arxiv)}` : `https://ui.adsabs.harvard.edu/abs/${encodeURIComponent(doc.bibcode)}`,
    citations: Number.isFinite(doc.citation_count) ? doc.citation_count : null,
  };
}

export async function searchAcknowledgingPapers({ token, fetchImpl = fetch, now = Date.now } = {}) {
  if (!token?.trim()) throw new AdsError('ADS_NOT_CONFIGURED');
  const papers = new Map();
  const signal = AbortSignal.timeout(25_000);
  let start = 0;
  let total = Infinity;

  while (start < total) {
    const url = new URL('https://api.adsabs.harvard.edu/v1/search/query');
    url.search = new URLSearchParams({
      q: ADS_QUERY,
      fl: 'bibcode,title,author,year,pubdate,pub,doi,identifier,citation_count',
      rows: '200', start: String(start), sort: 'date desc,bibcode asc',
    }).toString();
    let response;
    try {
      response = await fetchImpl(url, {
        headers: { Authorization: `Bearer ${token.trim()}`, Accept: 'application/json' },
        signal, redirect: 'error',
      });
    } catch {
      throw new AdsError(signal.aborted ? 'ADS_TIMEOUT' : 'ADS_UNAVAILABLE');
    }
    if (!response.ok) throw new AdsError(`ADS_HTTP_${response.status}`);
    let data;
    try { data = await response.json(); } catch { throw new AdsError('ADS_INVALID_RESPONSE'); }
    const result = data.response;
    if (!result || !Number.isInteger(result.numFound) || result.numFound < 0 || !Array.isArray(result.docs)) {
      throw new AdsError('ADS_INVALID_RESPONSE');
    }
    total = result.numFound;
    if (total > 10_000) throw new AdsError('ADS_RESULT_LIMIT');
    if (result.docs.length === 0 && start < total) throw new AdsError('ADS_INCOMPLETE_RESPONSE');
    for (const doc of result.docs) {
      const paper = normalisePaper(doc);
      papers.set(paper.bibcode, paper);
    }
    start += result.docs.length;
  }

  return { updated: new Date(now()).toISOString(), source: 'ads', query: ADS_QUERY, count: papers.size, papers: [...papers.values()] };
}
