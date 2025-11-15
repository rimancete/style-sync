import { BookingResponseDto } from '../dto/booking-response.dto';
import {
  Booking,
  User,
  Branch,
  Service,
  Professional,
  Customer,
} from '@prisma/client';

type BookingWithRelations = Booking & {
  user: User;
  customer: Customer;
  branch: Branch;
  service: Service;
  professional?: Professional | null;
};

export class BookingEntity {
  /**
   * Map a Prisma booking result to a response DTO
   * @param booking - Prisma booking with relations
   * @returns BookingResponseDto
   */
  static fromPrisma(booking: BookingWithRelations): BookingResponseDto {
    return {
      id: booking.id,
      displayId: booking.displayId,
      userId: booking.userId,
      userName: booking.user.name,
      customerId: booking.customerId,
      branchId: booking.branchId,
      branchName: booking.branch.name,
      serviceId: booking.serviceId,
      serviceName: booking.service.name,
      professionalId: booking.professionalId,
      professionalName: booking.professional?.name ?? null,
      scheduledAt: booking.scheduledAt,
      status: booking.status,
      totalPrice: booking.totalPrice.toFixed(2),
      currency: booking.customer.currency,
      createdAt: booking.createdAt,
      updatedAt: booking.updatedAt,
    };
  }

  /**
   * Map an array of Prisma booking results to response DTOs
   * @param bookings - Array of Prisma bookings with relations
   * @returns Array of BookingResponseDto
   */
  static fromPrismaList(
    bookings: BookingWithRelations[],
  ): BookingResponseDto[] {
    return bookings.map(booking => BookingEntity.fromPrisma(booking));
  }
}
