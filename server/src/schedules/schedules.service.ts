import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { BranchSchedule, ProfessionalSchedule } from '@prisma/client';

@Injectable()
export class SchedulesService {
  constructor(private readonly db: DatabaseService) {}

  async getBranchSchedule(branchId: string): Promise<BranchSchedule[]> {
    return this.db.branchSchedule.findMany({
      where: { branchId },
    });
  }

  async getProfessionalSchedule(
    professionalId: string,
  ): Promise<ProfessionalSchedule[]> {
    return this.db.professionalSchedule.findMany({
      where: { professionalId },
    });
  }

  async getBranchScheduleForDay(
    branchId: string,
    dayOfWeek: number,
  ): Promise<BranchSchedule | null> {
    return this.db.branchSchedule.findUnique({
      where: {
        branchId_dayOfWeek: {
          branchId,
          dayOfWeek,
        },
      },
    });
  }

  async getProfessionalScheduleForDay(
    professionalId: string,
    dayOfWeek: number,
  ): Promise<ProfessionalSchedule | null> {
    return this.db.professionalSchedule.findUnique({
      where: {
        professionalId_dayOfWeek: {
          professionalId,
          dayOfWeek,
        },
      },
    });
  }
}
