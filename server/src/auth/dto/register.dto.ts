import { ApiProperty } from '@nestjs/swagger';
import {
  IsBoolean,
  IsEmail,
  IsOptional,
  IsString,
  MinLength,
  Validate,
} from 'class-validator';

import { IsSupportedPhoneConstraint } from './is-supported-phone.constraint';

export class RegisterDto {
  @ApiProperty({ example: 'newuser@example.com' })
  @IsEmail()
  email!: string;

  @ApiProperty({ example: 'securePassword123' })
  @IsString()
  @MinLength(6)
  password!: string;

  @ApiProperty({ example: 'João Silva' })
  @IsString()
  name!: string;

  @ApiProperty({ example: '(11) 99999-9999', required: false })
  @IsOptional()
  @IsString()
  @Validate(IsSupportedPhoneConstraint)
  phone?: string;

  @ApiProperty({
    example: false,
    required: false,
    description:
      'Confirms linking an existing user account to this customer. Required when registering with an email that already exists.',
  })
  @IsOptional()
  @IsBoolean()
  confirmLink?: boolean;
}
