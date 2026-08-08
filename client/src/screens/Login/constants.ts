import { z } from 'zod';
import type { TFunction } from 'i18next';

export const PASSWORD_MIN_LENGTH = 6;
export const BANNER_SLIDE_INTERVAL_MS = 6000;
export const MOUSE_THROTTLE_MS = 16;

export function createLoginSchema(t: TFunction<'auth'>) {
  return z.object({
    email: z.string().email({ message: t('errors.invalidEmail') }),
    password: z.string().min(PASSWORD_MIN_LENGTH, {
      message: t('errors.minLength', { count: PASSWORD_MIN_LENGTH }),
    }),
  });
}

export type LoginFormSchema = z.infer<ReturnType<typeof createLoginSchema>>;

export const LOGIN_DEFAULT_VALUES: LoginFormSchema = {
  email: '',
  password: '',
};
