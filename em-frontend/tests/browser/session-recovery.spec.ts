// Operator-staged browser tests. NOT executed in Turing's dependency/browser-free sandbox.
// Uses the real installed ElevenLabs SDK with fake microphone + mocked provider WebSocket.
import { test, expect, type Page, type WebSocketRoute } from '@playwright/test';
const titles = ['Arrive', 'Longer Exhale', 'Body Scan', 'Label Thoughts', 'Box Breathing', 'Open Awareness', 'Integration'];
const signedURL = 'wss://api.elevenlabs.io/v1/convai/conversation?conversation_signature=qa-synthetic';
async function provider(page: Page, day: number) {
  const events: any[] = [];
  const queries: string[] = [];
  let remote: WebSocketRoute | undefined;
  await page.route('**/convai/signed-url**', route => {
    queries.push(new URL(route.request().url()).searchParams.get('challenge_day') || '');
    return route.fulfill({ headers: { 'Access-Control-Allow-Origin': '*' }, json: { signed_url: signedURL, challenge_day: day } });
  });
  await page.routeWebSocket('wss://api.elevenlabs.io/**', socket => {
    remote = socket;
    socket.onMessage(data => {
      const event = JSON.parse(String(data));
      events.push(event);
      if (event.type === 'conversation_initiation_client_data') socket.send(JSON.stringify({ type: 'conversation_initiation_metadata', conversation_initiation_metadata_event: { conversation_id: 'qa-synthetic', agent_output_audio_format: 'pcm_16000', user_input_audio_format: 'pcm_16000' } }));
      if (event.type === 'contextual_update') socket.send(JSON.stringify({ type: 'agent_response', agent_response_event: { agent_response: `Welcome to Day ${day}: ${titles[day - 1]}.` } }));
    });
  });
  return { events, queries, disconnect: () => { if (!remote) throw new Error('No mock connection'); remote.close({ code: 1000, reason: 'QA remote disconnect' }); } };
}
async function activate(page: Page, name: string, touch: boolean) {
  const button = page.getByRole('button', { name, exact: true });
  if (touch) await button.tap(); else await button.click();
}
test('QA SDK disconnect recovers and retry starts one fresh conversation', async ({ page, isMobile }) => {
  const mock = await provider(page, 1);
  await page.goto('/7-days-to-calm');
  await activate(page, 'Begin practice', isMobile);
  await expect(page.getByRole('button', { name: 'End', exact: true })).toBeVisible({ timeout: 30000 });
  mock.disconnect();
  await expect(page.getByRole('button', { name: 'Begin practice', exact: true })).toBeVisible();
  await activate(page, 'Begin practice', isMobile);
  await expect(page.getByRole('button', { name: 'End', exact: true })).toBeVisible({ timeout: 30000 });
  expect(mock.queries).toEqual(['1', '1']);
  await activate(page, 'End', isMobile);
});
test('QA cancel delayed signing cannot open a late SDK connection', async ({ page, isMobile }) => {
  let release!: () => void;
  const gate = new Promise<void>(resolve => { release = resolve; });
  let requested = false, sockets = 0;
  await page.route('**/convai/signed-url**', async route => {
    requested = true; await gate;
    await route.fulfill({ headers: { 'Access-Control-Allow-Origin': '*' }, json: { signed_url: signedURL, challenge_day: 1 } }).catch(() => {});
  });
  await page.routeWebSocket('wss://api.elevenlabs.io/**', socket => { sockets++; socket.close(); });
  await page.goto('/7-days-to-calm');
  await activate(page, 'Begin practice', isMobile);
  await expect.poll(() => requested).toBe(true);
  await activate(page, 'Cancel', isMobile);
  release();
  await expect(page.getByRole('button', { name: 'Begin practice', exact: true })).toBeVisible();
  // Drain browser tasks after delayed fulfillment; no fixed delay is used as sole proof.
  await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
  expect(sockets).toBe(0);
  await expect(page.getByRole('button', { name: 'Complete Day 1', exact: true })).toBeEnabled();
});
test('QA legacy inconsistent completion recovers; keyboard reset restores focus', async ({ page }) => {
  await page.addInitScript(() => { localStorage.setItem('em_challenge_day', '1'); localStorage.setItem('em_challenge_complete', 'true'); });
  await page.goto('/7-days-to-calm');
  await expect(page.getByRole('button', { name: 'Complete Day 1', exact: true })).toBeEnabled();
  const reset = page.getByRole('button', { name: 'Reset to Day 1' });
  await reset.focus(); await page.keyboard.press('Enter');
  const dialog = page.getByRole('dialog', { name: 'Reset Progress?' });
  await expect(dialog.getByRole('button', { name: 'Cancel', exact: true })).toBeFocused();
  await page.keyboard.press('Escape'); await expect(reset).toBeFocused();
});
test('QA actionable controls meet 44px targets and have no horizontal overflow', async ({ page }) => {
  await page.goto('/7-days-to-calm');
  for (const name of ['Begin practice', 'Complete Day 1']) {
    const button = page.getByRole('button', { name, exact: true });
    const box = await button.boundingBox(); expect(box?.width).toBeGreaterThanOrEqual(44); expect(box?.height).toBeGreaterThanOrEqual(44);
    expect(await button.evaluate(el => parseFloat(getComputedStyle(el).fontSize))).toBeGreaterThanOrEqual(18);
  }
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.screenshot({ path: `test-results/qa-${test.info().project.name}.png`, fullPage: true });
});
