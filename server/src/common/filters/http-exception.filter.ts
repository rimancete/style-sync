import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { ApiError } from '../interfaces/api-response.interface';

@Catch(HttpException)
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: HttpException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();
    const status = exception.getStatus();

    // Skip transformation for health endpoints - let them use original format
    if (request.url.startsWith('/health')) {
      const originalResponse = exception.getResponse();
      response.status(status).json(originalResponse);
      return;
    }

    const exceptionResponse = exception.getResponse();
    let apiError: ApiError;

    if (typeof exceptionResponse === 'object' && exceptionResponse !== null) {
      const responseObj = exceptionResponse as Record<string, unknown>;

      // Handle validation errors (class-validator)
      if (responseObj.message && Array.isArray(responseObj.message)) {
        const errors: Record<string, string[]> = {};
        (responseObj.message as string[]).forEach((msg: string) => {
          // Extract field name from validation message if possible
          const fieldMatch = msg.match(/^(\w+) /);
          const field = fieldMatch ? fieldMatch[1].toLowerCase() : 'general';
          if (!errors[field]) errors[field] = [];
          errors[field].push(msg);
        });

        apiError = {
          status,
          message: 'Validation failed',
          errors,
        };
      } else {
        apiError = {
          status,
          message: (responseObj.message as string) || exception.message,
        };
      }
    } else {
      apiError = {
        status,
        message: exception.message,
      };
    }

    response.status(status).json(apiError);
  }
}
