import { scheduleEmailSchema } from '../src/controllers/email.controller';

describe('Scheduler Schema Validation Tests', () => {
  it('should validate valid email schedule payload', () => {
    const validPayload = {
      senderId: 'sender-123',
      recipients: ['alice@example.com', 'bob@example.com'],
      subject: 'Quarterly Update',
      body: 'Here is the report.',
      startTime: '2026-09-12T10:00:00.000Z',
      delayBetweenEmailsSeconds: 2,
      hourlyLimit: 200,
    };

    const result = scheduleEmailSchema.safeParse(validPayload);
    expect(result.success).toBe(true);
  });

  it('should reject payload with invalid email address', () => {
    const invalidPayload = {
      senderId: 'sender-123',
      recipients: ['invalid-email-format'],
      subject: 'Hello',
      body: 'Test',
      startTime: '2026-09-12T10:00:00.000Z',
    };

    const result = scheduleEmailSchema.safeParse(invalidPayload);
    expect(result.success).toBe(false);
  });

  it('should reject payload without recipients', () => {
    const invalidPayload = {
      senderId: 'sender-123',
      recipients: [],
      subject: 'Hello',
      body: 'Test',
      startTime: '2026-09-12T10:00:00.000Z',
    };

    const result = scheduleEmailSchema.safeParse(invalidPayload);
    expect(result.success).toBe(false);
  });
});
