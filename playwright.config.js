import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  workers: 2,
  use: { baseURL: 'http://127.0.0.1:4325', trace: 'retain-on-failure' },
  projects: [
    { name: 'desktop', use: { viewport: { width: 1320, height: 1000 } } },
    { name: 'mobile', use: { ...devices['iPhone 13'], defaultBrowserType: 'chromium' } },
  ],
  // A plain static server proves that deep links work without SPA fallback rules.
  webServer: {
    command: 'npm run build && serve --listen tcp://127.0.0.1:4325 --no-clipboard --config ../tests/serve.json dist',
    url: 'http://127.0.0.1:4325',
    reuseExistingServer: false,
    stderr: 'ignore',
  },
});
