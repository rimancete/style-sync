import { describe, expect, it } from 'vitest';
import type { TFunction } from 'i18next';

import { createLoginSchema, PASSWORD_MIN_LENGTH } from '../constants';

function createAuthT(): TFunction<'auth'> {
  const t = ((key: string, options?: { count?: number }) => {
    if (key === 'errors.invalidEmail') {
      return 'Invalid email address';
    }
    if (key === 'errors.minLength') {
      return `Must be at least ${options?.count ?? ''} characters`;
    }
    return key;
  }) as TFunction<'auth'>;

  return t;
}

describe('createLoginSchema', () => {
  it('interpolates password min length without leaving {{count}}', async () => {
    const schema = createLoginSchema(createAuthT());
    const result = await schema.safeParseAsync({
      email: 'user@example.com',
      password: '123',
    });

    expect(result.success).toBe(false);
    if (result.success) {
      return;
    }

    const message = result.error.flatten().fieldErrors.password?.[0];
    expect(message).toBe(`Must be at least ${PASSWORD_MIN_LENGTH} characters`);
    expect(message).not.toContain('{{count}}');
  });

  it('accepts a valid email and password', async () => {
    const schema = createLoginSchema(createAuthT());
    const result = await schema.safeParseAsync({
      email: 'user@example.com',
      password: '123456',
    });

    expect(result.success).toBe(true);
  });
});
