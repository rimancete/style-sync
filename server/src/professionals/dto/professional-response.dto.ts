import { ApiProperty } from '@nestjs/swagger';
import { ProfessionalEntity } from '../entities/professional.entity';

export class ProfessionalResponseDto extends ProfessionalEntity {}

export class ProfessionalsListResponseDto {
  @ApiProperty({
    description: 'List of professionals',
    type: [ProfessionalResponseDto],
  })
  professionals: ProfessionalResponseDto[];

  @ApiProperty({
    description: 'Total count of professionals',
    example: 25,
  })
  total: number;

  @ApiProperty({
    description: 'Current page (for pagination)',
    example: 1,
  })
  page: number;

  @ApiProperty({
    description: 'Number of items per page',
    example: 10,
  })
  limit: number;
}
