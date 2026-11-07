import { describe, expect, it } from 'vitest';

import { formatPhoneInput, isValidRegisterPhone, type SupportedPhoneCountry } from './phone';

function typeDigits(country: SupportedPhoneCountry, digits: string): string {
  let previous = '';

  for (const digit of digits) {
    previous = formatPhoneInput(`${previous}${digit}`, country, previous).text;
  }

  return previous;
}

describe('formatPhoneInput', () => {
  it('drops the digit before a trailing parenthesis on backspace', () => {
    expect(formatPhoneInput('(202', 'US', '(202)')).toEqual({ text: '20', country: 'US' });
    expect(formatPhoneInput('(11', 'BR', '(11)')).toEqual({ text: '1', country: 'BR' });
  });

  it('drops the digit before a parenthesis in the middle of the mask', () => {
    expect(formatPhoneInput('(202 555-0123', 'US', '(202) 555-0123')).toEqual({
      text: '(205) 550-123',
      country: 'US',
    });
  });

  it('keeps deleting the last digit when the character removed is a digit', () => {
    expect(formatPhoneInput('(202) 555-012', 'US', '(202) 555-0123')).toEqual({
      text: '(202) 555-012',
      country: 'US',
    });
  });

  it('formats national examples, including numbers typed without the trunk prefix', () => {
    expect(typeDigits('PT', '912345678')).toBe('912 345 678');
    expect(typeDigits('GB', '7400123456')).toBe('07400 123456');
    expect(typeDigits('FR', '612345678')).toBe('06 12 34 56 78');
    expect(typeDigits('DE', '15123456789')).toBe('01512 3456789');
    expect(typeDigits('NL', '612345678')).toBe('06 12345678');
    expect(typeDigits('IE', '850123456')).toBe('085 012 3456');
  });

  it('drops a digit past a completed number that cannot grow', () => {
    expect(formatPhoneInput('06123456789', 'NL')).toEqual({ text: '06 12345678', country: 'NL' });
    expect(formatPhoneInput('08512345678', 'IE')).toEqual({ text: '085 123 4567', country: 'IE' });
  });

  it('keeps a longer valid German number and rejects five digits', () => {
    expect(formatPhoneInput('0301234567', 'DE')).toEqual({ text: '030 1234567', country: 'DE' });
    expect(isValidRegisterPhone('030 1234567', 'DE')).toBe(true);
    expect(isValidRegisterPhone(formatPhoneInput('01512', 'DE').text, 'DE')).toBe(false);
    expect(isValidRegisterPhone(formatPhoneInput('12345', 'DE').text, 'DE')).toBe(false);
  });
});
