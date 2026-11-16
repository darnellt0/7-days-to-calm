import { test, expect } from '@playwright/test';

test('real SDK connects to backend relay, keeps day context and ends cleanly (relay mocked)', async ({ page, isMobile }) => {
  const events: Record<string, any>[] = [];
  await page.addInitScript(() => localStorage.setItem('em_challenge_day', '3'));
  await page.route('**/convai/signed-url**', route => route.fulfill({
    headers: { 'Access-Control-Allow-Origin': '*' },
    json: { relay_path: '/convai/session?ticket=relay-test', challenge_day: 3, playback_model: 'eleven_flash_v2_5' },
  }));
  await page.routeWebSocket(/ws:\/\/localhost:8787\/convai\/session\?ticket=relay-test/, socket => {
    socket.onMessage(raw => {
      const event = JSON.parse(String(raw)); events.push(event);
      if (event.type === 'conversation_initiation_client_data') socket.send(JSON.stringify({
        type: 'conversation_initiation_metadata', conversation_initiation_metadata_event: {
          conversation_id: 'relay-test', agent_output_audio_format: 'pcm_16000', user_input_audio_format: 'pcm_16000',
        },
      }));
      if (event.type === 'contextual_update') socket.send(JSON.stringify({
        type: 'agent_response', agent_response_event: { agent_response: 'Day 3: Body Scan. Take a gentle breath.' },
      }));
    });
  });
  await page.goto('/7-days-to-calm');
  const begin = page.getByRole('button', { name: 'Begin practice', exact: true });
  if (isMobile) await begin.tap(); else await begin.click();
  await expect(page.getByRole('button', { name: 'End', exact: true })).toBeVisible();
  await expect(page.getByRole('log')).toContainText('Day 3: Body Scan');
  expect(events.find(e => e.type === 'conversation_initiation_client_data')?.dynamic_variables).toMatchObject({ challenge_day: 3, challenge_title: 'Body Scan' });
  const end = page.getByRole('button', { name: 'End', exact: true });
  if (isMobile) await end.tap(); else await end.click();
  await expect(begin).toBeVisible();
  await expect(page.getByRole('button', { name: 'Complete Day 3', exact: true })).toBeEnabled();
});
