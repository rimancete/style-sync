import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
  BadRequestException,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
  ApiParam,
} from '@nestjs/swagger';
import { BookingsService } from './bookings.service';
import { CreateBookingDto } from './dto/create-booking.dto';
import { CreateCustomerBookingDto } from './dto/create-customer-booking.dto';
import { UpdateBookingDto } from './dto/update-booking.dto';
import { AvailabilityQueryDto } from './dto/availability-query.dto';
import { BookingResponseDto } from './dto/booking-response.dto';
import { BookingsListResponseDto } from './dto/bookings-list-response.dto';
import { AvailabilityResponseDto } from './dto/availability-response.dto';
import { ConfirmBookingDto } from './dto/confirm-booking.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { CustomerContextGuard } from '../common/guards/customer-context.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { User } from '../common/decorators/user.decorator';
import { Public } from '../common/decorators/public.decorator';
import { AuthenticatedUser } from '../common/types/auth.types';
import { BookingStatus } from '@prisma/client';

@ApiTags('Bookings')
@Controller()
export class BookingsController {
  constructor(private readonly bookingsService: BookingsService) {}

  // ==================== ADMIN ENDPOINTS (Global) ====================

  @Get('bookings')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'List all bookings (Admin)',
    description:
      'Retrieve all bookings across all customers (admin-only operation)',
  })
  @ApiQuery({
    name: 'page',
    required: false,
    example: 1,
    description: 'Page number',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    example: 500,
    description: 'Items per page',
  })
  @ApiQuery({
    name: 'status',
    required: false,
    enum: BookingStatus,
    description: 'Filter by booking status',
  })
  @ApiResponse({
    status: 200,
    description: 'Bookings retrieved successfully',
    type: BookingsListResponseDto,
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Admin role required' })
  async findAllAdmin(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('status') status?: BookingStatus,
  ): Promise<BookingsListResponseDto> {
    const pageNum = page ? parseInt(page, 10) : 1;
    const limitNum = limit ? parseInt(limit, 10) : 500;

    return this.bookingsService.findAll(pageNum, limitNum, status);
  }

  @Post('bookings')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Create booking (Admin)',
    description: 'Create a new booking for any customer (admin-only operation)',
  })
  @ApiResponse({
    status: 201,
    description: 'Booking created successfully',
    type: BookingResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Bad Request - Invalid input' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Admin role required' })
  @ApiResponse({ status: 404, description: 'Entity not found' })
  @ApiResponse({
    status: 409,
    description: 'Conflict - Professional not available at requested time',
  })
  @ApiResponse({ status: 422, description: 'Validation error' })
  async createAdmin(
    @Body() createBookingDto: CreateBookingDto,
  ): Promise<BookingResponseDto> {
    return this.bookingsService.create(createBookingDto);
  }

  @Get('bookings/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Get booking by ID (Admin)',
    description: 'Retrieve a single booking by ID (admin-only operation)',
  })
  @ApiParam({
    name: 'id',
    description: 'Booking ID (CUID)',
    example: 'clg2a5d9i0002gtkb',
  })
  @ApiResponse({
    status: 200,
    description: 'Booking retrieved successfully',
    type: BookingResponseDto,
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Admin role required' })
  @ApiResponse({ status: 404, description: 'Booking not found' })
  async findOneAdmin(@Param('id') id: string): Promise<BookingResponseDto> {
    return this.bookingsService.findOne(id);
  }

  @Patch('bookings/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Update booking (Admin)',
    description: 'Update booking details (admin-only operation)',
  })
  @ApiParam({
    name: 'id',
    description: 'Booking ID (CUID)',
    example: 'clg2a5d9i0002gtkb',
  })
  @ApiResponse({
    status: 200,
    description: 'Booking updated successfully',
    type: BookingResponseDto,
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Admin role required' })
  @ApiResponse({ status: 404, description: 'Booking not found' })
  @ApiResponse({
    status: 409,
    description: 'Conflict - Professional not available at new time',
  })
  @ApiResponse({ status: 422, description: 'Validation error' })
  async updateAdmin(
    @Param('id') id: string,
    @Body() updateBookingDto: UpdateBookingDto,
  ): Promise<BookingResponseDto> {
    return this.bookingsService.update(id, updateBookingDto);
  }

  @Delete('bookings/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @ApiBearerAuth('JWT-auth')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Cancel booking (Admin)',
    description: 'Cancel a booking by setting status to CANCELLED',
  })
  @ApiParam({
    name: 'id',
    description: 'Booking ID (CUID)',
    example: 'clg2a5d9i0002gtkb',
  })
  @ApiResponse({ status: 204, description: 'Booking cancelled successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Admin role required' })
  @ApiResponse({ status: 404, description: 'Booking not found' })
  async removeAdmin(@Param('id') id: string): Promise<void> {
    return this.bookingsService.cancel(id);
  }

  // ==================== CUSTOMER-SCOPED ENDPOINTS ====================

  @Get('salon/:customerSlug/bookings')
  @UseGuards(JwtAuthGuard, CustomerContextGuard, RolesGuard)
  @Roles('ADMIN')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'List customer bookings',
    description: 'Retrieve all bookings for a specific customer (admin)',
  })
  @ApiParam({
    name: 'customerSlug',
    description: 'Customer URL slug',
    example: 'acme',
  })
  @ApiQuery({
    name: 'page',
    required: false,
    example: 1,
    description: 'Page number',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    example: 500,
    description: 'Items per page',
  })
  @ApiQuery({
    name: 'status',
    required: false,
    enum: BookingStatus,
    description: 'Filter by booking status',
  })
  @ApiResponse({
    status: 200,
    description: 'Bookings retrieved successfully',
    type: BookingsListResponseDto,
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Access denied to customer',
  })
  @ApiResponse({ status: 404, description: 'Customer not found' })
  async findByCustomer(
    @User() user: AuthenticatedUser,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('status') status?: BookingStatus,
  ): Promise<BookingsListResponseDto> {
    const pageNum = page ? parseInt(page, 10) : 1;
    const limitNum = limit ? parseInt(limit, 10) : 500;

    if (!user.activeCustomerId) {
      throw new Error('Customer context is required');
    }

    return this.bookingsService.findByCustomer(
      user.activeCustomerId,
      pageNum,
      limitNum,
      status,
    );
  }

  @Post('salon/:customerSlug/bookings')
  @UseGuards(JwtAuthGuard, CustomerContextGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Create customer booking',
    description:
      'Create a new booking for the current customer (auto-assigns professional if not specified)',
  })
  @ApiParam({
    name: 'customerSlug',
    description: 'Customer URL slug',
    example: 'acme',
  })
  @ApiResponse({
    status: 201,
    description: 'Booking created successfully',
    type: BookingResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Bad Request - Invalid input' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Access denied to customer',
  })
  @ApiResponse({ status: 404, description: 'Entity not found' })
  @ApiResponse({
    status: 409,
    description: 'Conflict - No professionals available at requested time',
  })
  @ApiResponse({ status: 422, description: 'Validation error' })
  async createForCustomer(
    @User() user: AuthenticatedUser,
    @Body() createCustomerBookingDto: CreateCustomerBookingDto,
  ): Promise<BookingResponseDto> {
    if (!user.activeCustomerId || !user.userId) {
      throw new Error('Customer context and user ID are required');
    }

    return this.bookingsService.createForCustomer(
      createCustomerBookingDto,
      user.userId,
      user.activeCustomerId,
    );
  }

  @Get('salon/:customerSlug/bookings/my')
  @UseGuards(JwtAuthGuard, CustomerContextGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Get my bookings',
    description: "Retrieve the current user's bookings for this customer",
  })
  @ApiParam({
    name: 'customerSlug',
    description: 'Customer URL slug',
    example: 'acme',
  })
  @ApiQuery({
    name: 'page',
    required: false,
    example: 1,
    description: 'Page number',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    example: 500,
    description: 'Items per page',
  })
  @ApiResponse({
    status: 200,
    description: 'User bookings retrieved successfully',
    type: BookingsListResponseDto,
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Access denied to customer',
  })
  async findMyBookings(
    @User() user: AuthenticatedUser,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ): Promise<BookingsListResponseDto> {
    const pageNum = page ? parseInt(page, 10) : 1;
    const limitNum = limit ? parseInt(limit, 10) : 500;

    if (!user.userId || !user.activeCustomerId) {
      throw new Error('User and customer context are required');
    }

    return this.bookingsService.findByUser(
      user.userId,
      user.activeCustomerId,
      pageNum,
      limitNum,
    );
  }

  @Get('salon/:customerSlug/bookings/:id')
  @UseGuards(JwtAuthGuard, CustomerContextGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Get customer booking by ID',
    description: 'Retrieve a single booking for the current customer',
  })
  @ApiParam({
    name: 'customerSlug',
    description: 'Customer URL slug',
    example: 'acme',
  })
  @ApiParam({
    name: 'id',
    description: 'Booking ID (CUID)',
    example: 'clg2a5d9i0002gtkb',
  })
  @ApiResponse({
    status: 200,
    description: 'Booking retrieved successfully',
    type: BookingResponseDto,
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Access denied to customer',
  })
  @ApiResponse({
    status: 404,
    description: 'Booking not found or does not belong to customer',
  })
  async findOneForCustomer(
    @User() user: AuthenticatedUser,
    @Param('id') id: string,
  ): Promise<BookingResponseDto> {
    return this.bookingsService.findOne(id, user.activeCustomerId);
  }

  @Patch('salon/:customerSlug/bookings/:id')
  @UseGuards(JwtAuthGuard, CustomerContextGuard, RolesGuard)
  @Roles('ADMIN', 'STAFF', 'CLIENT')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Update customer booking',
    description:
      'Update booking details for the current customer. Clients can only update their own bookings and cannot change status.',
  })
  @ApiParam({
    name: 'customerSlug',
    description: 'Customer URL slug',
    example: 'acme',
  })
  @ApiParam({
    name: 'id',
    description: 'Booking ID (CUID)',
    example: 'clg2a5d9i0002gtkb',
  })
  @ApiResponse({
    status: 200,
    description: 'Booking updated successfully',
    type: BookingResponseDto,
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Admin role required or access denied to customer',
  })
  @ApiResponse({
    status: 404,
    description: 'Booking not found or does not belong to customer',
  })
  @ApiResponse({
    status: 409,
    description: 'Conflict - Professional not available at new time',
  })
  @ApiResponse({ status: 422, description: 'Validation error' })
  async updateForCustomer(
    @User() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() updateBookingDto: UpdateBookingDto,
  ): Promise<BookingResponseDto> {
    if (!user.activeCustomerId) {
      throw new BadRequestException('Customer context is required');
    }

    // Type guard ensures activeCustomerId is defined
    const customerId: string = user.activeCustomerId;

    const result: BookingResponseDto =
      await this.bookingsService.updateForCustomer(
        id,
        updateBookingDto,
        customerId,
        user.userId,
        user.role,
      );

    return result;
  }

  @Delete('salon/:customerSlug/bookings/:id')
  @UseGuards(JwtAuthGuard, CustomerContextGuard)
  @ApiBearerAuth('JWT-auth')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Cancel customer booking',
    description:
      'Cancel a booking for the current customer (sets status to CANCELLED)',
  })
  @ApiParam({
    name: 'customerSlug',
    description: 'Customer URL slug',
    example: 'acme',
  })
  @ApiParam({
    name: 'id',
    description: 'Booking ID (CUID)',
    example: 'clg2a5d9i0002gtkb',
  })
  @ApiResponse({ status: 204, description: 'Booking cancelled successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Access denied to customer',
  })
  @ApiResponse({
    status: 404,
    description: 'Booking not found or does not belong to customer',
  })
  async removeForCustomer(
    @User() user: AuthenticatedUser,
    @Param('id') id: string,
  ): Promise<void> {
    return this.bookingsService.cancel(id, user.activeCustomerId);
  }

  @Get('salon/:customerSlug/availability')
  @Public()
  @ApiOperation({
    summary: 'Check availability (Public)',
    description:
      'Get available time slots for a service at a branch on a specific date. No authentication required - allows anonymous users to browse availability before booking.',
  })
  @ApiParam({
    name: 'customerSlug',
    description: 'Customer URL slug',
    example: 'acme',
  })
  @ApiQuery({
    name: 'branchId',
    required: true,
    description: 'Branch ID',
    example: 'clg2a5d9i0002gtkb',
  })
  @ApiQuery({
    name: 'serviceId',
    required: true,
    description: 'Service ID',
    example: 'clg2a5d9i0003gtkb',
  })
  @ApiQuery({
    name: 'date',
    required: true,
    description: 'Date in YYYY-MM-DD format',
    example: '2025-11-20',
  })
  @ApiQuery({
    name: 'professionalId',
    required: false,
    description:
      'Professional ID (optional, if omitted shows aggregated availability)',
    example: 'clg2a5d9i0004gtkb',
  })
  @ApiResponse({
    status: 200,
    description: 'Availability retrieved successfully',
    type: AvailabilityResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Bad Request - Invalid date format or mismatched entities',
  })
  @ApiResponse({ status: 404, description: 'Branch or service not found' })
  @ApiResponse({ status: 422, description: 'Validation error' })
  async checkAvailability(
    @Param('customerSlug') customerSlug: string,
    @Query() query: AvailabilityQueryDto,
  ): Promise<AvailabilityResponseDto> {
    // Note: customerSlug is in URL for consistency but not used in logic
    // Service validates branch/service belong to same customer internally
    return this.bookingsService.checkAvailability(query);
  }
  @Get('salon/:customerSlug/bookings/token/:token')
  @Public()
  @ApiOperation({
    summary: 'Get booking by token (Public)',
    description:
      'Retrieve booking details using a confirmation token. Used for the confirmation page.',
  })
  @ApiParam({
    name: 'customerSlug',
    description: 'Customer URL slug',
    example: 'acme',
  })
  @ApiParam({
    name: 'token',
    description: 'Confirmation token',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @ApiResponse({
    status: 200,
    description: 'Booking retrieved successfully',
    type: BookingResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Invalid token or booking not found',
  })
  async getBookingByToken(
    @Param('customerSlug') customerSlug: string,
    @Param('token') token: string,
  ): Promise<BookingResponseDto> {
    return this.bookingsService.getBookingByToken(token, customerSlug);
  }

  @Post('salon/:customerSlug/bookings/confirm')
  @HttpCode(HttpStatus.OK)
  @Public()
  @ApiOperation({
    summary: 'Confirm booking (Public)',
    description: 'Confirm a booking using a confirmation token.',
  })
  @ApiParam({
    name: 'customerSlug',
    description: 'Customer URL slug',
    example: 'acme',
  })
  @ApiResponse({
    status: 200,
    description: 'Booking confirmed successfully',
    type: BookingResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Invalid token or booking not found',
  })
  @ApiResponse({
    status: 409,
    description: 'Booking already confirmed/cancelled',
  })
  async confirmBooking(
    @Param('customerSlug') customerSlug: string,
    @Body() confirmBookingDto: ConfirmBookingDto,
  ): Promise<BookingResponseDto> {
    return this.bookingsService.confirmBooking(
      confirmBookingDto.token,
      customerSlug,
    );
  }

  @Delete('salon/:customerSlug/bookings/cancel/:token')
  @HttpCode(HttpStatus.NO_CONTENT)
  @Public()
  @ApiOperation({
    summary: 'Cancel booking via token (Public)',
    description: 'Cancel a booking using a confirmation token.',
  })
  @ApiParam({
    name: 'customerSlug',
    description: 'Customer URL slug',
    example: 'acme',
  })
  @ApiParam({
    name: 'token',
    description: 'Confirmation token',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @ApiResponse({ status: 204, description: 'Booking cancelled successfully' })
  @ApiResponse({
    status: 404,
    description: 'Invalid token or booking not found',
  })
  @ApiResponse({
    status: 409,
    description: 'Booking already confirmed/cancelled',
  })
  async cancelBookingByToken(
    @Param('customerSlug') customerSlug: string,
    @Param('token') token: string,
  ): Promise<void> {
    return this.bookingsService.cancelBookingByToken(token, customerSlug);
  }
}
