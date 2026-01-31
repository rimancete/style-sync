import { UseInterceptors, applyDecorators } from '@nestjs/common';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import { ApiConsumes, ApiBody } from '@nestjs/swagger';
import { diskStorage } from 'multer';
import { extname, join } from 'path';
import { existsSync, mkdirSync } from 'fs';
import { BadRequestException } from '@nestjs/common';
import {
  SUPPORTED_IMAGE_TYPES,
  FILE_SIZE_LIMITS,
  VALID_FILE_FIELDS,
  FileFieldName,
} from '../config/multer.config';

/**
 * Dynamic multer configuration for customer branding uploads
 */
function createDynamicBrandingConfig() {
  return {
    storage: diskStorage({
      destination: (req, file, callback) => {
        const customerIdParam = req.params.customerId;
        const customerId = Array.isArray(customerIdParam)
          ? customerIdParam[0]
          : customerIdParam;
        if (!customerId) {
          return callback(
            new BadRequestException('Customer ID is required'),
            '',
          );
        }

        const uploadDir = join(
          process.cwd(),
          'uploads',
          'customers',
          customerId,
        );
        if (!existsSync(uploadDir)) {
          mkdirSync(uploadDir, { recursive: true });
        }
        callback(null, uploadDir);
      },
      filename: (req, file, callback) => {
        const customerIdParam = req.params.customerId;
        const customerId = Array.isArray(customerIdParam)
          ? customerIdParam[0]
          : customerIdParam;
        const ext = extname(file.originalname).toLowerCase();
        const timestamp = Date.now();
        const sanitizedFieldname = file.fieldname.replace(/[^a-zA-Z0-9]/g, '_');
        const filename = `${customerId}_${sanitizedFieldname}_${timestamp}${ext}`;
        callback(null, filename);
      },
    }),
    fileFilter: (
      req: Express.Request,
      file: Express.Multer.File,
      callback: (error: Error | null, acceptFile: boolean) => void,
    ) => {
      const fieldname = file.fieldname as FileFieldName;

      if (!VALID_FILE_FIELDS.includes(fieldname)) {
        callback(
          new BadRequestException(`Invalid file field: ${fieldname}`),
          false,
        );
        return;
      }

      const ext = extname(file.originalname).toLowerCase();
      let allowedTypes: string[] = [];

      // Determine allowed types based on field name
      if (fieldname === 'logo') {
        allowedTypes = SUPPORTED_IMAGE_TYPES.logo;
      } else if (fieldname.includes('favicon')) {
        allowedTypes = SUPPORTED_IMAGE_TYPES.favicon;
      } else if (fieldname === 'appleTouch') {
        allowedTypes = SUPPORTED_IMAGE_TYPES.appleTouch;
      }

      if (!allowedTypes.includes(ext)) {
        callback(
          new BadRequestException(
            `Invalid file type for ${fieldname}. Allowed types: ${allowedTypes.join(', ')}`,
          ),
          false,
        );
        return;
      }

      callback(null, true);
    },
    limits: {
      fileSize: Math.max(...Object.values(FILE_SIZE_LIMITS)), // Use the largest limit
      files: 4, // Maximum 4 files
    },
  };
}

/**
 * Decorator for customer branding file uploads
 * Handles multiple file fields with proper Swagger documentation and customer-specific multer config
 */
export function CustomerBrandingUpload() {
  return applyDecorators(
    UseInterceptors(
      FileFieldsInterceptor(
        [
          { name: 'logo', maxCount: 1 },
          { name: 'favicon32x32', maxCount: 1 },
          { name: 'favicon16x16', maxCount: 1 },
          { name: 'appleTouch', maxCount: 1 },
        ],
        createDynamicBrandingConfig(),
      ),
    ),
    ApiConsumes('multipart/form-data'),
    ApiBody({
      description: 'Customer branding files and configuration',
      schema: {
        type: 'object',
        properties: {
          logo: {
            type: 'string',
            format: 'binary',
            description:
              'Logo image file (PNG, JPG, JPEG, SVG, WebP - max 5MB)',
          },
          favicon32x32: {
            type: 'string',
            format: 'binary',
            description: '32x32 favicon file (ICO, PNG - max 1MB)',
          },
          favicon16x16: {
            type: 'string',
            format: 'binary',
            description: '16x16 favicon file (ICO, PNG - max 1MB)',
          },
          appleTouch: {
            type: 'string',
            format: 'binary',
            description: 'Apple touch icon file (PNG, JPG, JPEG - max 2MB)',
          },
          config: {
            type: 'string',
            description: 'JSON string containing branding configuration',
            example:
              '{"documentTitle": "My Barbershop", "logoAlt": "My Logo", "theme": {"light": {"primary": {"main": "#272726FF"}}}}',
          },
        },
      },
    }),
  );
}
