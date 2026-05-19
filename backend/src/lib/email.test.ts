import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

const { sendMock } = vi.hoisted(() => ({ sendMock: vi.fn() }));

vi.mock('resend', () => ({
  Resend: class {
    emails = { send: sendMock };
  },
}));

import { sendReminderEmail, sendFormLinkEmail } from './email';

describe('email helpers — EMAIL_DEV_MODE', () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    sendMock.mockReset();
    process.env.RESEND_API_KEY = 're_test_key';
  });

  afterEach(() => {
    process.env = { ...originalEnv };
  });

  it('sendReminderEmail does not call Resend when EMAIL_DEV_MODE=true', async () => {
    process.env.EMAIL_DEV_MODE = 'true';

    await sendReminderEmail({
      to: 'parent@test.fr',
      patientFirstName: 'Lucas',
      formUrl: 'http://localhost/form/abc',
      tier: '24h',
    });

    expect(sendMock).not.toHaveBeenCalled();
  });

  it('sendReminderEmail calls Resend when EMAIL_DEV_MODE is not set', async () => {
    delete process.env.EMAIL_DEV_MODE;
    sendMock.mockResolvedValueOnce({ data: { id: 'msg-1' }, error: null });

    await sendReminderEmail({
      to: 'parent@test.fr',
      patientFirstName: 'Lucas',
      formUrl: 'http://localhost/form/abc',
      tier: '24h',
    });

    expect(sendMock).toHaveBeenCalledOnce();
  });

  it('sendReminderEmail throws when Resend returns error', async () => {
    delete process.env.EMAIL_DEV_MODE;
    sendMock.mockResolvedValueOnce({ data: null, error: { message: 'quota exceeded' } });

    await expect(
      sendReminderEmail({
        to: 'parent@test.fr',
        patientFirstName: 'Lucas',
        formUrl: 'http://localhost/form/abc',
        tier: '24h',
      }),
    ).rejects.toThrow(/quota exceeded/);
  });

  it('sendFormLinkEmail honors EMAIL_DEV_MODE=true', async () => {
    process.env.EMAIL_DEV_MODE = 'true';

    await sendFormLinkEmail({
      to: 'parent@test.fr',
      patientFirstName: null,
      formUrl: 'http://localhost/form/abc',
    });

    expect(sendMock).not.toHaveBeenCalled();
  });
});
