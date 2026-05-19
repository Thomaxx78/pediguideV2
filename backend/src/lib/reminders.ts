export const REMINDER_TIERS = [
  { id: '72h', hoursBefore: 72 },
  { id: '24h', hoursBefore: 24 },
  { id: '2h', hoursBefore: 2 },
] as const;

export type TierId = (typeof REMINDER_TIERS)[number]['id'];

export interface ReminderInput {
  appointmentAt: Date;
  remindersSent: TierId[];
  now: Date;
}

export function nextReminderToSend(_input: ReminderInput): TierId | null {
  return null;
}
