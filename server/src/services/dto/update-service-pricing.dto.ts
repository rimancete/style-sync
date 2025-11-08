import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, Min, Max } from 'class-validator';
import { Transform } from 'class-transformer';

/**
 * DTO for updating service pricing (price only)
 */
export class UpdateServicePricingDto {
  @ApiProperty({
    description: 'Service price in decimal format',
    example: 30.0,
    minimum: 0.01,
    maximum: 9999.99,
  })
  @Transform(({ value }): number =>
    typeof value === 'string' ? parseFloat(value) : (value as number),
  )
  @IsNumber(
    { maxDecimalPlaces: 2 },
    { message: 'Price must have at most 2 decimal places' },
  )
  @Min(0.01, { message: 'Price must be at least 0.01' })
  @Max(9999.99, { message: 'Price cannot exceed 9999.99' })
  price: number;
}
