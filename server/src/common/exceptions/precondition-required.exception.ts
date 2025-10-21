import { HttpException } from '@nestjs/common';

/**
 * Custom exception for HTTP 428 Precondition Required
 * Used when a request requires certain conditions to be met before it can be processed
 */
export class PreconditionRequiredException extends HttpException {
  constructor(message: string = 'Precondition Required') {
    super(message, 428); // HTTP 428 Precondition Required
  }
}
