import { MulterOptions } from '@nestjs/platform-express/multer/interfaces/multer-options.interface';
import { diskStorage } from 'multer';
import { extname, join } from 'path';
import { existsSync, mkdirSync } from 'fs';
import { BadRequestException } from '@nestjs/common';

// Supported file types for each category
export const SUPPORTED_IMAGE_TYPES = {
  logo: ['.png', '.jpg', '.jpeg', '.svg', '.webp'],
  favicon: ['.ico', '.png'],
  appleTouch: ['.png', '.jpg', '.jpeg'],
};

// File size limits (in bytes)
export const FILE_SIZE_LIMITS = {
  logo: 5 * 1024 * 1024, // 5MB
  favicon: 1 * 1024 * 1024, // 1MB
  appleTouch: 2 * 1024 * 1024, // 2MB
};

// Valid field names for file uploads
export const VALID_FILE_FIELDS = [
  'logo',
  'favicon32x32',
  'favicon16x16',
  'appleTouch',
] as const;
export type FileFieldName = (typeof VALID_FILE_FIELDS)[number];

/**
 * Generate filename with timestamp and original extension
 */
function generateFilename(
  originalname: string,
  fieldname: string,
  customerId: string,
): string {
  const ext = extname(originalname).toLowerCase();
  const timestamp = Date.now();
  const sanitizedFieldname = fieldname.replace(/[^a-zA-Z0-9]/g, '_');
  return `${customerId}_${sanitizedFieldname}_${timestamp}${ext}`;
}

/**
 * Ensure upload directory exists
 */
function ensureUploadDir(customerId: string): string {
  const uploadDir = join(process.cwd(), 'uploads', 'customers', customerId);
  if (!existsSync(uploadDir)) {
    mkdirSync(uploadDir, { recursive: true });
  }
  return uploadDir;
}

/**
 * File filter for validation
 */
function fileFilter(
  req: Express.Request,
  file: Express.Multer.File,
  callback: (error: Error | null, acceptFile: boolean) => void,
) {
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
}

/**
 * Create Multer configuration for customer branding files
 */
export function createBrandingMulterConfig(customerId: string): MulterOptions {
  return {
    storage: diskStorage({
      destination: (req, file, callback) => {
        const uploadDir = ensureUploadDir(customerId);
        callback(null, uploadDir);
      },
      filename: (req, file, callback) => {
        const filename = generateFilename(
          file.originalname,
          file.fieldname,
          customerId,
        );
        callback(null, filename);
      },
    }),
    fileFilter,
    limits: {
      fileSize: Math.max(...Object.values(FILE_SIZE_LIMITS)), // Use the largest limit
      files: 4, // Maximum 4 files (logo, favicon32x32, favicon16x16, appleTouch)
    },
  };
}

/**
 * Generate public URL for uploaded file
 */
export function generateFileUrl(
  filename: string,
  customerId: string,
  baseUrl?: string,
): string {
  const base = baseUrl || process.env.API_BASE_URL || 'http://localhost:3001';
  return `${base}/uploads/customers/${customerId}/${filename}`;
}

/**
 * Extract filename from file path
 */
export function extractFilename(filePath: string): string {
  return filePath.split('/').pop() || filePath;
}

/**
 * Get file path from URL
 */
export function getFilePathFromUrl(url: string): string | null {
  const match = url.match(/\/uploads\/customers\/([^/]+)\/([^/]+)$/);
  return match
    ? join(process.cwd(), 'uploads', 'customers', match[1], match[2])
    : null;
}
