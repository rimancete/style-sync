import { Module } from '@nestjs/common';
import { BranchesService } from './branches.service';
import { BranchesController } from './branches.controller';
import { DatabaseModule } from '../database/database.module';
import { CountriesModule } from '../countries/countries.module';

@Module({
  imports: [DatabaseModule, CountriesModule],
  controllers: [BranchesController],
  providers: [BranchesService],
  exports: [BranchesService],
})
export class BranchesModule {}
