import { describe, it, expect } from 'vitest';
import { nextReminderToSend } from './reminders';

const now = new Date('2026-05-20T12:00:00Z');
const inHours = (h: number) => new Date(now.getTime() + h * 3600_000);

describe('nextReminderToSend', () => {
  it('retourne null si le RDV est trop loin (>72h)', () => {
    expect(
      nextReminderToSend({
        appointmentAt: inHours(75),
        remindersSent: [],
        now,
      }),
    ).toBeNull();
  });

  it('retourne 72h si remaining = 72h pile et rien envoyé', () => {
    expect(
      nextReminderToSend({
        appointmentAt: inHours(72),
        remindersSent: [],
        now,
      }),
    ).toBe('72h');
  });

  it('retourne 72h pendant la phase entre 24h et 72h', () => {
    expect(
      nextReminderToSend({
        appointmentAt: inHours(50),
        remindersSent: [],
        now,
      }),
    ).toBe('72h');
  });

  it("retourne null si 72h déjà envoyé et toujours en phase 72h", () => {
    expect(
      nextReminderToSend({
        appointmentAt: inHours(50),
        remindersSent: ['72h'],
        now,
      }),
    ).toBeNull();
  });

  it("retourne 24h dès qu'on entre en phase 24h", () => {
    expect(
      nextReminderToSend({
        appointmentAt: inHours(23),
        remindersSent: ['72h'],
        now,
      }),
    ).toBe('24h');
  });

  it('retourne null si tous les tiers passés ont été envoyés', () => {
    expect(
      nextReminderToSend({
        appointmentAt: inHours(23),
        remindersSent: ['72h', '24h'],
        now,
      }),
    ).toBeNull();
  });

  it('retourne 2h en phase finale', () => {
    expect(
      nextReminderToSend({
        appointmentAt: inHours(1),
        remindersSent: ['72h', '24h'],
        now,
      }),
    ).toBe('2h');
  });

  it('retourne null si le RDV est passé', () => {
    expect(
      nextReminderToSend({
        appointmentAt: inHours(-1),
        remindersSent: [],
        now,
      }),
    ).toBeNull();
  });

  it('backfill : session créée en phase 24h sans envoi préalable → envoie 24h', () => {
    expect(
      nextReminderToSend({
        appointmentAt: inHours(22),
        remindersSent: [],
        now,
      }),
    ).toBe('24h');
  });

  it('backfill : session créée en phase 2h sans envoi préalable → envoie 2h', () => {
    expect(
      nextReminderToSend({
        appointmentAt: inHours(1.5),
        remindersSent: [],
        now,
      }),
    ).toBe('2h');
  });

  it('idempotency : tous les tiers déjà envoyés → null', () => {
    expect(
      nextReminderToSend({
        appointmentAt: inHours(1),
        remindersSent: ['72h', '24h', '2h'],
        now,
      }),
    ).toBeNull();
  });
});
