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
  await expect(page.getByRole('button', { name: 'Complete Day 1', exact: true })).toHaveClass(/button-secondary/);
  for (let day = 1; day <= 7; day++) await page.getByRole('button', { name: `Complete Day ${day}`, exact: true }).click();
  await expect(page.locator('.footer-title')).toContainText('Seven days complete.');
  await page.setViewportSize({ width: 320, height: 740 });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.screenshot({ path: 'test-results/design-complete-mobile.png', fullPage: true });
  await page.setViewportSize({ width: 1280, height: 720 });
  await page.reload();
  await expect(page.locator('.footer-title')).toContainText('Seven days complete.');
  await page.getByRole('button', { name: 'Reset to Day 1' }).click();
  await page.getByRole('button', { name: 'Reset Progress', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Day 1: Arrive' })).toBeVisible();
  await page.setViewportSize({ width: 390, height: 844 });
  await expect(guide.getByRole('button', { name: 'Begin practice' })).toBeVisible();
  await expect(page.getByText('Progress reset successfully!')).toBeHidden({ timeout: 8000 });
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
  await expect(page.getByRole('button', { name: 'Complete Day 3', exact: true })).toBeDisabled();
  await expect(page.getByRole('button', { name: 'Reset to Day 1' })).toBeDisabled();
  await expect(page.getByLabel('Session duration')).toBeVisible();
  expect(await page.locator('.hero-video').evaluateAll(videos => videos.every(el => (el as HTMLVideoElement).paused))).toBe(true);
  expect(events.find(event => event.type === 'conversation_initiation_client_data')?.dynamic_variables).toMatchObject({ challenge_day: 3, challenge_title: 'Body Scan' });
  await expect(page.getByRole('log')).toContainText('Welcome to Day 3');
  await page.screenshot({ path: 'test-results/design-active-session.png', fullPage: true });
  await page.getByRole('button', { name: 'Mute', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Unmute' })).toHaveAttribute('aria-pressed', 'true');
  await expect(page.getByRole('status').filter({ hasText: 'Microphone muted' })).toBeVisible();
  await page.getByRole('button', { name: 'End', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Begin practice' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Complete Day 3', exact: true })).toBeEnabled();
  await expect(page.getByRole('button', { name: 'Complete Day 3', exact: true })).toHaveClass(/is-ready/);
  await expect(page.getByRole('heading', { name: 'Day 3: Body Scan' })).toBeVisible();
  expect(errors).toEqual([]);
  expect(logs.some(message => message.includes('[EM] widget ready'))).toBe(true);
  expect(logs.some(message => message.includes('[EM] got signed url for day'))).toBe(true);
});

test('keyboard dialogs restore focus, and skip uses the correct notification', async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('em_challenge_start', new Date(Date.now() - 2 * 86400000).toISOString()));
  await page.goto('/7-days-to-calm');
  const reset = page.getByRole('button', { name: 'Reset to Day 1' });
  await reset.click();
  const dialog = page.getByRole('dialog', { name: 'Reset Progress?' });
  await expect(dialog).toBeVisible();
  await expect(dialog.getByRole('button', { name: 'Cancel', exact: true })).toBeFocused();
  await page.keyboard.press('Escape');
  await expect(dialog).toBeHidden();
  await expect(reset).toBeFocused();
  await page.getByRole('button', { name: 'Skip to Today' }).click();
  await page.getByRole('dialog').getByRole('button', { name: 'Skip to Day 3' }).click();
  await expect(page.getByRole('heading', { name: 'Day 3: Body Scan' })).toBeVisible();
  await expect(page.getByText('Moved to Day 3. Your practice is ready.')).toBeVisible();
});

test('blocked browser storage does not prevent practice or day completion', async ({ page }) => {
  await page.addInitScript(() => {
    Storage.prototype.getItem = () => { throw new DOMException('blocked', 'SecurityError'); };
    Storage.prototype.setItem = () => { throw new DOMException('blocked', 'SecurityError'); };
  });
  await page.goto('/7-days-to-calm');
  await expect(page.getByText('Your browser isn’t saving progress.', { exact: false })).toBeVisible();
  await page.getByRole('button', { name: 'Complete Day 1', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Day 2: Longer Exhale' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Begin practice' })).toBeVisible();
});

test('new visual identity loads artwork and fits desktop and narrow mobile', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto('/7-days-to-calm');
  const image = page.getByRole('img', { name: /luminous violet glass portal/ });
  await expect(image).toBeVisible();
  await expect.poll(() => image.evaluate((el: HTMLImageElement) => el.complete && el.naturalWidth > 0)).toBe(true);
  await expect(page.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '0');
  await page.screenshot({ path: 'test-results/design-desktop.png', fullPage: true });
  await page.setViewportSize({ width: 390, height: 844 });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await expect(page.locator('.mobile-current-day')).toContainText('Day 1 of 7');
  await expect(page.locator('.mobile-current-day')).toContainText('Arrive');
  await page.locator('.motion-control').scrollIntoViewIfNeeded();
  expect(await page.locator('.motion-control').evaluate(el => {
    const r = el.getBoundingClientRect();
    // Sample inside the button's own pill corners, not its transparent outer pixels.
    return [[r.left + 12, r.top + 12], [r.right - 12, r.top + 12], [r.left + 12, r.bottom - 12], [r.right - 12, r.bottom - 12]]
      .every(([x, y]) => document.elementFromPoint(x, y)?.closest('button') === el);
  })).toBe(true);
  await page.screenshot({ path: 'test-results/design-mobile.png', fullPage: true });
  await page.getByRole('link', { name: 'Go to your practice' }).focus();
  await page.keyboard.press('Enter');
  const guide = page.getByRole('region', { name: 'Shria voice guide' });
  await expect(guide).toBeFocused();
  await expect(guide.getByText('Day 1 · Arrive')).toBeVisible();
  await expect(guide.getByRole('button', { name: 'Begin practice' })).toBeInViewport();
  await page.setViewportSize({ width: 320, height: 740 });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.emulateMedia({ reducedMotion: 'reduce' });
  expect(await page.locator('.orbit-core').evaluate(el => getComputedStyle(el).animationName)).toBe('none');
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

test('real hero video plays, pauses persistently, and follows reduced-motion changes', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await page.goto('/7-days-to-calm');
  const main = page.getByRole('main');
  const video = page.locator('.hero-video');
  await expect(main).toHaveAttribute('data-motion', 'running');
  await expect.poll(() => video.evaluate((el: HTMLVideoElement) => el.currentTime)).toBeGreaterThan(.1);
  await expect(video).toHaveJSProperty('muted', true);
  await expect(video).toHaveJSProperty('loop', true);
  await expect(video).toHaveJSProperty('videoWidth', 960);
  await video.evaluate((el: HTMLVideoElement) => { el.currentTime = el.duration - .15; });
  await expect.poll(() => video.evaluate((el: HTMLVideoElement) => el.currentTime)).toBeLessThan(1);
  await page.getByRole('button', { name: 'Pause motion', exact: true }).click();
  await expect(main).toHaveAttribute('data-motion', 'paused');
  await expect(video).toHaveJSProperty('paused', true);
  await page.reload();
  await expect(page.getByRole('button', { name: 'Play motion', exact: true })).toBeVisible();
  await expect(main).toHaveAttribute('data-motion', 'paused');
  await expect(video).toHaveCount(0);
  await page.getByRole('button', { name: 'Play motion', exact: true }).click();
  await expect(main).toHaveAttribute('data-motion', 'running');
  await expect.poll(() => video.evaluate((el: HTMLVideoElement) => el.currentTime)).toBeGreaterThan(.1);
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await expect(page.getByRole('button', { name: 'Motion reduced', exact: true })).toBeDisabled();
  await expect(main).toHaveAttribute('data-motion', 'paused');
  await expect(video).toHaveCount(0);
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await expect(main).toHaveAttribute('data-motion', 'running');
});

test('reduced-motion first load avoids video requests; failed media retains the artwork', async ({ page }) => {
  let videoRequests = 0;
  await page.route('**/video/portal-loop.*', route => { videoRequests++; return route.abort(); });
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/7-days-to-calm');
  await expect(page.getByRole('button', { name: 'Motion reduced' })).toBeDisabled();
  await expect(page.locator('.hero-video')).toHaveCount(0);
  expect(videoRequests).toBe(0);
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await expect.poll(() => videoRequests).toBeGreaterThan(0);
  await expect(page.locator('.hero-video')).toHaveCount(0);
  await expect(page.getByRole('img', { name: /luminous violet glass portal/ })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Begin practice' })).toBeVisible();
});

test('blocked autoplay offers manual play and a failed MP4 falls back to WebM', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await page.route('**/video/portal-loop.mp4', route => route.abort());
  await page.addInitScript(() => {
    const original = HTMLMediaElement.prototype.play;
    let blocked = false;
    HTMLMediaElement.prototype.play = function () {
      if (!blocked) { blocked = true; return Promise.reject(new DOMException('gesture required', 'NotAllowedError')); }
      return original.call(this);
    };
  });
  await page.goto('/7-days-to-calm');
  await page.getByRole('button', { name: 'Play video', exact: true }).click();
  const video = page.locator('.hero-video');
  await expect.poll(() => video.evaluate((el: HTMLVideoElement) => el.currentTime)).toBeGreaterThan(.1);
  expect(await video.evaluate((el: HTMLVideoElement) => el.currentSrc)).toContain('portal-loop.webm');
  await expect(page.getByRole('button', { name: 'Play video', exact: true })).toBeHidden();
});
