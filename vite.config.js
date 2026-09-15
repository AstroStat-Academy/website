import { defineConfig, loadEnv } from 'vite';
import { createMemoryCache, createPapersService } from './server/papers.js';
import { startLocalScheduler } from './server/local-scheduler.js';
import { createPapersHandler } from './server/papers-handler.js';
import react from '@vitejs/plugin-react';
import { routes, aliases } from './src/routes.js';

function pageMetadata(html, route) {
  return html.replace(/<title>.*?<\/title>/, `<title>AstroStat Academy — ${route.label}</title>`)
    .replace(/(<meta name="description" content=")[^"]*/, `$1${route.description}`);
}

function papersApi(mode) {
  const env = loadEnv(mode, process.cwd(), ['ADS_', 'CRON_']);
  const service = createPapersService({ cache: createMemoryCache(), token: () => process.env.ADS_TOKEN || env.ADS_TOKEN });
  const handlers = {
    '/api/papers': createPapersHandler({ service }),
    '/api/refresh-papers': createPapersHandler({ service, refresh: true, cronSecret: () => process.env.CRON_SECRET || env.CRON_SECRET }),
  };
  const install = server => {
    // Wait for a successful listen so failed starts cannot leave a scheduler behind.
    server.httpServer?.once('listening', () => {
      if (!(process.env.ADS_TOKEN || env.ADS_TOKEN)) return;
      const stop = startLocalScheduler(service);
      server.httpServer.once('close', stop);
    });
    server.middlewares.use((req, res, next) => {
      const handler = handlers[new URL(req.url, 'http://localhost').pathname];
      if (handler) return handler(req, res);
      next();
    });
  };
  return { name: 'local-papers-api', configureServer: install, configurePreviewServer: install };
}

export default defineConfig(({ mode }) => ({
  plugins: [react(), papersApi(mode), {
    name: 'static-page-entries',
    enforce: 'post',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        const url = new URL(req.url, 'http://localhost');
        const destination = aliases[decodeURI(url.pathname)];
        if (!destination) return next();
        res.writeHead(302, { Location: destination + url.search });
        res.end();
      });
    },
    generateBundle(_, bundle) {
      const html = bundle['index.html'].source;
      for (const route of routes.filter(route => route.path !== '/')) {
        this.emitFile({ type: 'asset', fileName: `${route.path.slice(1)}index.html`, source: pageMetadata(html, route) });
      }
      this.emitFile({ type: 'asset', fileName: '404.html', source: pageMetadata(html, { label: 'Page not found', description: 'Page not found.' }) });
      const emittedAliases = new Set();
      for (const [from, to] of Object.entries(aliases).filter(([from]) => from.endsWith('.html') || from.endsWith('/'))) {
        const fileName = from.slice(1) + (from.endsWith('/') ? 'index.html' : '');
        if (emittedAliases.has(fileName.toLowerCase())) continue;
        emittedAliases.add(fileName.toLowerCase());
        this.emitFile({ type: 'asset', fileName, source: `<!doctype html><html lang="en"><head><meta charset="UTF-8"><title>Redirecting — AstroStat Academy</title><meta http-equiv="refresh" content="0;url=${to}"><script>location.replace(${JSON.stringify(to)} + location.search + location.hash)</script></head><body><a href="${to}">Continue to AstroStat Academy</a></body></html>` });
      }
    },
  }],
  server: { port: 4321, strictPort: true },
  preview: { port: 4321, strictPort: true },
}));
