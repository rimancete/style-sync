import { Module } from '@nestjs/common';
import {
  ProfessionalsController,
  CustomerProfessionalsController,
  CustomerBranchProfessionalsController,
} from './professionals.controller';
import { ProfessionalsService } from './professionals.service';
import { DatabaseModule } from '../database/database.module';
import { FileService } from '../common/services/file.service';

@Module({
  imports: [DatabaseModule],
  controllers: [
    ProfessionalsController,
    CustomerProfessionalsController,
    CustomerBranchProfessionalsController,
  ],
  providers: [ProfessionalsService, FileService],
  exports: [ProfessionalsService],
})
export class ProfessionalsModule {}
