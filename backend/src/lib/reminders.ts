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

export function nextReminderToSend(input: ReminderInput): TierId | null {
  const remainingHours = (input.appointmentAt.getTime() - input.now.getTime()) / 3_600_000;

  if (remainingHours <= 0) return null;

  const ascending = [...REMINDER_TIERS].sort((a, b) => a.hoursBefore - b.hoursBefore);
  const phaseTier = ascending.find((t) => remainingHours <= t.hoursBefore);

  if (!phaseTier) return null;
  if (input.remindersSent.includes(phaseTier.id)) return null;

  return phaseTier.id;
}
