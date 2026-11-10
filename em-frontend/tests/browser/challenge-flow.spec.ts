import { test, expect } from '@playwright/test';

test('all seven live SDK sessions use the saved day and retain completion after reload (provider mocked)', async ({ page }) => {
  test.setTimeout(90000);
  const themes = ['Arrive', 'Longer Exhale', 'Body Scan', 'Label Thoughts', 'Box Breathing', 'Open Awareness', 'Integration'];
  const signedDays: number[] = [];
  const initiated: Record<string, unknown>[] = [];
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.route('**/convai/signed-url**', route => {
    const day = Number(new URL(route.request().url()).searchParams.get('challenge_day'));
    signedDays.push(day);
    return route.fulfill({ headers: { 'Access-Control-Allow-Origin': '*' }, json: {
      signed_url: 'wss://api.elevenlabs.io/v1/convai/conversation?conversation_signature=qa-seven-days', challenge_day: day,
    } });
  });
  await page.routeWebSocket('wss://api.elevenlabs.io/**', socket => {
    let day = 1;
    socket.onMessage(raw => {
      const data = JSON.parse(String(raw));
      if (data.type === 'conversation_initiation_client_data') {
        initiated.push(data.dynamic_variables);
        day = data.dynamic_variables.challenge_day;
        socket.send(JSON.stringify({ type: 'conversation_initiation_metadata', conversation_initiation_metadata_event: {
          conversation_id: `qa-day-${day}`, agent_output_audio_format: 'pcm_16000', user_input_audio_format: 'pcm_16000',
        } }));
      }
      if (data.type === 'contextual_update') socket.send(JSON.stringify({ type: 'agent_response', agent_response_event: {
        agent_response: `Welcome to Day ${day}: ${themes[day - 1]}.`,
      } }));
    });
  });
  await page.goto('/7-days-to-calm');
  for (let day = 1; day <= 7; day++) {
    await expect(page.getByRole('heading', { name: `Day ${day}: ${themes[day - 1]}`, exact: true })).toBeVisible();
    await page.getByRole('button', { name: 'Begin practice', exact: true }).click();
    await expect(page.getByRole('button', { name: 'End', exact: true })).toBeVisible();
    await expect(page.getByRole('log')).toContainText(`Day ${day}: ${themes[day - 1]}`);
    await expect(page.getByRole('button', { name: `Complete Day ${day}`, exact: true })).toBeDisabled();
    expect(initiated[day - 1]).toMatchObject({ challenge_day: day, challenge_title: themes[day - 1], challenge_name: '7 Days to Calm' });
    await page.getByRole('button', { name: 'End', exact: true }).click();
    await page.getByRole('button', { name: `Complete Day ${day}`, exact: true }).click();
    await page.reload();
    await expect(page.getByRole('progressbar')).toHaveAttribute('aria-valuenow', String(day));
  }
  await expect(page.getByRole('button', { name: 'Complete Day 7', exact: true })).toBeDisabled();
  expect(await page.evaluate(() => localStorage.getItem('em_challenge_complete'))).toBe('true');
  expect(signedDays).toEqual([1, 2, 3, 4, 5, 6, 7]);
  expect(errors).toEqual([]);
});

test('a legacy completion flag cannot lock an earlier saved day', async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem('em_challenge_day', '3');
    localStorage.setItem('em_challenge_complete', 'true');
  });
  await page.goto('/7-days-to-calm');
  await expect(page.getByRole('heading', { name: 'Day 3: Body Scan', exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Complete Day 3', exact: true })).toBeEnabled();
  await expect(page.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '2');
  expect(await page.evaluate(() => localStorage.getItem('em_challenge_complete'))).toBe('false');
});
