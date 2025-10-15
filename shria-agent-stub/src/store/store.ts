import { Store, UserData, EventRecord, Reminder } from './types.js';

// Re-export types for convenience
export type { Store, UserData, EventRecord, Reminder } from './types.js';

export const ensureUser = (store: Store) => async (userId: string): Promise<UserData> => {
  return await store.getUser(userId);
};
