import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import express from 'express';
import type { Server } from 'node:http';
import { convaiRouter } from '../src/routes/convai.js';

describe('optional signing adapter', () => {
  let server: Server;
  let base: string;
  const originalEnv = { ...process.env };
  beforeEach(async () => {
    process.env.CORS_ALLOWLIST = 'https://allowed.example';
    delete process.env.BACKEND_URL;
    const app = express(); app.use('/convai', convaiRouter);
    server = await new Promise<Server>(resolve => { const s = app.listen(0, '127.0.0.1', () => resolve(s)); });
    const address = server.address() as { port: number };
    base = `http://127.0.0.1:${address.port}/convai/signed-url`;
  });
  afterEach(async () => {
    vi.unstubAllGlobals(); process.env = { ...originalEnv };
    await new Promise<void>(resolve => server.close(() => resolve()));
  });
  it('handles OPTIONS and rejects disallowed origins', async () => {
    const allowed = await fetch(base, { method: 'OPTIONS', headers: { Origin: 'https://allowed.example' } });
    expect(allowed.status).toBe(204);
    expect(allowed.headers.get('access-control-allow-origin')).toBe('https://allowed.example');
    expect((await fetch(base, { headers: { Origin: 'https://denied.example' } })).status).toBe(403);
  });
  it('validates day and fails closed without a backend', async () => {
    expect((await fetch(base+'?challenge_day=8')).status).toBe(400);
    expect((await fetch(base)).status).toBe(503);
  });
  it('forwards real signing with compatible response names and no caching', async () => {
    process.env.BACKEND_URL = 'https://signer.example';
    const realFetch = fetch;
    vi.stubGlobal('fetch', (url: string, options?: RequestInit) => String(url).startsWith('https://signer.example')
      ? Promise.resolve(Response.json({ signed_url: 'wss://api.elevenlabs.io/example' }))
      : realFetch(url, options));
    const response = await fetch(base+'?challenge_day=3');
    expect(response.status).toBe(200);
    expect(response.headers.get('cache-control')).toBe('no-store');
    expect(await response.json()).toMatchObject({ ok: true, challenge_day: 3, url: 'wss://api.elevenlabs.io/example', signed_url: 'wss://api.elevenlabs.io/example' });
  });
});
