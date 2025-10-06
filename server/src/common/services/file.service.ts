import { Injectable, Logger } from '@nestjs/common';
import { unlink } from 'fs/promises';
import { existsSync } from 'fs';
import { join } from 'path';
import {
  generateFileUrl,
  getFilePathFromUrl,
  FileFieldName,
} from '../config/multer.config';

export interface UploadedFileInfo {
  fieldname: FileFieldName;
  filename: string;
  path: string;
  url: string;
}

@Injectable()
export class FileService {
  private readonly logger = new Logger(FileService.name);

  /**
   * Upload a single file and generate URL
   */
  uploadFile(
    file: Express.Multer.File,
    customerId: string,
    filename?: string,
  ): string {
    const fileName = filename || file.filename;
    return generateFileUrl(fileName, customerId);
  }

  /**
   * Process uploaded files and generate URLs
   */
  processUploadedFiles(
    files:
      | { [fieldname: string]: Express.Multer.File[] }
      | Express.Multer.File[],
    customerId: string,
    baseUrl?: string,
  ): Record<string, UploadedFileInfo> {
    const processedFiles: Record<string, UploadedFileInfo> = {};

    // Handle undefined/null files
    if (!files) {
      return processedFiles;
    }

    // Handle both array and object formats from multer
    const fileEntries = Array.isArray(files)
      ? files.map(file => [file.fieldname, [file]] as const)
      : Object.entries(files);

    for (const [fieldname, fileArray] of fileEntries) {
      if (fileArray && fileArray.length > 0) {
        const file = fileArray[0]; // Take first file if multiple
        processedFiles[fieldname] = {
          fieldname: fieldname as FileFieldName,
          filename: file.filename,
          path: file.path,
          url: generateFileUrl(file.filename, customerId, baseUrl),
        };
      }
    }

    return processedFiles;
  }

  /**
   * Delete a file from the filesystem
   */
  async deleteFile(filePath: string): Promise<boolean> {
    try {
      if (existsSync(filePath)) {
        await unlink(filePath);
        this.logger.log(`Deleted file: ${filePath}`);
        return true;
      }
      return false;
    } catch (error) {
      this.logger.error(`Failed to delete file: ${filePath}`, error);
      return false;
    }
  }

  /**
   * Delete file by URL
   */
  async deleteFileByUrl(url: string): Promise<boolean> {
    const filePath = getFilePathFromUrl(url);
    if (!filePath) {
      this.logger.warn(`Could not extract file path from URL: ${url}`);
      return false;
    }
    return this.deleteFile(filePath);
  }

  /**
   * Clean up old files when new ones are uploaded
   * Accepts either full URLs or filenames with customerId
   */
  async cleanupOldFiles(
    oldFiles: Record<string, string | undefined>,
    customerId?: string,
  ): Promise<void> {
    const deletePromises = Object.entries(oldFiles)
      .filter(([, fileRef]) => fileRef)
      .map(([fieldname, fileRef]) => {
        // We know fileRef is defined due to the filter above
        const fileReference = fileRef as string;

        // If it's a full URL, use deleteFileByUrl
        if (fileReference.startsWith('http')) {
          return this.deleteFileByUrl(fileReference).catch(error =>
            this.logger.warn(
              `Failed to cleanup old ${fieldname} file: ${fileReference}`,
              error,
            ),
          );
        } else {
          // If it's a filename, construct the path directly
          if (!customerId) {
            this.logger.warn(
              `Cannot cleanup file ${fileReference} - customerId required for filename`,
            );
            return Promise.resolve();
          }
          const filePath = join(
            process.cwd(),
            'uploads',
            'customers',
            customerId,
            fileReference,
          );
          return this.deleteFile(filePath).catch(error =>
            this.logger.warn(
              `Failed to cleanup old ${fieldname} file: ${filePath}`,
              error,
            ),
          );
        }
      });

    await Promise.allSettled(deletePromises);
  }

  /**
   * Validate file exists at given path
   */
  fileExists(filePath: string): boolean {
    return existsSync(filePath);
  }

  /**
   * Get file path for a customer and filename
   */
  getCustomerFilePath(customerId: string, filename: string): string {
    return join(process.cwd(), 'uploads', 'customers', customerId, filename);
  }

  /**
   * Generate file URLs from database data
   */
  generateUrlsFromData(
    data: {
      logoUrl?: string | null;
      favicon32x32?: string | null;
      favicon16x16?: string | null;
      appleTouch?: string | null;
    },
    customerId: string,
    baseUrl?: string,
  ): Record<string, string | undefined> {
    const urls: Record<string, string | undefined> = {};

    if (data.logoUrl) {
      // If it's already a full URL, keep it; otherwise generate it
      urls.logo = data.logoUrl.startsWith('http')
        ? data.logoUrl
        : generateFileUrl(data.logoUrl, customerId, baseUrl);
    }

    if (data.favicon32x32) {
      urls.favicon32x32 = data.favicon32x32.startsWith('http')
        ? data.favicon32x32
        : generateFileUrl(data.favicon32x32, customerId, baseUrl);
    }

    if (data.favicon16x16) {
      urls.favicon16x16 = data.favicon16x16.startsWith('http')
        ? data.favicon16x16
        : generateFileUrl(data.favicon16x16, customerId, baseUrl);
    }

    if (data.appleTouch) {
      urls.appleTouch = data.appleTouch.startsWith('http')
        ? data.appleTouch
        : generateFileUrl(data.appleTouch, customerId, baseUrl);
    }

    return urls;
  }
}
