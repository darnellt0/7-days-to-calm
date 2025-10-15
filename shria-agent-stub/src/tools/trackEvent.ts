import { z } from 'zod';
import { Store } from '../store/store.js';

const schema = z.object({
  name: z.string().min(1),
  payload: z.record(z.any()).optional()
});

export async function trackEventHandler(store: Store, userId: string, body: unknown) {
  const { name, payload } = schema.parse(body);
  const at = new Date().toISOString();
  await store.addEvent(userId, { name, payload, at });
  return { ok: true };
}
