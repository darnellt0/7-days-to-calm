import { z } from 'zod';
import { Store } from '../store/store.js';

const schema = z.object({ day: z.number().int().min(1).max(7) });

export async function setChallengeDayHandler(store: Store, userId: string, body: unknown) {
  const { day } = schema.parse(body);
  const user = await store.setChallengeDay(userId, day);
  return { ok: true, user };
}
