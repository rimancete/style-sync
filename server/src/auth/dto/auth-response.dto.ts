import { ApiProperty } from '@nestjs/swagger';
import {
  AuthResponseData,
  CustomerSummary,
} from '../../common/interfaces/api-response.interface';

export class CustomerSummaryDto implements CustomerSummary {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  name!: string;

  @ApiProperty()
  urlSlug!: string;

  @ApiProperty({ nullable: true })
  logoUrl?: string;
}

export class AuthResponseDto implements AuthResponseData {
  @ApiProperty()
  token!: string;

  @ApiProperty()
  userName!: string;

  @ApiProperty()
  userId!: string;

  @ApiProperty()
  refreshToken!: string;

  @ApiProperty({ nullable: true })
  phone!: string | null;

  @ApiProperty({ type: [CustomerSummaryDto] })
  customers!: CustomerSummary[];

  @ApiProperty({ nullable: true })
  defaultCustomerId?: string;
}
