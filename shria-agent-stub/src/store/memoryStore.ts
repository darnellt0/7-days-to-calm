import { Store, UserData, EventRecord, Reminder } from './types.js';

const db = new Map<string, UserData>();

const defaultUser = (userId: string): UserData => ({
  userId,
  challenge: { currentDay: 0, lastCompletedDay: 0 },
  prefs: {},
  reminders: []
});

export const memoryStore: Store = {
  async getUser(userId) {
    if (!db.has(userId)) db.set(userId, defaultUser(userId));
    return db.get(userId)!;
  },
  async upsertUser(user) {
    db.set(user.userId, user);
  },
  async setChallengeDay(userId, day) {
    const user = await this.getUser(userId);
    user.challenge.currentDay = day;
    await this.upsertUser(user);
    return user;
  },
  async addEvent(userId, event) {
    // For the stub, we don't persist events beyond console
    console.log('[event]', userId, event);
  },
  async setReminder(userId, reminder) {
    const user = await this.getUser(userId);
    // idempotent add (same time+label ignored)
    const exists = user.reminders.find(r => r.time === reminder.time && r.label === reminder.label);
    if (!exists) user.reminders.push(reminder);
    await this.upsertUser(user);
  }
};
