import test from 'node:test';
import assert from 'node:assert/strict';
import { nextRefreshDelay, startLocalScheduler } from '../../server/local-scheduler.js';

test('local schedule targets next 06:00 UTC, including day rollover', () => {
  assert.equal(nextRefreshDelay(Date.parse('2026-09-15T05:00:00Z')), 3600000);
  assert.equal(nextRefreshDelay(Date.parse('2026-09-15T06:00:00Z')), 86400000);
  assert.equal(nextRefreshDelay(Date.parse('2026-12-31T23:00:00Z')), 7*3600000);
});

test('refreshes immediately, schedules again after failure, and stops cleanly', async () => {
  let calls=0, callback, cancelled;
  const timer={unref(){}};
  const stop=startLocalScheduler({getPapers:async options=>{
    assert.equal(options.refresh,true); calls++;
    if(calls===2) throw Error('private upstream detail');
    return {count:21};
  }},{now:()=>Date.parse('2026-09-15T05:00:00Z'),schedule:(fn,delay)=>{
    callback=fn; assert.equal(delay,3600000); return timer;
  },cancel:t=>{cancelled=t;},log:()=>{}});
  await new Promise(resolve=>setImmediate(resolve));
  assert.equal(calls,1);
  await callback(); assert.equal(calls,2);
  stop(); assert.equal(cancelled,timer);
});
