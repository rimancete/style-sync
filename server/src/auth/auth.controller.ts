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
  ApiResponse,
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
      'Register a new user or link an existing user to a customer. This uses a two-step flow for existing users: ' +
      '1) First attempt returns 428 if user exists, prompting confirmation. ' +
      '2) Second attempt with confirmLink=true links the user and updates their profile data (name, phone).',
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
  @ApiResponse({
    status: 428,
    description:
      'User already exists - confirmation required to link account (send confirmLink=true to proceed)',
    schema: {
      type: 'object',
      properties: {
        status: { type: 'number', example: 428 },
        message: {
          type: 'string',
          example:
            'User already exists. Please confirm to link this account to the customer.',
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
