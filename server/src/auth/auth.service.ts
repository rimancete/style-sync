import {
  Injectable,
  UnauthorizedException,
  ConflictException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { DatabaseService } from '../database/database.service';
import { RegisterDto } from './dto/register.dto';
import { AuthResponseData } from '../common/interfaces/api-response.interface';

@Injectable()
export class AuthService {
  constructor(
    private readonly db: DatabaseService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async register(registerDto: RegisterDto): Promise<AuthResponseData> {
    const existing = await this.db.user.findUnique({
      where: { email: registerDto.email },
    });
    if (existing) {
      throw new ConflictException('Email already registered');
    }

    const passwordHash = await bcrypt.hash(registerDto.password, 10);
    const user = await this.db.user.create({
      data: {
        email: registerDto.email,
        password: passwordHash,
        name: registerDto.name,
        phone: registerDto.phone,
      },
    });

    const tokens = this.generateTokens(user.id, user.email, user.role);
    return {
      token: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      userId: user.id,
      userName: user.name,
      phone: user.phone,
    };
  }

  async validateUser(email: string, password: string) {
    const user = await this.db.user.findUnique({ where: { email } });
    if (!user) return null;
    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) return null;
    return user;
  }

  async login(email: string, password: string): Promise<AuthResponseData> {
    const user = await this.validateUser(email, password);
    if (!user) throw new UnauthorizedException('Invalid credentials');

    const tokens = this.generateTokens(user.id, user.email, user.role);
    return {
      token: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      userId: user.id,
      userName: user.name,
      phone: user.phone,
    };
  }

  async refresh(refreshToken: string): Promise<AuthResponseData> {
    try {
      const payload = await this.jwtService.verifyAsync<{
        sub: string;
        email: string;
        role: string;
      }>(refreshToken, {
        secret: this.configService.getOrThrow<string>('jwt.refreshSecret'),
      });

      // Get fresh user data
      const user = await this.db.user.findUnique({
        where: { id: payload.sub },
      });

      if (!user) throw new UnauthorizedException('User not found');

      const tokens = this.generateTokens(user.id, user.email, user.role);
      return {
        token: tokens.accessToken,
        refreshToken: tokens.refreshToken,
        userId: user.id,
        userName: user.name,
        phone: user.phone,
      };
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        throw error; // Re-throw our custom unauthorized errors
      }
      throw new UnauthorizedException('Invalid refresh token');
    }
  }

  private generateTokens(userId: string, email: string, role: string) {
    const accessToken = this.jwtService.sign(
      { sub: userId, email, role },
      {
        secret: this.configService.getOrThrow<string>('jwt.secret'),
        expiresIn: this.configService.getOrThrow<string>('jwt.expiresIn'),
      },
    );
    const refreshToken = this.jwtService.sign(
      { sub: userId, email, role },
      {
        secret: this.configService.getOrThrow<string>('jwt.refreshSecret'),
        expiresIn: this.configService.getOrThrow<string>(
          'jwt.refreshExpiresIn',
        ),
      },
    );
    return { accessToken, refreshToken };
  }
}
