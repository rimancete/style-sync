import { Injectable, NotFoundException } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { CustomerBrandingResponseDto } from './dto/customer-branding.response.dto';
import { UpdateCustomerBrandingDto } from './dto/update-customer-branding.dto';
import { Prisma } from '@prisma/client';

@Injectable()
export class CustomersService {
  constructor(private prisma: DatabaseService) {}

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

    return {
      id: customer.id,
      name: customer.name,
      urlSlug: customer.urlSlug,
      branding: {
        favicon32x32: customer.favicon32x32 || undefined,
        favicon16x16: customer.favicon16x16 || undefined,
        appleTouch: customer.appleTouch || undefined,
        documentTitle: customer.documentTitle,
        theme: {
          light: {
            logoUrl: customer.logoUrl || undefined,
            logoAlt: customer.logoAlt,
            primary: {
              main: customer.primaryMain,
              light: customer.primaryLight,
              dark: customer.primaryDark,
              contrast: customer.primaryContrast,
            },
            secondary: {
              main: customer.secondaryMain,
              light: customer.secondaryLight,
              dark: customer.secondaryDark,
              contrast: customer.secondaryContrast,
            },
            background: customer.backgroundColor,
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
}
