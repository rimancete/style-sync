import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { FileService } from '../common/services/file.service';
import { CreateProfessionalDto } from './dto/create-professional.dto';
import { UpdateProfessionalDto } from './dto/update-professional.dto';
import {
  ProfessionalResponseDto,
  ProfessionalsListResponseDto,
} from './dto/professional-response.dto';
import { ProfessionalEntity } from './entities/professional.entity';

@Injectable()
export class ProfessionalsService {
  constructor(
    private readonly db: DatabaseService,
    private readonly fileService: FileService,
  ) {}

  async create(
    createProfessionalDto: CreateProfessionalDto,
  ): Promise<ProfessionalResponseDto> {
    // Validate customer exists
    const customer = await this.db.customer.findUnique({
      where: { id: createProfessionalDto.customerId },
    });

    if (!customer) {
      throw new NotFoundException(
        `Customer with ID ${createProfessionalDto.customerId} not found`,
      );
    }

    // Check if professional with same name already exists for this customer
    const existing = await this.db.professional.findFirst({
      where: {
        name: createProfessionalDto.name,
        customerId: createProfessionalDto.customerId,
      },
    });

    if (existing) {
      throw new ConflictException(
        'Professional with this name already exists for this customer',
      );
    }

    // Check if documentId is provided and already exists for this customer
    if (createProfessionalDto.documentId) {
      const existingDoc = await this.db.professional.findFirst({
        where: {
          documentId: createProfessionalDto.documentId,
          customerId: createProfessionalDto.customerId,
        },
      });

      if (existingDoc) {
        throw new ConflictException(
          'Professional with this document ID already exists for this customer',
        );
      }
    }

    // Validate branch IDs belong to the same customer
    if (
      createProfessionalDto.branchIds &&
      createProfessionalDto.branchIds.length > 0
    ) {
      const branches = await this.db.branch.findMany({
        where: {
          id: { in: createProfessionalDto.branchIds },
          customerId: createProfessionalDto.customerId,
          deletedAt: null,
        },
      });

      if (branches.length !== createProfessionalDto.branchIds.length) {
        throw new BadRequestException(
          'Some branch IDs are invalid or belong to different customers',
        );
      }
    }

    // Create professional
    const professional = await this.db.professional.create({
      data: {
        name: createProfessionalDto.name,
        documentId: createProfessionalDto.documentId,
        isActive: createProfessionalDto.isActive ?? true,
        customerId: createProfessionalDto.customerId,
        branches: createProfessionalDto.branchIds
          ? {
              create: createProfessionalDto.branchIds.map(branchId => ({
                branchId,
              })),
            }
          : undefined,
      },
      include: {
        branches: {
          include: {
            branch: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
    });

    return ProfessionalEntity.fromPrisma(professional);
  }

  async findAll(
    customerId?: string,
    page = 1,
    limit = 1000,
    includeInactive = true,
  ): Promise<ProfessionalsListResponseDto> {
    const skip = (page - 1) * limit;

    const where: { customerId?: string; isActive?: boolean } = {};

    // Filter by customer if provided
    if (customerId) {
      where.customerId = customerId;
    }

    // Filter by active status unless includeInactive is true
    if (!includeInactive) {
      where.isActive = true;
    }

    const [professionals, total] = await Promise.all([
      this.db.professional.findMany({
        where,
        skip,
        take: limit,
        orderBy: { name: 'asc' },
        include: {
          branches: {
            include: {
              branch: {
                select: {
                  id: true,
                  name: true,
                },
              },
            },
          },
        },
      }),
      this.db.professional.count({ where }),
    ]);

    const data = professionals.map(professional =>
      ProfessionalEntity.fromPrisma(professional),
    );

    return {
      professionals: data,
      total,
      page,
      limit,
    };
  }

  async findOne(
    id: string,
    customerId?: string,
  ): Promise<ProfessionalResponseDto> {
    const where: { id: string; customerId?: string } = { id };
    if (customerId) {
      where.customerId = customerId;
    }

    const professional = await this.db.professional.findFirst({
      where,
      include: {
        branches: {
          include: {
            branch: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
    });

    if (!professional) {
      throw new NotFoundException('Professional not found');
    }

    return ProfessionalEntity.fromPrisma(professional);
  }

  async update(
    id: string,
    updateProfessionalDto: UpdateProfessionalDto,
    customerId?: string,
  ): Promise<ProfessionalResponseDto> {
    // Check if professional exists
    const existingProfessional = await this.findOne(id, customerId);

    // Check if name is being changed and if it conflicts
    if (
      updateProfessionalDto.name &&
      updateProfessionalDto.name !== existingProfessional.name
    ) {
      const nameConflict = await this.db.professional.findFirst({
        where: {
          name: updateProfessionalDto.name,
          customerId: customerId || existingProfessional.customerId,
          id: { not: id },
        },
      });

      if (nameConflict) {
        throw new ConflictException(
          'Professional with this name already exists for this customer',
        );
      }
    }

    // Validate branch IDs if provided
    if (updateProfessionalDto.branchIds) {
      const branches = await this.db.branch.findMany({
        where: {
          id: { in: updateProfessionalDto.branchIds },
          customerId: customerId || existingProfessional.customerId,
          deletedAt: null,
        },
      });

      if (branches.length !== updateProfessionalDto.branchIds.length) {
        throw new BadRequestException(
          'Some branch IDs are invalid or belong to different customers',
        );
      }
    }

    // Update professional
    const professional = await this.db.professional.update({
      where: { id },
      data: {
        ...(updateProfessionalDto.name && { name: updateProfessionalDto.name }),
        ...(updateProfessionalDto.isActive !== undefined && {
          isActive: updateProfessionalDto.isActive,
        }),
        ...(updateProfessionalDto.branchIds !== undefined && {
          branches: {
            deleteMany: {}, // Remove all existing branch associations
            create: updateProfessionalDto.branchIds.map(branchId => ({
              branchId,
            })),
          },
        }),
      },
      include: {
        branches: {
          include: {
            branch: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
    });

    return ProfessionalEntity.fromPrisma(professional);
  }

  async remove(id: string, customerId?: string): Promise<void> {
    // Check if professional exists and get customer context
    await this.findOne(id, customerId);

    // Check if professional has any bookings
    const bookingsCount = await this.db.booking.count({
      where: { professionalId: id },
    });

    if (bookingsCount > 0) {
      throw new ConflictException(
        'Cannot delete professional with associated bookings',
      );
    }

    // Soft delete by deactivating
    await this.db.professional.update({
      where: { id },
      data: { isActive: false },
    });
  }

  async findByCustomer(
    customerId: string,
  ): Promise<ProfessionalsListResponseDto> {
    return this.findAll(customerId);
  }

  async findByBranch(
    branchId: string,
    customerId?: string,
    includeInactive = true,
  ): Promise<ProfessionalsListResponseDto> {
    const where: {
      isActive?: boolean;
      branches: { some: { branchId: string } };
      customerId?: string;
    } = {
      branches: {
        some: {
          branchId,
        },
      },
    };

    if (!includeInactive) {
      where.isActive = true;
    }

    if (customerId) {
      where.customerId = customerId;
    }

    const professionals = await this.db.professional.findMany({
      where,
      include: {
        branches: {
          include: {
            branch: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
      orderBy: { name: 'asc' },
    });

    const data = professionals.map(professional =>
      ProfessionalEntity.fromPrisma(professional),
    );

    return {
      professionals: data,
      total: data.length,
      page: 1,
      limit: data.length,
    };
  }

  async uploadPhoto(
    id: string,
    file: Express.Multer.File,
    customerId?: string,
  ): Promise<ProfessionalResponseDto> {
    const professional = await this.findOne(id, customerId);

    // Delete old photo if exists
    if (professional.photoUrl) {
      await this.fileService.deleteFile(professional.photoUrl);
    }

    // Upload new photo
    const photoUrl = this.fileService.uploadFile(
      file,
      `professionals/${professional.customerId}`,
      `professional_${id}_${Date.now()}.${file.originalname.split('.').pop()}`,
    );

    // Update professional with new photo URL
    const updatedProfessional = await this.db.professional.update({
      where: { id },
      data: { photoUrl },
      include: {
        branches: {
          include: {
            branch: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
    });

    return ProfessionalEntity.fromPrisma(updatedProfessional);
  }

  async deletePhoto(
    id: string,
    customerId?: string,
  ): Promise<ProfessionalResponseDto> {
    const professional = await this.findOne(id, customerId);

    if (professional.photoUrl) {
      await this.fileService.deleteFile(professional.photoUrl);

      const updatedProfessional = await this.db.professional.update({
        where: { id },
        data: { photoUrl: null },
        include: {
          branches: {
            include: {
              branch: {
                select: {
                  id: true,
                  name: true,
                },
              },
            },
          },
        },
      });

      return ProfessionalEntity.fromPrisma(updatedProfessional);
    }

    return professional;
  }
}
