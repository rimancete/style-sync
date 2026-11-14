import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  BadRequestException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { User, UserRole } from '@prisma/client';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { DatabaseService } from '../database/database.service';
import { RegisterDto } from './dto/register.dto';
import {
  AuthResponseData,
  CustomerSummary,
} from '../common/interfaces/api-response.interface';
import { PreconditionRequiredException } from '../common/exceptions/precondition-required.exception';
import { resolveFileUrl } from '../common/config/multer.config';

export const CLIENT_NEUTRAL_LOGIN_MESSAGE =
  'Clients must sign in through their salon link';
export const SALON_LOGIN_ROLE_MESSAGE =
  'Only clients can sign in through a salon link';
export const SALON_LOGIN_NOT_LINKED_MESSAGE =
  'This account is not registered with this salon';

@Injectable()
export class AuthService {
  constructor(
    private readonly db: DatabaseService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  /**
   * Register a new user or link existing user to a customer
   * @param registerDto - User registration data
   * @param customerSlug - Customer URL slug
   * @returns Authentication response with tokens and customer data
   */
  async registerWithCustomer(
    registerDto: RegisterDto,
    customerSlug: string,
  ): Promise<AuthResponseData> {
    // Validate customer exists and is active
    const customer = await this.db.customer.findUnique({
      where: { urlSlug: customerSlug },
    });

    if (!customer?.isActive) {
      throw new BadRequestException('Customer not found or inactive');
    }

    // Check if user already exists
    const existingUser = await this.db.user.findUnique({
      where: { email: registerDto.email },
    });

    let user: {
      id: string;
      email: string;
      name: string;
      phone: string | null;
      role: string;
    };

    if (existingUser) {
      // User exists - check if already linked to this customer
      const existingLink = await this.db.userCustomer.findUnique({
        where: {
          userId_customerId: {
            userId: existingUser.id,
            customerId: customer.id,
          },
        },
      });

      if (existingLink) {
        throw new ConflictException('Already registered with this customer');
      }

      // Two-step registration flow: require confirmation to link existing user
      if (!registerDto.confirmLink) {
        throw new PreconditionRequiredException(
          'User already exists. Please confirm to link this account to the customer.',
        );
      }

      // Update user data (name and phone) and link to customer
      user = await this.db.user.update({
        where: { id: existingUser.id },
        data: {
          name: registerDto.name,
          phone: registerDto.phone,
        },
      });

      // Create UserCustomer link
      await this.db.userCustomer.create({
        data: {
          userId: user.id,
          customerId: customer.id,
        },
      });
    } else {
      // Create new user
      const passwordHash = await bcrypt.hash(registerDto.password, 10);
      user = await this.db.user.create({
        data: {
          email: registerDto.email,
          password: passwordHash,
          name: registerDto.name,
          phone: registerDto.phone,
        },
      });

      // Link to customer
      await this.db.userCustomer.create({
        data: {
          userId: user.id,
          customerId: customer.id,
        },
      });
    }

    // Load all user's customer associations
    const userCustomers = await this.getUserCustomers(user.id);
    const customerIds = userCustomers.map(c => c.id);
    const defaultCustomerId = customer.id; // Use the registration customer as default

    const tokens = this.generateTokens(
      user.id,
      user.email,
      user.role,
      customerIds,
      defaultCustomerId,
    );

    return {
      token: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      userId: user.id,
      userName: user.name,
      phone: user.phone,
      customers: userCustomers,
      defaultCustomerId,
    };
  }

  async validateUser(email: string, password: string) {
    const user = await this.db.user.findUnique({ where: { email } });
    if (!user) return null;
    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) return null;
    return user;
  }

  /**
   * Neutral login for ADMIN and STAFF. CLIENT accounts must use the salon login.
   * @throws UnauthorizedException when the credentials are invalid
   * @throws ForbiddenException when the user is a CLIENT
   */
  async login(email: string, password: string): Promise<AuthResponseData> {
    const user = await this.validateUser(email, password);
    if (!user) throw new UnauthorizedException('Invalid credentials');

    if (user.role === UserRole.CLIENT) {
      throw new ForbiddenException(CLIENT_NEUTRAL_LOGIN_MESSAGE);
    }

    const userCustomers = await this.getUserCustomers(user.id);
    return this.buildAuthResponse(user, userCustomers, userCustomers[0]?.id);
  }

  /**
   * Salon-scoped login. Only a CLIENT linked to the salon can sign in, and
   * that salon becomes the default customer of the session.
   * @param customerSlug - Salon URL slug
   * @throws NotFoundException when the salon does not exist or is inactive
   * @throws UnauthorizedException when the credentials are invalid
   * @throws ForbiddenException when the user is not a CLIENT or is not linked to the salon
   */
  async loginWithCustomer(
    email: string,
    password: string,
    customerSlug: string,
  ): Promise<AuthResponseData> {
    const customer = await this.db.customer.findUnique({
      where: { urlSlug: customerSlug },
    });
    if (!customer?.isActive) {
      throw new NotFoundException('Customer not found or inactive');
    }

    const user = await this.validateUser(email, password);
    if (!user) throw new UnauthorizedException('Invalid credentials');

    if (user.role !== UserRole.CLIENT) {
      throw new ForbiddenException(SALON_LOGIN_ROLE_MESSAGE);
    }

    const userCustomers = await this.getUserCustomers(user.id);
    if (!userCustomers.some(c => c.id === customer.id)) {
      throw new ForbiddenException(SALON_LOGIN_NOT_LINKED_MESSAGE);
    }

    return this.buildAuthResponse(user, userCustomers, customer.id);
  }

  private buildAuthResponse(
    user: Pick<User, 'id' | 'email' | 'role' | 'name' | 'phone'>,
    userCustomers: CustomerSummary[],
    defaultCustomerId: string | undefined,
  ): AuthResponseData {
    const tokens = this.generateTokens(
      user.id,
      user.email,
      user.role,
      userCustomers.map(c => c.id),
      defaultCustomerId,
    );
    return {
      token: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      userId: user.id,
      userName: user.name,
      phone: user.phone,
      customers: userCustomers,
      defaultCustomerId,
    };
  }

  async refresh(refreshToken: string): Promise<AuthResponseData> {
    try {
      const payload = await this.jwtService.verifyAsync<{
        sub: string;
        email: string;
        role: string;
        customerIds?: string[];
        defaultCustomerId?: string;
      }>(refreshToken, {
        secret: this.configService.getOrThrow<string>('jwt.refreshSecret'),
      });

      // Get fresh user data
      const user = await this.db.user.findUnique({
        where: { id: payload.sub },
      });

      if (!user) throw new UnauthorizedException('User not found');

      // Load fresh customer associations
      const userCustomers = await this.getUserCustomers(user.id);
      const customerIds = userCustomers.map(c => c.id);
      const defaultCustomerId = customerIds[0] || undefined;

      const tokens = this.generateTokens(
        user.id,
        user.email,
        user.role,
        customerIds,
        defaultCustomerId,
      );
      return {
        token: tokens.accessToken,
        refreshToken: tokens.refreshToken,
        userId: user.id,
        userName: user.name,
        phone: user.phone,
        customers: userCustomers,
        defaultCustomerId,
      };
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        throw error; // Re-throw our custom unauthorized errors
      }
      throw new UnauthorizedException('Invalid refresh token');
    }
  }

  private generateTokens(
    userId: string,
    email: string,
    role: string,
    customerIds: string[] = [],
    defaultCustomerId?: string,
  ) {
    const payload = {
      sub: userId,
      email,
      role,
      customerIds,
      defaultCustomerId,
    };

    // @ts-expect-error - JWT options type mismatch between @nestjs/jwt and underlying library
    const accessToken = this.jwtService.sign(payload, {
      secret: this.configService.getOrThrow<string>('jwt.secret'),
      expiresIn: this.configService.getOrThrow<string>('jwt.expiresIn'),
    });

    // @ts-expect-error - JWT options type mismatch between @nestjs/jwt and underlying library
    const refreshToken = this.jwtService.sign(payload, {
      secret: this.configService.getOrThrow<string>('jwt.refreshSecret'),
      expiresIn: this.configService.getOrThrow<string>('jwt.refreshExpiresIn'),
    });

    return { accessToken, refreshToken };
  }

  /**
   * Get user's customer associations
   */
  private async getUserCustomers(userId: string): Promise<CustomerSummary[]> {
    const userCustomers = await this.db.userCustomer.findMany({
      where: { userId },
      include: {
        customer: {
          select: {
            id: true,
            displayId: true,
            name: true,
            urlSlug: true,
            logoUrl: true,
            isActive: true,
          },
        },
      },
    });

    return userCustomers
      .filter(uc => uc.customer.isActive)
      .map(uc => ({
        id: uc.customer.id,
        displayId: uc.customer.displayId,
        name: uc.customer.name,
        urlSlug: uc.customer.urlSlug,
        logoUrl: uc.customer.logoUrl
          ? resolveFileUrl(uc.customer.logoUrl, uc.customer.id)
          : undefined,
      }));
  }
}
