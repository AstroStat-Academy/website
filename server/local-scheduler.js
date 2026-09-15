// Runs only inside the local Vite server; Vercel uses its configured cron job.
export function nextRefreshDelay(now = Date.now()) {
  const next = new Date(now);
  next.setUTCHours(6, 0, 0, 0);
  if (next.getTime() <= now) next.setUTCDate(next.getUTCDate() + 1);
  return next.getTime() - now;
}

export function startLocalScheduler(service, { now = Date.now, schedule = setTimeout, cancel = clearTimeout, log = console.log } = {}) {
  let stopped = false;
  let timer;
  async function refresh() {
    try {
      const data = await service.getPapers({ refresh: true });
      if (!stopped) log(`[papers] Local refresh complete: ${data.count} papers.`);
    } catch {
      if (!stopped) log('[papers] Local refresh failed; previous results retained. Page visits can retry.');
    } finally {
      if (!stopped) {
        const delay = nextRefreshDelay(now());
        timer = schedule(refresh, delay);
        timer?.unref?.();
        log(`[papers] Next local refresh: ${new Date(now() + delay).toISOString()}`);
      }
    }
  }
  void refresh();
  return () => { stopped = true; if (timer) cancel(timer); };
}
