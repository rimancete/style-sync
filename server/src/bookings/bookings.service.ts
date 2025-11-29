import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { CreateBookingDto } from './dto/create-booking.dto';
import { CreateCustomerBookingDto } from './dto/create-customer-booking.dto';
import { UpdateBookingDto } from './dto/update-booking.dto';
import { AvailabilityQueryDto } from './dto/availability-query.dto';
import { BookingResponseDto } from './dto/booking-response.dto';
import { BookingsListResponseDto } from './dto/bookings-list-response.dto';
import {
  AvailabilityResponseDto,
  TimeSlotDto,
} from './dto/availability-response.dto';
import { BookingEntity } from './entities/booking.entity';
import { BookingStatus } from '@prisma/client';
import { SchedulesService } from '../schedules/schedules.service';
import { randomUUID } from 'crypto';

@Injectable()
export class BookingsService {
  // Default operating hours for v1 (09:00-18:00)
  private readonly DEFAULT_START_HOUR = 9;
  private readonly DEFAULT_END_HOUR = 18;
  private readonly SLOT_INTERVAL_MINUTES = 30;

  constructor(
    private readonly db: DatabaseService,
    private readonly schedulesService: SchedulesService,
  ) {}

  /**
   * Find all bookings (admin operation, cross-customer)
   * @param page - Page number (default: 1)
   * @param limit - Items per page (default: 500)
   * @param status - Filter by booking status (optional)
   */
  async findAll(
    page = 1,
    limit = 500,
    status?: BookingStatus,
  ): Promise<BookingsListResponseDto> {
    const skip = (page - 1) * limit;

    const whereClause = status ? { status } : {};

    const [bookings, total] = await Promise.all([
      this.db.booking.findMany({
        where: whereClause,
        skip,
        take: limit,
        orderBy: { scheduledAt: 'desc' },
        include: {
          user: true,
          customer: true,
          branch: true,
          service: true,
          professional: true,
        },
      }),
      this.db.booking.count({ where: whereClause }),
    ]);

    return {
      bookings: BookingEntity.fromPrismaList(bookings),
      total,
      page,
      limit,
    };
  }

  /**
   * Find all bookings for a specific customer
   * @param customerId - Customer ID to filter by
   * @param page - Page number (default: 1)
   * @param limit - Items per page (default: 500)
   * @param status - Filter by booking status (optional)
   */
  async findByCustomer(
    customerId: string,
    page = 1,
    limit = 500,
    status?: BookingStatus,
  ): Promise<BookingsListResponseDto> {
    const skip = (page - 1) * limit;

    const whereClause = status ? { customerId, status } : { customerId };

    const [bookings, total] = await Promise.all([
      this.db.booking.findMany({
        where: whereClause,
        skip,
        take: limit,
        orderBy: { scheduledAt: 'desc' },
        include: {
          user: true,
          customer: true,
          branch: true,
          service: true,
          professional: true,
        },
      }),
      this.db.booking.count({ where: whereClause }),
    ]);

    return {
      bookings: BookingEntity.fromPrismaList(bookings),
      total,
      page,
      limit,
    };
  }

  /**
   * Find all bookings for a specific user
   * @param userId - User ID to filter by
   * @param customerId - Optional customer ID for scoping
   * @param page - Page number (default: 1)
   * @param limit - Items per page (default: 500)
   */
  async findByUser(
    userId: string,
    customerId?: string,
    page = 1,
    limit = 500,
  ): Promise<BookingsListResponseDto> {
    const skip = (page - 1) * limit;

    const whereClause = customerId ? { userId, customerId } : { userId };

    const [bookings, total] = await Promise.all([
      this.db.booking.findMany({
        where: whereClause,
        skip,
        take: limit,
        orderBy: { scheduledAt: 'desc' },
        include: {
          user: true,
          customer: true,
          branch: true,
          service: true,
          professional: true,
        },
      }),
      this.db.booking.count({ where: whereClause }),
    ]);

    return {
      bookings: BookingEntity.fromPrismaList(bookings),
      total,
      page,
      limit,
    };
  }

  /**
   * Find a single booking by ID
   * @param id - Booking ID
   * @param customerId - Optional customer ID for scoping
   */
  async findOne(id: string, customerId?: string): Promise<BookingResponseDto> {
    const whereClause = customerId ? { id, customerId } : { id };

    const booking = await this.db.booking.findFirst({
      where: whereClause,
      include: {
        user: true,
        customer: true,
        branch: true,
        service: true,
        professional: true,
      },
    });

    if (!booking) {
      throw new NotFoundException(`Booking with ID ${id} not found`);
    }

    return BookingEntity.fromPrisma(booking);
  }

  /**
   * Create a new booking (admin operation with userId)
   * @param createBookingDto - Booking creation data
   */
  async create(
    createBookingDto: CreateBookingDto,
  ): Promise<BookingResponseDto> {
    // Validate scheduledAt is in the future
    const scheduledAt = new Date(createBookingDto.scheduledAt);
    if (scheduledAt <= new Date()) {
      throw new BadRequestException('Scheduled time must be in the future');
    }

    // Validate and get all entities
    const { service, professional, customerId } =
      await this.validateBookingEntities(
        createBookingDto.branchId,
        createBookingDto.serviceId,
        createBookingDto.professionalId,
        createBookingDto.userId,
      );

    // If professionalId is null, auto-assign first available
    let assignedProfessionalId = professional?.id ?? null;
    if (!assignedProfessionalId) {
      assignedProfessionalId = await this.findAvailableProfessional(
        createBookingDto.branchId,
        createBookingDto.serviceId,
        scheduledAt,
      );
    } else {
      // Validate no conflict for specified professional
      await this.validateNoConflict(
        assignedProfessionalId,
        scheduledAt,
        service.duration,
      );
    }

    // Calculate price from ServicePricing
    const totalPrice = await this.calculatePrice(
      createBookingDto.serviceId,
      createBookingDto.branchId,
    );

    // Create booking
    const booking = await this.db.booking.create({
      data: {
        userId: createBookingDto.userId,
        customerId,
        branchId: createBookingDto.branchId,
        serviceId: createBookingDto.serviceId,
        professionalId: assignedProfessionalId,
        scheduledAt,
        totalPrice,
        status: BookingStatus.PENDING,
        confirmationToken: randomUUID(),
      },
      include: {
        user: true,
        customer: true,
        branch: true,
        service: true,
        professional: true,
      },
    });

    return BookingEntity.fromPrisma(booking);
  }

  /**
   * Create a new booking for a specific customer (customer-scoped operation)
   * @param createCustomerBookingDto - Booking creation data
   * @param userId - User ID from JWT context
   * @param customerId - Customer ID from URL context
   */
  async createForCustomer(
    createCustomerBookingDto: CreateCustomerBookingDto,
    userId: string,
    customerId: string,
  ): Promise<BookingResponseDto> {
    // Validate scheduledAt is in the future
    const scheduledAt = new Date(createCustomerBookingDto.scheduledAt);
    if (scheduledAt <= new Date()) {
      throw new BadRequestException('Scheduled time must be in the future');
    }

    // Validate and get all entities belong to same customer
    const { service, professional } = await this.validateBookingEntities(
      createCustomerBookingDto.branchId,
      createCustomerBookingDto.serviceId,
      createCustomerBookingDto.professionalId,
      userId,
      customerId,
    );

    // Validate user doesn't have overlapping bookings
    await this.validateUserNoConflict(userId, scheduledAt, service.duration);

    // If professionalId is null, auto-assign first available
    let assignedProfessionalId = professional?.id ?? null;
    if (!assignedProfessionalId) {
      assignedProfessionalId = await this.findAvailableProfessional(
        createCustomerBookingDto.branchId,
        createCustomerBookingDto.serviceId,
        scheduledAt,
      );
    } else {
      // Validate no conflict for specified professional
      await this.validateNoConflict(
        assignedProfessionalId,
        scheduledAt,
        service.duration,
      );
    }

    // Calculate price from ServicePricing
    const totalPrice = await this.calculatePrice(
      createCustomerBookingDto.serviceId,
      createCustomerBookingDto.branchId,
    );

    // Create booking
    const booking = await this.db.booking.create({
      data: {
        userId,
        customerId,
        branchId: createCustomerBookingDto.branchId,
        serviceId: createCustomerBookingDto.serviceId,
        professionalId: assignedProfessionalId,
        scheduledAt,
        totalPrice,
        status: BookingStatus.PENDING,
        confirmationToken: randomUUID(),
      },
      include: {
        user: true,
        customer: true,
        branch: true,
        service: true,
        professional: true,
      },
    });

    return BookingEntity.fromPrisma(booking);
  }

  /**
   * Update a booking
   * @param id - Booking ID
   * @param updateBookingDto - Booking update data
   * @param customerId - Optional customer ID for scoping
   */
  async update(
    id: string,
    updateBookingDto: UpdateBookingDto,
    customerId?: string,
  ): Promise<BookingResponseDto> {
    // Verify booking exists
    const existingBooking = await this.findOne(id, customerId);

    const updateData: Record<string, unknown> = {};

    // Handle status change
    if (updateBookingDto.status) {
      updateData.status = updateBookingDto.status;
    }

    // Handle rescheduling
    if (updateBookingDto.scheduledAt) {
      const newScheduledAt = new Date(updateBookingDto.scheduledAt);

      if (newScheduledAt <= new Date()) {
        throw new BadRequestException('Scheduled time must be in the future');
      }

      // Get service duration for conflict check
      const service = await this.db.service.findUnique({
        where: { id: existingBooking.serviceId },
      });

      if (!service) {
        throw new NotFoundException('Service not found');
      }

      // Validate no conflict at new time
      const professionalId =
        updateBookingDto.professionalId !== undefined
          ? updateBookingDto.professionalId
          : existingBooking.professionalId;

      if (professionalId) {
        await this.validateNoConflict(
          professionalId,
          newScheduledAt,
          service.duration,
          id, // Exclude current booking from conflict check
        );
      }

      updateData.scheduledAt = newScheduledAt;
    }

    // Handle professional change
    if (updateBookingDto.professionalId !== undefined) {
      if (updateBookingDto.professionalId) {
        // Validate professional exists and belongs to correct branch
        const professional = await this.db.professional.findFirst({
          where: {
            id: updateBookingDto.professionalId,
            isActive: true,
            branches: {
              some: {
                branchId: existingBooking.branchId,
              },
            },
          },
        });

        if (!professional) {
          throw new NotFoundException(
            'Professional not found or not available at this branch',
          );
        }
      }
      updateData.professionalId = updateBookingDto.professionalId;
    }

    const whereClause = customerId ? { id, customerId } : { id };

    const booking = await this.db.booking.update({
      where: whereClause,
      data: updateData,
      include: {
        user: true,
        customer: true,
        branch: true,
        service: true,
        professional: true,
      },
    });

    return BookingEntity.fromPrisma(booking);
  }

  /**
   * Update booking for customer-scoped endpoint with role-based restrictions
   * @param id - Booking ID
   * @param updateBookingDto - Update data
   * @param customerId - Customer ID for scoping
   * @param userId - User ID making the request
   * @param userRole - Role of the user (ADMIN, STAFF, CLIENT)
   */
  async updateForCustomer(
    id: string,
    updateBookingDto: UpdateBookingDto,
    customerId: string,
    userId: string,
    userRole: string,
  ): Promise<BookingResponseDto> {
    // Get existing booking to check ownership
    const existingBooking = await this.findOne(id, customerId);

    // If user is CLIENT, enforce restrictions
    if (userRole === 'CLIENT') {
      // Clients can only update their own bookings
      if (existingBooking.userId !== userId) {
        throw new ForbiddenException('You can only update your own bookings');
      }

      // Clients cannot change booking status
      if (updateBookingDto.status) {
        throw new ForbiddenException(
          'Clients cannot change booking status. Contact staff to modify status.',
        );
      }
    }

    // Proceed with normal update
    return this.update(id, updateBookingDto, customerId);
  }

  /**
   * Cancel a booking (soft delete via status change)
   * @param id - Booking ID
   * @param customerId - Optional customer ID for scoping
   */
  async cancel(id: string, customerId?: string): Promise<void> {
    // Verify booking exists
    await this.findOne(id, customerId);

    const whereClause = customerId ? { id, customerId } : { id };

    await this.db.booking.update({
      where: whereClause,
      data: {
        status: BookingStatus.CANCELLED,
      },
    });
  }

  /**
   * Get booking by confirmation token
   */
  async getBookingByToken(
    token: string,
    customerSlug: string,
  ): Promise<BookingResponseDto> {
    const booking = await this.db.booking.findUnique({
      where: { confirmationToken: token },
      include: {
        user: true,
        customer: true,
        branch: true,
        service: true,
        professional: true,
      },
    });

    if (!booking) {
      throw new NotFoundException('Invalid confirmation token');
    }

    if (booking.customer.urlSlug !== customerSlug) {
      throw new NotFoundException('Booking not found for this customer');
    }

    return BookingEntity.fromPrisma(booking);
  }

  /**
   * Confirm booking by token
   */
  async confirmBooking(
    token: string,
    customerSlug: string,
  ): Promise<BookingResponseDto> {
    const booking = await this.db.booking.findUnique({
      where: { confirmationToken: token },
      include: { customer: true, service: true },
    });

    if (!booking) {
      throw new NotFoundException('Invalid confirmation token');
    }

    if (booking.customer.urlSlug !== customerSlug) {
      throw new NotFoundException('Booking not found for this customer');
    }

    if (booking.status !== BookingStatus.PENDING) {
      throw new ConflictException(`Booking is already ${booking.status}`);
    }

    // IMPORTANT: Re-validate availability before confirming to prevent race conditions
    // This ensures that if two bookings were created for the same slot,
    // only the first one to be confirmed will succeed

    // 1. Check professional availability
    if (booking.professionalId) {
      await this.validateNoConflict(
        booking.professionalId,
        booking.scheduledAt,
        booking.service.duration,
        booking.id, // Exclude this booking from conflict check
      );
    }

    // 2. Check user availability (prevent double booking for same user)
    await this.validateUserNoConflict(
      booking.userId,
      booking.scheduledAt,
      booking.service.duration,
      booking.id, // Exclude this booking
    );

    const updatedBooking = await this.db.booking.update({
      where: { id: booking.id },
      data: { status: BookingStatus.CONFIRMED },
      include: {
        user: true,
        customer: true,
        branch: true,
        service: true,
        professional: true,
      },
    });

    return BookingEntity.fromPrisma(updatedBooking);
  }

  /**
   * Cancel booking by token
   */
  async cancelBookingByToken(
    token: string,
    customerSlug: string,
  ): Promise<void> {
    const booking = await this.db.booking.findUnique({
      where: { confirmationToken: token },
      include: { customer: true },
    });

    if (!booking) {
      throw new NotFoundException('Invalid confirmation token');
    }

    if (booking.customer.urlSlug !== customerSlug) {
      throw new NotFoundException('Booking not found for this customer');
    }

    if (
      booking.status !== BookingStatus.PENDING &&
      booking.status !== BookingStatus.CONFIRMED
    ) {
      throw new ConflictException(`Booking is already ${booking.status}`);
    }

    await this.db.booking.update({
      where: { id: booking.id },
      data: { status: BookingStatus.CANCELLED },
    });
  }

  /**
   * Check availability and generate time slots
   * @param query - Availability query parameters
   */
  async checkAvailability(
    query: AvailabilityQueryDto,
  ): Promise<AvailabilityResponseDto> {
    // Validate date format and that it's a valid date
    const datePattern = /^\d{4}-\d{2}-\d{2}$/;
    if (!datePattern.test(query.date)) {
      throw new BadRequestException('Date must be in YYYY-MM-DD format');
    }

    const [year, month, day] = query.date.split('-').map(Number);
    const testDate = new Date(year, month - 1, day);
    if (
      isNaN(testDate.getTime()) ||
      testDate.getFullYear() !== year ||
      testDate.getMonth() !== month - 1 ||
      testDate.getDate() !== day
    ) {
      throw new BadRequestException('Invalid date provided');
    }

    // Validate branch and service
    const branch = await this.db.branch.findUnique({
      where: { id: query.branchId, deletedAt: null },
    });

    if (!branch) {
      throw new NotFoundException(`Branch with ID ${query.branchId} not found`);
    }

    const service = await this.db.service.findUnique({
      where: { id: query.serviceId, isActive: true },
    });

    if (!service) {
      throw new NotFoundException(
        `Service with ID ${query.serviceId} not found`,
      );
    }

    // Validate entities belong to same customer
    if (branch.customerId !== service.customerId) {
      throw new BadRequestException(
        'Branch and service do not belong to the same customer',
      );
    }

    // Generate time slots
    const availableSlots = await this.generateTimeSlots(
      query.branchId,
      query.serviceId,
      query.date,
      service.duration,
      query.professionalId,
    );

    return {
      date: query.date,
      branch: {
        id: branch.id,
        name: branch.name,
      },
      service: {
        id: service.id,
        name: service.name,
        duration: service.duration,
      },
      availableSlots,
    };
  }

  /**
   * HELPER: Generate available time slots for a given date
   *
   * ⚠️ TIMEZONE ASSUMPTION: This implementation assumes the server timezone
   * matches the branch timezone. All times are processed in UTC for consistency.
   *
   * FUTURE ENHANCEMENT: Add explicit timezone support by:
   * 1. Adding timezone field to branches table (e.g., 'America/Sao_Paulo')
   * 2. Using timezone library (date-fns-tz or luxon) for proper conversion
   * 3. Converting UTC times to branch timezone for slot generation
   * 4. Including timezone info in API responses
   *
   * @param branchId - Branch ID
   * @param serviceId - Service ID
   * @param date - Date in YYYY-MM-DD format (interpreted as UTC date)
   * @param duration - Service duration in minutes
   * @param professionalId - Optional professional ID for specific professional
   * @returns Array of time slots
   */
  private async generateTimeSlots(
    branchId: string,
    serviceId: string,
    date: string,
    duration: number,
    professionalId?: string,
  ): Promise<TimeSlotDto[]> {
    const slots: TimeSlotDto[] = [];
    // Parse date string as UTC to match database booking times
    // NOTE: This assumes bookings are created with proper timezone offset
    // e.g., "2025-12-25T11:00:00-03:00" (Brazil time) -> stored as UTC
    const [year, month, day] = date.split('-').map(Number);
    const targetDate = new Date(Date.UTC(year, month - 1, day, 0, 0, 0, 0));
    const dayOfWeek = targetDate.getUTCDay(); // 0-6 (Sunday-Saturday)

    // 1. Get Branch Schedule
    const branchSchedule = await this.schedulesService.getBranchScheduleForDay(
      branchId,
      dayOfWeek,
    );

    // If branch is closed or no schedule defined, return empty
    if (!branchSchedule || branchSchedule.isClosed) {
      return [];
    }

    // Parse branch hours
    const [branchStartHour, branchStartMinute] = branchSchedule.startTime
      .split(':')
      .map(Number);
    const [branchEndHour, branchEndMinute] = branchSchedule.endTime
      .split(':')
      .map(Number);

    const branchStartMinutes = branchStartHour * 60 + branchStartMinute;
    const branchEndMinutes = branchEndHour * 60 + branchEndMinute;

    // 2. Get Professionals
    let professionals: { id: string }[];
    if (professionalId) {
      // Check specific professional
      const prof = await this.db.professional.findFirst({
        where: {
          id: professionalId,
          isActive: true,
          branches: {
            some: {
              branchId,
            },
          },
        },
      });

      if (!prof) {
        throw new NotFoundException(
          'Professional not found or not available at this branch',
        );
      }

      professionals = [{ id: prof.id }];
    } else {
      // Get all active professionals at this branch
      const professionalBranches = await this.db.professionalBranch.findMany({
        where: {
          branchId,
          professional: {
            isActive: true,
          },
        },
        include: {
          professional: true,
        },
      });

      professionals = professionalBranches.map(pb => ({
        id: pb.professional.id,
      }));
    }

    // 3. Get Professional Schedules
    const professionalSchedules = await Promise.all(
      professionals.map(async p => {
        const schedule =
          await this.schedulesService.getProfessionalScheduleForDay(
            p.id,
            dayOfWeek,
          );
        return {
          professionalId: p.id,
          schedule,
        };
      }),
    );

    // 4. Get Existing Bookings (use UTC to match database times)
    const startOfDay = new Date(Date.UTC(year, month - 1, day, 0, 0, 0, 0));
    const endOfDay = new Date(Date.UTC(year, month - 1, day, 23, 59, 59, 999));

    const bookings = await this.db.booking.findMany({
      where: {
        branchId,
        scheduledAt: {
          gte: startOfDay,
          lte: endOfDay,
        },
        status: {
          in: [BookingStatus.PENDING, BookingStatus.CONFIRMED],
        },
        professionalId: {
          in: professionals.map(p => p.id),
        },
      },
      include: {
        service: true,
      },
    });

    // 5. Generate Slots
    // Iterate from branch start to branch end
    for (
      let currentMinutes = branchStartMinutes;
      currentMinutes < branchEndMinutes;
      currentMinutes += this.SLOT_INTERVAL_MINUTES
    ) {
      // Calculate slot time in UTC to match database booking times
      const hour = Math.floor(currentMinutes / 60);
      const minute = currentMinutes % 60;
      const slotTime = new Date(
        Date.UTC(year, month - 1, day, hour, minute, 0, 0),
      );

      // Check if slot + duration exceeds branch closing time
      if (currentMinutes + duration > branchEndMinutes) {
        continue;
      }

      // Format time as HH:mm
      const timeString = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;

      // Check availability for each professional
      let anyAvailable = false;
      let availableProfessionalId: string | undefined;

      for (const p of professionals) {
        const pSchedule = professionalSchedules.find(
          ps => ps.professionalId === p.id,
        )?.schedule;

        // If professional has no schedule or is closed, they are not available
        // If professional has no schedule, we assume they follow branch hours?
        // Let's assume strict: no schedule = not working.
        // Or maybe default to branch hours?
        // For now, let's assume if no schedule record, they are NOT working (safe default).
        // But in seed we created schedules for all.
        if (!pSchedule || pSchedule.isClosed) {
          continue;
        }

        // Check professional hours
        const [pStartH, pStartM] = pSchedule.startTime.split(':').map(Number);
        const [pEndH, pEndM] = pSchedule.endTime.split(':').map(Number);
        const pStartMinutes = pStartH * 60 + pStartM;
        const pEndMinutes = pEndH * 60 + pEndM;

        if (
          currentMinutes < pStartMinutes ||
          currentMinutes + duration > pEndMinutes
        ) {
          continue;
        }

        // Check break
        if (pSchedule.breakStartTime && pSchedule.breakEndTime) {
          const [bStartH, bStartM] = pSchedule.breakStartTime
            .split(':')
            .map(Number);
          const [bEndH, bEndM] = pSchedule.breakEndTime.split(':').map(Number);
          const bStartMinutes = bStartH * 60 + bStartM;
          const bEndMinutes = bEndH * 60 + bEndM;

          // If slot overlaps with break
          // Slot interval: [current, current + duration]
          // Break interval: [bStart, bEnd]
          if (
            currentMinutes < bEndMinutes &&
            currentMinutes + duration > bStartMinutes
          ) {
            continue;
          }
        }

        // Check booking conflicts
        const hasConflict = this.checkTimeSlotConflict(
          p.id,
          slotTime,
          duration,
          bookings,
        );

        if (!hasConflict) {
          anyAvailable = true;
          availableProfessionalId = p.id;
          break; // Found one available professional, that's enough for "any"
        }
      }

      slots.push({
        time: timeString,
        available: anyAvailable,
        professionalId: professionalId || availableProfessionalId,
      });
    }

    return slots;
  }

  /**
   * HELPER: Check if a time slot conflicts with existing bookings
   * @param professionalId - Professional ID
   * @param slotTime - Start time of the slot
   * @param duration - Service duration in minutes
   * @param bookings - Existing bookings to check against
   * @returns True if there is a conflict
   */
  private checkTimeSlotConflict(
    professionalId: string,
    slotTime: Date,
    duration: number,
    bookings: Array<{
      professionalId: string | null;
      scheduledAt: Date;
      service: { duration: number };
    }>,
  ): boolean {
    const slotEnd = new Date(slotTime.getTime() + duration * 60000);

    for (const booking of bookings) {
      if (booking.professionalId !== professionalId) {
        continue;
      }

      const bookingStart = booking.scheduledAt;
      const bookingEnd = new Date(
        bookingStart.getTime() + booking.service.duration * 60000,
      );

      // Check for overlap: slot overlaps if it starts before booking ends and ends after booking starts
      if (slotTime < bookingEnd && slotEnd > bookingStart) {
        return true;
      }
    }

    return false;
  }

  /**
   * HELPER: Find first available professional for a time slot
   * @param branchId - Branch ID
   * @param serviceId - Service ID
   * @param scheduledAt - Scheduled time
   * @returns Professional ID
   */
  async findAvailableProfessional(
    branchId: string,
    serviceId: string,
    scheduledAt: Date,
  ): Promise<string> {
    // Get service to know duration
    const service = await this.db.service.findUnique({
      where: { id: serviceId },
    });

    if (!service) {
      throw new NotFoundException('Service not found');
    }

    // Get all active professionals at this branch
    const professionalBranches = await this.db.professionalBranch.findMany({
      where: {
        branchId,
        professional: {
          isActive: true,
        },
      },
      include: {
        professional: true,
      },
    });

    if (professionalBranches.length === 0) {
      throw new NotFoundException('No professionals available at this branch');
    }

    // Check each professional for conflicts
    for (const pb of professionalBranches) {
      try {
        await this.validateNoConflict(
          pb.professional.id,
          scheduledAt,
          service.duration,
        );
        // If no exception thrown, this professional is available
        return pb.professional.id;
        // No need to handle 'error', just let the loop continue.
        // The 'error' variable was unused, so we can omit it for clarity.
      } catch {
        continue;
      }
    }

    throw new ConflictException(
      'No professionals available at the requested time',
    );
  }

  /**
   * HELPER: Validate no scheduling conflict exists for the USER
   * @param userId - User ID
   * @param scheduledAt - Scheduled time
   * @param duration - Service duration in minutes
   * @param excludeBookingId - Optional booking ID to exclude (for updates)
   */
  private async validateUserNoConflict(
    userId: string,
    scheduledAt: Date,
    duration: number,
    excludeBookingId?: string,
  ): Promise<void> {
    const bookingEnd = new Date(scheduledAt.getTime() + duration * 60000);
    // Look back 24 hours to be safe and avoid scanning entire history
    const searchStart = new Date(scheduledAt.getTime() - 24 * 60 * 60 * 1000);

    // Find overlapping bookings for this USER
    const conflictingBookings = await this.db.booking.findMany({
      where: {
        userId,
        id: excludeBookingId ? { not: excludeBookingId } : undefined,
        status: {
          in: [BookingStatus.PENDING, BookingStatus.CONFIRMED],
        },
        scheduledAt: {
          gte: searchStart,
          lt: bookingEnd,
        },
      },
      include: {
        service: true,
      },
    });

    for (const booking of conflictingBookings) {
      const existingStart = booking.scheduledAt;
      const existingEnd = new Date(
        existingStart.getTime() + booking.service.duration * 60000,
      );

      // Check for overlap
      if (scheduledAt < existingEnd && bookingEnd > existingStart) {
        throw new ConflictException('You already have a booking at this time');
      }
    }
  }

  /**
   * HELPER: Validate all booking entities exist and belong to same customer
   * @param branchId - Branch ID
   * @param serviceId - Service ID
   * @param professionalId - Professional ID (optional)
   * @param userId - User ID
   * @param expectedCustomerId - Expected customer ID (for customer-scoped operations)
   * @returns Validated entities and derived customerId
   */
  private async validateBookingEntities(
    branchId: string,
    serviceId: string,
    professionalId: string | null | undefined,
    userId: string,
    expectedCustomerId?: string,
  ): Promise<{
    branch: { id: string; customerId: string };
    service: { id: string; customerId: string; duration: number };
    professional: { id: string; customerId: string } | null;
    user: { id: string };
    customerId: string;
  }> {
    // Validate branch
    const branch = await this.db.branch.findUnique({
      where: { id: branchId, deletedAt: null },
    });

    if (!branch) {
      throw new NotFoundException(`Branch with ID ${branchId} not found`);
    }

    // Validate service
    const service = await this.db.service.findUnique({
      where: { id: serviceId, isActive: true },
    });

    if (!service) {
      throw new NotFoundException(`Service with ID ${serviceId} not found`);
    }

    // Validate user
    const user = await this.db.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException(`User with ID ${userId} not found`);
    }

    // Check customer consistency early (before checking professional at branch)
    const customerId = branch.customerId;

    if (service.customerId !== customerId) {
      throw new BadRequestException(
        'Service does not belong to the same customer as branch',
      );
    }

    // Validate professional if specified (after customer check)
    let professional: { id: string; customerId: string } | null = null;
    if (professionalId) {
      const prof = await this.db.professional.findFirst({
        where: {
          id: professionalId,
          isActive: true,
        },
      });

      if (!prof) {
        throw new NotFoundException(
          `Professional with ID ${professionalId} not found`,
        );
      }

      // Check if professional belongs to same customer
      if (prof.customerId !== customerId) {
        throw new BadRequestException(
          'Professional does not belong to the same customer as branch',
        );
      }

      // Check if professional is available at the branch
      const professionalAtBranch = await this.db.professionalBranch.findFirst({
        where: {
          professionalId,
          branchId,
        },
      });

      if (!professionalAtBranch) {
        throw new BadRequestException(
          `Professional is not available at this branch`,
        );
      }

      professional = prof;
    }

    // If expected customer ID provided, validate match
    if (expectedCustomerId && customerId !== expectedCustomerId) {
      throw new BadRequestException(
        'Booking entities do not belong to the expected customer',
      );
    }

    return {
      branch,
      service,
      professional,
      user,
      customerId,
    };
  }

  /**
   * HELPER: Validate no scheduling conflict exists
   * @param professionalId - Professional ID
   * @param scheduledAt - Scheduled time
   * @param duration - Service duration in minutes
   * @param excludeBookingId - Optional booking ID to exclude (for updates)
   */
  private async validateNoConflict(
    professionalId: string,
    scheduledAt: Date,
    duration: number,
    excludeBookingId?: string,
  ): Promise<void> {
    const bookingEnd = new Date(scheduledAt.getTime() + duration * 60000);

    // Find overlapping bookings for this professional
    const conflictingBookings = await this.db.booking.findMany({
      where: {
        professionalId,
        id: excludeBookingId ? { not: excludeBookingId } : undefined,
        status: {
          in: [BookingStatus.PENDING, BookingStatus.CONFIRMED],
        },
      },
      include: {
        service: true,
      },
    });

    for (const booking of conflictingBookings) {
      const existingStart = booking.scheduledAt;
      const existingEnd = new Date(
        existingStart.getTime() + booking.service.duration * 60000,
      );

      // Check for overlap
      if (scheduledAt < existingEnd && bookingEnd > existingStart) {
        throw new ConflictException(
          'Professional is not available at the requested time',
        );
      }
    }
  }

  /**
   * HELPER: Calculate booking price from ServicePricing
   * @param serviceId - Service ID
   * @param branchId - Branch ID
   * @returns Price as Decimal
   */
  private async calculatePrice(
    serviceId: string,
    branchId: string,
  ): Promise<number> {
    const pricing = await this.db.servicePricing.findUnique({
      where: {
        serviceId_branchId: {
          serviceId,
          branchId,
        },
      },
    });

    if (!pricing) {
      throw new NotFoundException(
        `Pricing not found for service at this branch`,
      );
    }

    return pricing.price.toNumber();
  }
}
