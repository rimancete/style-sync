import { ApiProperty } from '@nestjs/swagger';
import { AuthResponseData } from '../../common/interfaces/api-response.interface';

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
}
