export type Route =
  | { id: '2min' | '5min' | '8min'; isChallenge: false; reminderLabel: string }
  | { id: 'sleep' | 'pre_meeting'; isChallenge: false; reminderLabel: string }
  | { id: `challenge_day_${number}`; isChallenge: true; reminderLabel: string };

export type DecideInput = {
  utterance?: string;
  challenge_day?: number;
};

export function decideRoute(input: DecideInput): Route {
  const u = (input.utterance || '').toLowerCase();
  if (input.challenge_day && input.challenge_day >= 1 && input.challenge_day <= 7) {
    return { id: `challenge_day_${input.challenge_day}` as const, isChallenge: true, reminderLabel: '7 Days to Calm' };
  }
  if (/sleep|bed|night/.test(u)) return { id: 'sleep', isChallenge: false, reminderLabel: 'Sleep Wind-Down' };
  if (/meeting|presentation|interview/.test(u)) return { id: 'pre_meeting', isChallenge: false, reminderLabel: 'Pre-Meeting Focus' };
  if (/(^|\s)(2)($|\s)/.test(u)) return { id: '2min', isChallenge: false, reminderLabel: 'Breath Break' };
  if (/(^|\s)(5)($|\s)/.test(u)) return { id: '5min', isChallenge: false, reminderLabel: 'Breath Break' };
  if (/(^|\s)(8)($|\s)/.test(u)) return { id: '8min', isChallenge: false, reminderLabel: 'Breath Break' };
  // default
  return { id: '2min', isChallenge: false, reminderLabel: 'Breath Break' };
}
