import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Request } from 'express';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { ApiResponse } from '../interfaces/api-response.interface';

@Injectable()
export class ResponseTransformInterceptor<T>
  implements NestInterceptor<T, ApiResponse<T> | T>
{
  intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Observable<ApiResponse<T> | T> {
    const request = context.switchToHttp().getRequest<Request>();

    // Skip transformation for health endpoints
    if (request.url.startsWith('/health')) {
      return next.handle() as Observable<T>;
    }

    return next.handle().pipe(
      map((data: T) => ({
        data,
      })),
    );
  }
}
