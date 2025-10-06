import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  BadRequestException,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { Request } from 'express';
import { diskStorage } from 'multer';
import { extname, join } from 'path';
import { existsSync, mkdirSync } from 'fs';

/**
 * Configuration for professional photo uploads
 */
export const PROFESSIONAL_PHOTO_CONFIG = {
  allowedTypes: ['.png', '.jpg', '.jpeg', '.webp'],
  maxSize: 5 * 1024 * 1024, // 5MB
  fieldName: 'photo',
};

/**
 * Create multer configuration for professional photo uploads
 */
export function createProfessionalPhotoConfig(professionalId: string) {
  return {
    storage: diskStorage({
      destination: (req, file, callback) => {
        const uploadDir = join(
          process.cwd(),
          'uploads',
          'professionals',
          professionalId,
        );

        if (!existsSync(uploadDir)) {
          mkdirSync(uploadDir, { recursive: true });
        }

        callback(null, uploadDir);
      },
      filename: (req, file, callback) => {
        const ext = extname(file.originalname).toLowerCase();
        const timestamp = Date.now();
        const filename = `photo_${timestamp}${ext}`;
        callback(null, filename);
      },
    }),
    fileFilter: (
      req: Express.Request,
      file: Express.Multer.File,
      callback: (error: Error | null, acceptFile: boolean) => void,
    ) => {
      // Validate file field name
      if (file.fieldname !== PROFESSIONAL_PHOTO_CONFIG.fieldName) {
        callback(
          new BadRequestException(
            `Invalid field name. Expected '${PROFESSIONAL_PHOTO_CONFIG.fieldName}'`,
          ),
          false,
        );
        return;
      }

      // Validate file type
      const ext = extname(file.originalname).toLowerCase();
      if (!PROFESSIONAL_PHOTO_CONFIG.allowedTypes.includes(ext)) {
        callback(
          new BadRequestException(
            `Invalid file type. Allowed types: ${PROFESSIONAL_PHOTO_CONFIG.allowedTypes.join(', ')}`,
          ),
          false,
        );
        return;
      }

      // Validate MIME type as additional security
      const allowedMimeTypes = [
        'image/png',
        'image/jpeg',
        'image/jpg',
        'image/webp',
      ];
      if (!allowedMimeTypes.includes(file.mimetype)) {
        callback(
          new BadRequestException(
            `Invalid MIME type. Expected image file, got ${file.mimetype}`,
          ),
          false,
        );
        return;
      }

      callback(null, true);
    },
    limits: {
      fileSize: PROFESSIONAL_PHOTO_CONFIG.maxSize,
      files: 1, // Only one photo at a time
    },
  };
}

/**
 * Interceptor to validate professional photo uploads
 * This is mainly for documentation - actual validation happens in multer fileFilter
 */
@Injectable()
export class ProfessionalPhotoInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const request = context.switchToHttp().getRequest<
      Request & {
        file?: Express.Multer.File;
      }
    >();
    const file: Express.Multer.File | undefined = request.file;

    // If no file was provided, multer won't add it to request
    // The controller should handle this case
    if (!file) {
      return next.handle();
    }

    // Additional size check (should be caught by multer, but double-check)
    if (file.size > PROFESSIONAL_PHOTO_CONFIG.maxSize) {
      throw new BadRequestException(
        `File too large. Maximum size: ${PROFESSIONAL_PHOTO_CONFIG.maxSize / (1024 * 1024)}MB`,
      );
    }

    return next.handle();
  }
}
