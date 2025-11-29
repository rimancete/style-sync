import { Module } from '@nestjs/common';
import { BookingsController } from './bookings.controller';
import { BookingsService } from './bookings.service';
import { DatabaseModule } from '../database/database.module';

import { SchedulesModule } from '../schedules/schedules.module';

@Module({
  imports: [DatabaseModule, SchedulesModule],
  controllers: [BookingsController],
  providers: [BookingsService],
  exports: [BookingsService],
})
export class BookingsModule {}
