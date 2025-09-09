import { Module } from '@nestjs/common';
import { TenantsService } from './tenants.service';
import { TenantsController } from './tenants.controller';
import { DatabaseModule } from '../database/database.module';
import { CountriesModule } from '../countries/countries.module';

@Module({
  imports: [DatabaseModule, CountriesModule],
  controllers: [TenantsController],
  providers: [TenantsService],
  exports: [TenantsService],
})
export class TenantsModule {}
