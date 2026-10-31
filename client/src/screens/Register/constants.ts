import type { TFunction } from 'i18next';
import { z } from 'zod';

import { PASSWORD_MIN_LENGTH } from '~/screens/Login/constants';

export const HTTP_BAD_REQUEST = 400;
export const HTTP_CONFLICT = 409;
export const HTTP_UNPROCESSABLE_ENTITY = 422;
export const HTTP_PRECONDITION_REQUIRED = 428;

export const REGISTER_FIELD_NAMES = ['name', 'email', 'phone', 'password'] as const;

export type RegisterFieldName = (typeof REGISTER_FIELD_NAMES)[number];

export function createRegisterSchema(t: TFunction<'auth'>) {
  return z
    .object({
      name: z.string().min(1, { message: t('errors.required') }),
      email: z.string().email({ message: t('errors.invalidEmail') }),
      phone: z.string(),
      password: z.string().min(PASSWORD_MIN_LENGTH, {
        message: t('errors.minLength', { count: PASSWORD_MIN_LENGTH }),
      }),
      confirmPassword: z.string(),
      acceptedTerms: z.boolean().refine((accepted) => accepted, {
        message: t('errors.termsRequired'),
      }),
    })
    .refine((values) => values.password === values.confirmPassword, {
      path: ['confirmPassword'],
      message: t('errors.passwordMismatch'),
    });
}

export type RegisterFormSchema = z.infer<ReturnType<typeof createRegisterSchema>>;

export const REGISTER_DEFAULT_VALUES: RegisterFormSchema = {
  name: '',
  email: '',
  phone: '',
  password: '',
  confirmPassword: '',
  acceptedTerms: false,
};
