import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { CustomerBrandingResponseDto } from './dto/customer-branding.response.dto';
import { UpdateCustomerBrandingDto } from './dto/update-customer-branding.dto';
import { CreateCustomerBrandingConfigDto } from './dto/create-customer-branding.dto';
import { CustomerSummary } from '../common/interfaces/api-response.interface';
import { FileService, UploadedFileInfo } from '../common/services/file.service';
import { Prisma } from '@prisma/client';

@Injectable()
export class CustomersService {
  private readonly logger = new Logger(CustomersService.name);

  constructor(
    private prisma: DatabaseService,
    private fileService: FileService,
  ) {}

  async getCustomerBranding(
    urlSlug: string,
  ): Promise<CustomerBrandingResponseDto> {
    const customer = await this.prisma.customer.findUnique({
      where: { urlSlug },
    });

    if (!customer) {
      throw new NotFoundException(
        `Customer with URL slug '${urlSlug}' not found`,
      );
    }

    if (!customer.isActive) {
      throw new NotFoundException(
        `Customer with URL slug '${urlSlug}' is not active`,
      );
    }

    // Generate full URLs from filenames
    const fileUrls = this.fileService.generateUrlsFromData(
      {
        logoUrl: customer.logoUrl,
        favicon32x32: customer.favicon32x32,
        favicon16x16: customer.favicon16x16,
        appleTouch: customer.appleTouch,
      },
      customer.id,
    );

    return {
      id: customer.id,
      name: customer.name,
      urlSlug: customer.urlSlug,
      branding: {
        favicon32x32: fileUrls.favicon32x32 || null,
        favicon16x16: fileUrls.favicon16x16 || null,
        appleTouch: fileUrls.appleTouch || null,
        documentTitle: customer.documentTitle || '',
        theme: {
          light: {
            logoUrl: fileUrls.logo || null,
            logoAlt: customer.logoAlt || '',
            primary: {
              main: customer.primaryMain || '#272726FF',
              light: customer.primaryLight || '#706E6DFF',
              dark: customer.primaryDark || '#1B1B1BFF',
              contrast: customer.primaryContrast || '#ECE8E6FF',
            },
            secondary: {
              main: customer.secondaryMain || '#8D8C8BFF',
              light: customer.secondaryLight || '#E7E7E6FF',
              dark: customer.secondaryDark || '#3B3B3BFF',
              contrast: customer.secondaryContrast || '#1B1B1BFF',
            },
            background: customer.backgroundColor || '#F7F7F7FF',
          },
        },
      },
      isActive: customer.isActive,
    };
  }

  async updateCustomerBranding(
    customerId: string,
    updateDto: UpdateCustomerBrandingDto,
  ): Promise<CustomerBrandingResponseDto> {
    const customer = await this.prisma.customer.findUnique({
      where: { id: customerId },
    });

    if (!customer) {
      throw new NotFoundException(`Customer with ID '${customerId}' not found`);
    }

    const updateData: Prisma.CustomerUpdateInput = {};

    if (updateDto.documentTitle !== undefined) {
      updateData.documentTitle = updateDto.documentTitle;
    }

    if (updateDto.logoAlt !== undefined) {
      updateData.logoAlt = updateDto.logoAlt;
    }

    if (updateDto.theme?.light?.primary?.main !== undefined) {
      updateData.primaryMain = updateDto.theme.light.primary.main;
    }

    if (updateDto.theme?.light?.primary?.light !== undefined) {
      updateData.primaryLight = updateDto.theme.light.primary.light;
    }

    if (updateDto.theme?.light?.primary?.dark !== undefined) {
      updateData.primaryDark = updateDto.theme.light.primary.dark;
    }

    if (updateDto.theme?.light?.primary?.contrast !== undefined) {
      updateData.primaryContrast = updateDto.theme.light.primary.contrast;
    }

    if (updateDto.theme?.light?.secondary?.main !== undefined) {
      updateData.secondaryMain = updateDto.theme.light.secondary.main;
    }

    if (updateDto.theme?.light?.secondary?.light !== undefined) {
      updateData.secondaryLight = updateDto.theme.light.secondary.light;
    }

    if (updateDto.theme?.light?.secondary?.dark !== undefined) {
      updateData.secondaryDark = updateDto.theme.light.secondary.dark;
    }

    if (updateDto.theme?.light?.secondary?.contrast !== undefined) {
      updateData.secondaryContrast = updateDto.theme.light.secondary.contrast;
    }

    if (updateDto.theme?.light?.background !== undefined) {
      updateData.backgroundColor = updateDto.theme.light.background;
    }

    const updatedCustomer = await this.prisma.customer.update({
      where: { id: customerId },
      data: updateData,
    });

    return this.getCustomerBranding(updatedCustomer.urlSlug);
  }

  async getCustomerById(customerId: string) {
    const customer = await this.prisma.customer.findUnique({
      where: { id: customerId },
    });

    if (!customer) {
      throw new NotFoundException(`Customer with ID '${customerId}' not found`);
    }

    return customer;
  }

  /**
   * Get user's customer associations
   */
  async getUserCustomers(userId: string): Promise<CustomerSummary[]> {
    const userCustomers = await this.prisma.userCustomer.findMany({
      where: { userId },
      include: {
        customer: {
          select: {
            id: true,
            name: true,
            urlSlug: true,
            logoUrl: true,
            isActive: true,
          },
        },
      },
    });

    return userCustomers
      .filter(uc => uc.customer.isActive)
      .map(uc => ({
        id: uc.customer.id,
        name: uc.customer.name,
        urlSlug: uc.customer.urlSlug,
        logoUrl: uc.customer.logoUrl || undefined,
      }));
  }

  /**
   * Create initial branding setup with files and configuration
   */
  async createCustomerBranding(
    customerId: string,
    files: Record<string, UploadedFileInfo>,
    config?: CreateCustomerBrandingConfigDto,
  ): Promise<CustomerBrandingResponseDto> {
    const customer = await this.prisma.customer.findUnique({
      where: { id: customerId },
    });

    if (!customer) {
      // Clean up uploaded files if customer doesn't exist
      await this.cleanupUploadedFiles(files);
      throw new NotFoundException(`Customer with ID '${customerId}' not found`);
    }

    try {
      // Prepare old file URLs for cleanup and update data
      const oldUrls: Record<string, string | undefined> = {};
      const updateData: Prisma.CustomerUpdateInput = {};

      // Update file URLs and track old ones for cleanup
      if (files.logo) {
        oldUrls.logo = customer.logoUrl || undefined;
        updateData.logoUrl = files.logo.filename;
      }
      if (files.favicon32x32) {
        oldUrls.favicon32x32 = customer.favicon32x32 || undefined;
        updateData.favicon32x32 = files.favicon32x32.filename;
      }
      if (files.favicon16x16) {
        oldUrls.favicon16x16 = customer.favicon16x16 || undefined;
        updateData.favicon16x16 = files.favicon16x16.filename;
      }
      if (files.appleTouch) {
        oldUrls.appleTouch = customer.appleTouch || undefined;
        updateData.appleTouch = files.appleTouch.filename;
      }

      // Update configuration if provided
      if (config) {
        this.applyConfigurationUpdates(updateData, config);
      }

      // Perform atomic update
      const updatedCustomer = await this.prisma.customer.update({
        where: { id: customerId },
        data: updateData,
      });

      // Clean up old files after successful update
      await this.fileService.cleanupOldFiles(oldUrls, customerId);

      this.logger.log(
        `Created branding for customer ${customerId} with ${Object.keys(files).length} files`,
      );
      return this.getCustomerBranding(updatedCustomer.urlSlug);
    } catch (error) {
      // Clean up uploaded files on error
      await this.cleanupUploadedFiles(files);
      throw error;
    }
  }

  /**
   * Update customer branding files only (no config changes)
   */
  async updateCustomerBrandingFiles(
    customerId: string,
    files: Record<string, UploadedFileInfo>,
  ): Promise<CustomerBrandingResponseDto> {
    const customer = await this.prisma.customer.findUnique({
      where: { id: customerId },
    });

    if (!customer) {
      // Clean up uploaded files if customer doesn't exist
      await this.cleanupUploadedFiles(files);
      throw new NotFoundException(`Customer with ID '${customerId}' not found`);
    }

    try {
      // Prepare old file URLs for cleanup
      const oldUrls: Record<string, string | undefined> = {};
      const updateData: Prisma.CustomerUpdateInput = {};

      // Update file URLs and track old ones for cleanup
      if (files.logo) {
        oldUrls.logo = customer.logoUrl || undefined;
        updateData.logoUrl = files.logo.filename;
      }
      if (files.favicon32x32) {
        oldUrls.favicon32x32 = customer.favicon32x32 || undefined;
        updateData.favicon32x32 = files.favicon32x32.filename;
      }
      if (files.favicon16x16) {
        oldUrls.favicon16x16 = customer.favicon16x16 || undefined;
        updateData.favicon16x16 = files.favicon16x16.filename;
      }
      if (files.appleTouch) {
        oldUrls.appleTouch = customer.appleTouch || undefined;
        updateData.appleTouch = files.appleTouch.filename;
      }

      // Perform atomic update
      const updatedCustomer = await this.prisma.customer.update({
        where: { id: customerId },
        data: updateData,
      });

      // Clean up old files after successful update
      await this.fileService.cleanupOldFiles(oldUrls, customerId);

      this.logger.log(
        `Updated branding files for customer ${customerId} with ${Object.keys(files).length} files`,
      );
      return this.getCustomerBranding(updatedCustomer.urlSlug);
    } catch (error) {
      // Clean up new uploaded files on error
      await this.cleanupUploadedFiles(files);
      throw error;
    }
  }

  /**
   * Parse configuration JSON string
   */
  parseConfigurationJson(configJson: string): CreateCustomerBrandingConfigDto {
    try {
      return JSON.parse(configJson) as CreateCustomerBrandingConfigDto;
    } catch (error) {
      this.logger.error('Error parsing configuration JSON', error);
      throw new BadRequestException('Invalid JSON in config field');
    }
  }

  /**
   * Apply configuration updates to Prisma update data
   */
  private applyConfigurationUpdates(
    updateData: Prisma.CustomerUpdateInput,
    config: CreateCustomerBrandingConfigDto,
  ): void {
    if (config.documentTitle !== undefined) {
      updateData.documentTitle = config.documentTitle;
    }

    if (config.logoAlt !== undefined) {
      updateData.logoAlt = config.logoAlt;
    }

    if (config.theme?.light?.primary?.main !== undefined) {
      updateData.primaryMain = config.theme.light.primary.main;
    }

    if (config.theme?.light?.primary?.light !== undefined) {
      updateData.primaryLight = config.theme.light.primary.light;
    }

    if (config.theme?.light?.primary?.dark !== undefined) {
      updateData.primaryDark = config.theme.light.primary.dark;
    }

    if (config.theme?.light?.primary?.contrast !== undefined) {
      updateData.primaryContrast = config.theme.light.primary.contrast;
    }

    if (config.theme?.light?.secondary?.main !== undefined) {
      updateData.secondaryMain = config.theme.light.secondary.main;
    }

    if (config.theme?.light?.secondary?.light !== undefined) {
      updateData.secondaryLight = config.theme.light.secondary.light;
    }

    if (config.theme?.light?.secondary?.dark !== undefined) {
      updateData.secondaryDark = config.theme.light.secondary.dark;
    }

    if (config.theme?.light?.secondary?.contrast !== undefined) {
      updateData.secondaryContrast = config.theme.light.secondary.contrast;
    }

    if (config.theme?.light?.background !== undefined) {
      updateData.backgroundColor = config.theme.light.background;
    }
  }

  /**
   * Clean up uploaded files
   */
  private async cleanupUploadedFiles(
    files: Record<string, UploadedFileInfo>,
  ): Promise<void> {
    const deletePromises = Object.values(files).map(fileInfo =>
      this.fileService
        .deleteFile(fileInfo.path)
        .catch(error =>
          this.logger.warn(
            `Failed to cleanup uploaded file: ${fileInfo.path}`,
            error,
          ),
        ),
    );

    await Promise.allSettled(deletePromises);
  }
}
