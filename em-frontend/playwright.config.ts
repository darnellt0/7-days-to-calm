import { defineConfig } from '@playwright/test';
export default defineConfig({
  testDir: './tests/browser', workers: 1,
  use: {
    baseURL: 'http://localhost:3001', permissions: ['microphone'],
    launchOptions: { args: ['--use-fake-device-for-media-stream', '--use-fake-ui-for-media-stream'] },
    trace: 'retain-on-failure',
  },
  webServer: { command: 'npm run start -- --port 3001', url: 'http://localhost:3001/7-days-to-calm', reuseExistingServer: false },
});
