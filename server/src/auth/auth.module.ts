import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule } from '@nestjs/config';
import { AuthController, CustomerAuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { DatabaseModule } from '../database/database.module';
import { JwtStrategy } from './strategies/jwt.strategy';

@Module({
  imports: [ConfigModule, DatabaseModule, JwtModule.register({})],
  controllers: [AuthController, CustomerAuthController],
  providers: [AuthService, JwtStrategy],
  exports: [],
})
export class AuthModule {}
