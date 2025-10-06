import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Professional, ProfessionalBranch } from '@prisma/client';

export type ProfessionalWithBranches = Professional & {
  branches: (ProfessionalBranch & {
    branch: {
      id: string;
      name: string;
    };
  })[];
};

export class ProfessionalEntity {
  @ApiProperty({
    description: 'Unique identifier for the professional',
    example: 'clm1234567890abcdef',
  })
  id: string;

  @ApiProperty({
    description: 'Name of the professional',
    example: 'João Silva',
  })
  name: string;

  @ApiPropertyOptional({
    description:
      'Professional document ID (e.g., CPF in Brazil, SSN in US, professional license number)',
    example: '123.456.789-00',
  })
  documentId?: string | null;

  @ApiPropertyOptional({
    description: 'URL to the professional photo',
    example: 'https://cdn.example.com/professionals/joao-silva.jpg',
  })
  photoUrl?: string | null;

  @ApiProperty({
    description: 'Whether the professional is active',
    example: true,
    default: true,
  })
  isActive: boolean;

  @ApiProperty({
    description: 'Customer ID this professional belongs to',
    example: 'customer-123',
  })
  customerId: string;

  @ApiProperty({
    description: 'When the professional was created',
    example: '2023-01-01T00:00:00.000Z',
  })
  createdAt: Date;

  @ApiProperty({
    description: 'When the professional was last updated',
    example: '2023-01-01T00:00:00.000Z',
  })
  updatedAt: Date;

  @ApiPropertyOptional({
    description: 'Branches this professional works at',
    type: 'array',
    items: {
      type: 'object',
      properties: {
        id: { type: 'string' },
        name: { type: 'string' },
      },
    },
  })
  branches?: Array<{
    id: string;
    name: string;
  }>;

  static fromPrisma(
    professional: ProfessionalWithBranches,
  ): ProfessionalEntity {
    const entity = new ProfessionalEntity();
    entity.id = professional.id;
    entity.name = professional.name;
    entity.documentId = professional.documentId;
    entity.photoUrl = professional.photoUrl;
    entity.isActive = professional.isActive;
    entity.customerId = professional.customerId;
    entity.createdAt = professional.createdAt;
    entity.updatedAt = professional.updatedAt;

    if (professional.branches) {
      entity.branches = professional.branches.map(pb => ({
        id: pb.branch.id,
        name: pb.branch.name,
      }));
    }

    return entity;
  }
}
