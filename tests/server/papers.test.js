import test from 'node:test';
import assert from 'node:assert/strict';
import { ADS_QUERY, searchAcknowledgingPapers } from '../../server/ads.js';
import { createMemoryCache, createPapersService, FRESH_FOR_MS } from '../../server/papers.js';
import { createPapersHandler } from '../../server/papers-handler.js';

const payload = (now, papers = []) => ({ query: ADS_QUERY, updated: new Date(now).toISOString(), papers, count: papers.length });

test('ADS sends both complete phrases with escaped nested quotes; paginates and deduplicates', async () => {
  assert.equal(ADS_QUERY, 'full:"We wish to thank the \\"Summer School for Astrostatistics in Crete\\" for providing training on the statistical methods adopted in this work." OR full:"We wish to thank the AstroStat Academy for providing training on the analysis methods adopted in this work."');
  let calls = 0;
  const data = await searchAcknowledgingPapers({ token: 'test-token', fetchImpl: async (url, options) => {
    assert.equal(url.origin, 'https://api.adsabs.harvard.edu');
    assert.equal(url.searchParams.get('q'), ADS_QUERY);
    assert.equal(url.searchParams.get('start'), String(calls++));
    assert.equal(options.headers.Authorization, 'Bearer test-token');
    return { ok: true, json: async () => ({ response: {numFound: 2, docs: [{bibcode: 'paper', title:['Title'], author:['Author'], year:'2025', identifier:['arXiv:2501.12345']}] } }) };
  }});
  assert.equal(calls, 2);
  assert.equal(data.count, 1);
  assert.equal(data.papers[0].url, 'https://arxiv.org/abs/2501.12345');
  assert.ok(!JSON.stringify(data).includes('test-token'));
});

test('missing credentials, upstream errors and incomplete data fail without a false empty list', async () => {
  await assert.rejects(searchAcknowledgingPapers(), {code:'ADS_NOT_CONFIGURED'});
  await assert.rejects(searchAcknowledgingPapers({token:'fake',fetchImpl:async()=>({ok:false,status:401})}), {code:'ADS_HTTP_401'});
  await assert.rejects(searchAcknowledgingPapers({token:'fake',fetchImpl:async()=>({ok:true,json:async()=>({response:{numFound:1,docs:[]}})})}), {code:'ADS_INCOMPLETE_RESPONSE'});
});

test('24h cache includes empty results; cron refresh reaches a separate service', async () => {
  let now = Date.now(); let calls = 0;
  const cache = createMemoryCache();
  const search = async () => { calls++; return payload(now); };
  const a = createPapersService({cache,search,now:()=>now});
  const b = createPapersService({cache,search,now:()=>now});
  await a.getPapers(); await b.getPapers(); assert.equal(calls,1);
  now += FRESH_FOR_MS - 1; await a.getPapers(); assert.equal(calls,1);
  now++; await b.getPapers(); assert.equal(calls,2);
  now++; await a.getPapers({refresh:true}); assert.equal(calls,3);
  const result = await b.getPapers(); assert.equal(result.updated,new Date(now).toISOString()); assert.equal(calls,3);
});

test('ADS outage retains the last good list and backs off; cron reports failure', async () => {
  let now=Date.now(), fail=false, calls=0;
  const service=createPapersService({cache:createMemoryCache(),now:()=>now,search:async()=>{
    calls++; if(fail) throw new Error('upstream'); return payload(now,[{bibcode:'kept'}]);
  }});
  await service.getPapers(); now+=FRESH_FOR_MS; fail=true;
  assert.equal((await service.getPapers()).stale,true);
  assert.equal((await service.getPapers()).papers[0].bibcode,'kept'); assert.equal(calls,2);
  await assert.rejects(service.getPapers({refresh:true}));
});

test('concurrent misses share one lookup and cron requires a successful cache write', async () => {
  let calls=0;
  const service=createPapersService({cache:createMemoryCache(),search:async()=>{calls++; await new Promise(r=>setTimeout(r,10)); return payload(Date.now());}});
  await Promise.all([service.getPapers(),service.getPapers(),service.getPapers()]); assert.equal(calls,1);
  const broken=createPapersService({cache:{get:async()=>null,set:async()=>{throw Error();}},search:async()=>payload(Date.now())});
  await assert.rejects(broken.getPapers({refresh:true}),{code:'CACHE_WRITE_FAILED'});
});

async function request(handler, {method='GET',authorization}={}) {
  const headers={}; let body;
  const res={setHeader:(k,v)=>{headers[k]=v;},end:v=>{body=JSON.parse(v);}};
  await handler({method,headers:{authorization}},res);
  return {status:res.statusCode,headers,body};
}

test('cron rejects absent/wrong secrets and non-GET requests before performing work', async () => {
  let calls=0;
  const handler=createPapersHandler({refresh:true,cronSecret:()=> 'secret',service:{getPapers:async({refresh})=>{assert.equal(refresh,true);calls++;return payload(Date.now());}}});
  assert.equal((await request(handler)).status,401);
  assert.equal((await request(handler,{authorization:'Bearer wrong'})).status,401);
  assert.equal((await request(handler,{method:'POST',authorization:'Bearer secret'})).status,405);
  assert.equal(calls,0);
  const result=await request(handler,{authorization:'Bearer secret'});
  assert.equal(result.status,200); assert.equal(result.body.refreshed,true);
  assert.equal(result.headers['Cache-Control'],'no-store'); assert.equal(calls,1);
});

test('public API sanitizes upstream errors',async()=>{
  const handler=createPapersHandler({service:{getPapers:async()=>{throw Error('Bearer sensitive-value');}}});
  const result=await request(handler);
  assert.equal(result.status,503); assert.ok(!JSON.stringify(result).includes('sensitive-value'));
});
