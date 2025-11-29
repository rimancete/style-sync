import { Module } from '@nestjs/common';
import { SchedulesService } from './schedules.service';
import { DatabaseModule } from '../database/database.module';

@Module({
  imports: [DatabaseModule],
  providers: [SchedulesService],
  exports: [SchedulesService],
})
export class SchedulesModule {}
