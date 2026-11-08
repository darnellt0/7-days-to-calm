import { test, expect } from '@playwright/test';

test('inline guide is visible without signing; progress persists and resets', async ({ page }) => {
  let requests = 0;
  await page.route('**/convai/signed-url**', route => { requests++; return route.abort(); });
  const response = await page.goto('/7-days-to-calm');
  expect(response?.headers()['permissions-policy']).toContain('microphone=(self)');
  const guide = page.getByRole('region', { name: 'Shria voice guide' });
  await expect(guide.getByRole('button', { name: 'Begin practice' })).toBeVisible();
  const box = await guide.boundingBox();
  expect(box!.width).toBeGreaterThan(300);
  expect(box!.height).toBeGreaterThanOrEqual(420);
  expect(requests).toBe(0);
  for (let day = 1; day <= 7; day++) await page.getByRole('button', { name: `Complete Day ${day}`, exact: true }).click();
  await expect(page.getByText('Seven days complete.', { exact: false })).toBeVisible();
  await page.reload();
  await expect(page.getByText('Seven days complete.', { exact: false })).toBeVisible();
  await page.getByRole('button', { name: 'Reset to Day 1' }).click();
  await page.getByRole('button', { name: 'Reset Progress', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Day 1: Arrive' })).toBeVisible();
  await page.setViewportSize({ width: 390, height: 844 });
  await expect(guide.getByRole('button', { name: 'Begin practice' })).toBeVisible();
  await expect(page.getByText('Progress reset successfully!')).toBeHidden();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.screenshot({ path: 'test-results/inline-guide-mobile.png', fullPage: true });
});

test('failed signing is actionable and retry fetches again', async ({ page }) => {
  let requests = 0;
  await page.route('**/convai/signed-url**', route => {
    requests++;
    return route.fulfill({ status: 503, headers: { 'Access-Control-Allow-Origin': '*' }, json: { detail: 'not configured' } });
  });
  await page.goto('/7-days-to-calm');
  await page.getByRole('button', { name: 'Begin practice' }).click();
  await expect(page.getByRole('region', { name: 'Shria voice guide' }).getByRole('alert')).toContainText('503');
  await page.getByRole('button', { name: 'Try again' }).click();
  await expect.poll(() => requests).toBe(2);
  await expect(page.getByRole('button', { name: 'Try again' })).toBeVisible();
});

test('real SDK sends day context, displays transcript, mutes and ends (provider mocked)', async ({ page }) => {
  const events: any[] = [];
  const errors: string[] = [];
  const logs: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  page.on('console', message => logs.push(message.text()));
  await page.addInitScript(() => localStorage.setItem('em_challenge_day', '3'));
  await page.route('**/convai/signed-url**', route => route.fulfill({ headers: { 'Access-Control-Allow-Origin': '*' }, json: { signed_url: 'wss://api.elevenlabs.io/v1/convai/conversation?conversation_signature=browser-test', challenge_day: 3 } }));
  await page.routeWebSocket('wss://api.elevenlabs.io/**', socket => {
    socket.onMessage(data => {
      const event = JSON.parse(String(data)); events.push(event);
      if (event.type === 'conversation_initiation_client_data') {
        socket.send(JSON.stringify({ type: 'conversation_initiation_metadata', conversation_initiation_metadata_event: { conversation_id: 'browser-test', agent_output_audio_format: 'pcm_16000', user_input_audio_format: 'pcm_16000' } }));
      }
      if (event.type === 'contextual_update') {
        socket.send(JSON.stringify({ type: 'agent_response', agent_response_event: { agent_response: 'Welcome to Day 3: Body Scan.' } }));
      }
    });
  });
  await page.goto('/7-days-to-calm');
  await page.getByRole('button', { name: 'Begin practice' }).click();
  await expect(page.getByRole('button', { name: 'End', exact: true })).toBeVisible({ timeout: 30000 });
  expect(events.find(event => event.type === 'conversation_initiation_client_data')?.dynamic_variables).toMatchObject({ challenge_day: 3, challenge_title: 'Body Scan' });
  await expect(page.getByRole('log')).toContainText('Welcome to Day 3');
  await page.getByRole('button', { name: 'Mute', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Unmute' })).toHaveAttribute('aria-pressed', 'true');
  await page.getByRole('button', { name: 'End', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Begin practice' })).toBeVisible();
  expect(errors).toEqual([]);
  expect(logs.some(message => message.includes('[EM] widget ready'))).toBe(true);
  expect(logs.some(message => message.includes('[EM] got signed url for day'))).toBe(true);
});

test('microphone denial explains recovery without fetching credentials', async ({ page }) => {
  let requested = false;
  await page.route('**/convai/signed-url**', route => { requested = true; return route.abort(); });
  await page.addInitScript(() => {
    navigator.mediaDevices.getUserMedia = async () => { throw new DOMException('denied', 'NotAllowedError'); };
  });
  await page.goto('/7-days-to-calm');
  await page.getByRole('button', { name: 'Begin practice' }).click();
  await expect(page.getByRole('region', { name: 'Shria voice guide' }).getByRole('alert')).toContainText('Microphone access was denied');
  expect(requested).toBe(false);
});
