import {
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from 'class-validator';

import { isSupportedRegisterPhone } from '../supported-phone-countries';

@ValidatorConstraint({ name: 'isSupportedPhone', async: false })
export class IsSupportedPhoneConstraint implements ValidatorConstraintInterface {
  validate(value: unknown): boolean {
    return typeof value === 'string' && isSupportedRegisterPhone(value);
  }

  defaultMessage(): string {
    return 'phone must be a valid phone number';
  }
}
