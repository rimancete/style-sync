import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  Headers,
  UnauthorizedException,
  Param,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiOkResponse,
  ApiCreatedResponse,
  ApiHeader,
  ApiParam,
  ApiBadRequestResponse,
  ApiConflictResponse,
} from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { AuthResponseDto } from './dto/auth-response.dto';
import { Public } from '../common/decorators/public.decorator';

@ApiTags('Authentication')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @ApiOperation({ summary: 'User login' })
  @ApiOkResponse({ type: AuthResponseDto })
  @HttpCode(HttpStatus.OK)
  @Public()
  @Post('login')
  async login(@Body() dto: LoginDto): Promise<AuthResponseDto> {
    return this.authService.login(dto.email, dto.password);
  }

  @ApiOperation({ summary: 'Refresh access token' })
  @ApiOkResponse({ type: AuthResponseDto })
  @ApiHeader({
    name: 'Authorization',
    description: 'Bearer refresh_token',
    required: true,
    example: 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
  })
  @HttpCode(HttpStatus.OK)
  @Post('refresh')
  async refresh(
    @Headers('authorization') authHeader: string,
  ): Promise<AuthResponseDto> {
    const refreshToken = authHeader?.replace('Bearer ', '');
    if (!refreshToken) {
      throw new UnauthorizedException(
        'Refresh token required in Authorization header',
      );
    }
    return this.authService.refresh(refreshToken);
  }
}

@ApiTags('Authentication')
@Controller('salon/:customerSlug/auth')
export class CustomerAuthController {
  constructor(private readonly authService: AuthService) {}

  @ApiOperation({
    summary: 'Customer-scoped user registration',
    description:
      'Register a new user or link an existing user to a customer. If the user already exists with the provided email, they will be linked to this customer and their profile data (name, phone) will be updated.',
  })
  @ApiParam({
    name: 'customerSlug',
    description: 'Customer URL slug (e.g., "acme", "elite-cuts")',
    example: 'acme',
  })
  @ApiCreatedResponse({
    type: AuthResponseDto,
    description: 'User registered successfully and linked to customer',
  })
  @ApiBadRequestResponse({
    description: 'Customer not found or inactive',
    schema: {
      type: 'object',
      properties: {
        status: { type: 'number', example: 400 },
        message: {
          type: 'string',
          example: 'Customer not found or inactive',
        },
      },
    },
  })
  @ApiConflictResponse({
    description: 'User already registered with this customer',
    schema: {
      type: 'object',
      properties: {
        status: { type: 'number', example: 409 },
        message: {
          type: 'string',
          example: 'Already registered with this customer',
        },
      },
    },
  })
  @HttpCode(HttpStatus.CREATED)
  @Public()
  @Post('register')
  async registerWithCustomer(
    @Param('customerSlug') customerSlug: string,
    @Body() dto: RegisterDto,
  ): Promise<AuthResponseDto> {
    return this.authService.registerWithCustomer(dto, customerSlug);
  }
}
