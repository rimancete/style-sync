import { isValidPhoneNumber, type CountryCode } from 'libphonenumber-js';

export const SUPPORTED_PHONE_COUNTRIES = [
  'BR',
  'US',
  'CA',
  'GB',
  'PT',
  'ES',
  'FR',
  'DE',
  'IT',
  'NL',
  'IE',
] as const satisfies readonly CountryCode[];

export function isSupportedRegisterPhone(value: string): boolean {
  const trimmed = value.trim();
  if (trimmed.length === 0) {
    return false;
  }

  return SUPPORTED_PHONE_COUNTRIES.some(country =>
    isValidPhoneNumber(trimmed, country),
  );
}
