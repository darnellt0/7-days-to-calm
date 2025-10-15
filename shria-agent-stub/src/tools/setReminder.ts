import { z } from 'zod';
import { Store } from '../store/store.js';

const schema = z.object({
  time: z.string().regex(/^\d{2}:\d{2}$/, 'Use HH:mm 24h time'),
  label: z.string().min(1)
});

export async function setReminderHandler(store: Store, userId: string, body: unknown) {
  const { time, label } = schema.parse(body);
  await store.setReminder(userId, { time, label });
  return { ok: true };
}
