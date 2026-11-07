import examples from 'libphonenumber-js/mobile/examples';
// The default build treats some impossible lengths as valid. Full metadata matches the numbering plan.
import {
  AsYouType,
  getCountryCallingCode,
  getExampleNumber,
  isValidPhoneNumber,
  validatePhoneNumberLength,
  type CountryCode,
} from 'libphonenumber-js/max';

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

export type SupportedPhoneCountry = (typeof SUPPORTED_PHONE_COUNTRIES)[number];

export function isSupportedPhoneCountry(value: string): value is SupportedPhoneCountry {
  return SUPPORTED_PHONE_COUNTRIES.some((country) => country === value);
}

export function defaultPhoneCountry(language: string): SupportedPhoneCountry {
  return language.toLowerCase().startsWith('pt') ? 'BR' : 'US';
}

export function phoneCountryOptionLabel(country: SupportedPhoneCountry): string {
  return `+${getCountryCallingCode(country)} ${country}`;
}

export function phoneExampleNational(country: SupportedPhoneCountry): string {
  return getExampleNumber(country, examples)?.formatNational() ?? '';
}

function usesTrunkZero(country: SupportedPhoneCountry): boolean {
  const example = getExampleNumber(country, examples);
  if (!example) {
    return false;
  }

  const nationalDigits = example.formatNational().replace(/\D/g, '');
  return nationalDigits.startsWith('0') && !example.nationalNumber.startsWith('0');
}

function withTrunkPrefix(digits: string, country: SupportedPhoneCountry): string {
  if (digits.length === 0 || digits.startsWith('0') || !usesTrunkZero(country)) {
    return digits;
  }

  return `0${digits}`;
}

const E164_MAX_DIGITS = 15;

function digitsOnly(value: string): string {
  return value.replace(/\D/g, '');
}

function capNationalDigits(digits: string, country: SupportedPhoneCountry): string {
  let next = digits;

  while (next.length > 0) {
    if (validatePhoneNumberLength(next, country) === 'TOO_LONG') {
      next = next.slice(0, -1);
      continue;
    }

    const shorter = next.slice(0, -1);
    if (
      shorter.length > 0 &&
      isValidPhoneNumber(shorter, country) &&
      !isValidPhoneNumber(next, country)
    ) {
      next = shorter;
      continue;
    }

    break;
  }

  return next;
}

function digitsAfterFormattingDeletion(previous: string, next: string): string | null {
  const previousDigits = digitsOnly(previous);
  const nextDigits = digitsOnly(next);
  if (nextDigits.length !== previousDigits.length || next.length >= previous.length) {
    return null;
  }

  if (previous.startsWith(next)) {
    return previousDigits.slice(0, -1);
  }

  let index = 0;
  while (index < next.length && previous[index] === next[index]) {
    index += 1;
  }

  const digitsBefore = digitsOnly(previous.slice(0, index)).length;
  if (digitsBefore === 0) {
    return nextDigits;
  }

  return previousDigits.slice(0, digitsBefore - 1) + previousDigits.slice(digitsBefore);
}

export function formatPhoneInput(
  value: string,
  country: SupportedPhoneCountry,
  previous?: string
): { text: string; country: SupportedPhoneCountry } {
  const editedDigits =
    previous === undefined
      ? digitsOnly(value)
      : (digitsAfterFormattingDeletion(previous, value) ?? digitsOnly(value));

  if (
    value.trimStart().startsWith('+') &&
    (previous === undefined || previous.trimStart().startsWith('+'))
  ) {
    const digits = editedDigits.slice(0, E164_MAX_DIGITS);
    if (digits.length === 0) {
      return { text: '+', country };
    }

    const international = new AsYouType();
    const formatted = international.input(`+${digits}`);
    const detected = international.getCountry();
    const nationalNumber = international.getNumber()?.nationalNumber;

    if (detected && isSupportedPhoneCountry(detected) && nationalNumber) {
      const capped = capNationalDigits(withTrunkPrefix(nationalNumber, detected), detected);
      return {
        text: capped.length > 0 ? new AsYouType(detected).input(capped) : '',
        country: detected,
      };
    }

    return { text: formatted, country };
  }

  const capped = capNationalDigits(withTrunkPrefix(editedDigits, country), country);
  return { text: capped.length > 0 ? new AsYouType(country).input(capped) : '', country };
}

export function isValidRegisterPhone(value: string, country: SupportedPhoneCountry): boolean {
  return isValidPhoneNumber(value, country);
}
