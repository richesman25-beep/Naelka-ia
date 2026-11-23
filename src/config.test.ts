import { expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import config from '../capacitor.config';

it('keeps Capacitor and Android on the same application ID', () => {
  const gradle = readFileSync(new URL('../android/app/build.gradle', import.meta.url), 'utf8');
  expect(gradle).toContain(`applicationId "${config.appId}"`);
});

it('points Capacitor at the Vite build and uses bundled assets', () => {
  expect(config.webDir).toBe('dist');
  expect(config).not.toHaveProperty('server.url');
});
