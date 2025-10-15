import { describe, it, expect } from 'vitest';
import { memoryStore } from '../src/store/memoryStore.js';
import { setChallengeDayHandler } from '../src/tools/setChallengeDay.js';
import { trackEventHandler } from '../src/tools/trackEvent.js';
import { setReminderHandler } from '../src/tools/setReminder.js';

const uid = 'test-user';

describe('tool handlers', () => {
  it('setChallengeDay works', async () => {
    const r = await setChallengeDayHandler(memoryStore, uid, { day: 3 });
    expect(r.ok).toBe(true);
    expect(r.user.challenge.currentDay).toBe(3);
  });

  it('trackEvent works', async () => {
    const r = await trackEventHandler(memoryStore, uid, { name: 'em_day_complete', payload: { day: 3 } });
    expect(r.ok).toBe(true);
  });

  it('setReminder works', async () => {
    const r = await setReminderHandler(memoryStore, uid, { time: '13:00', label: '7 Days to Calm' });
    expect(r.ok).toBe(true);
    const user = await memoryStore.getUser(uid);
    expect(user.reminders.length).toBeGreaterThan(0);
  });
});
