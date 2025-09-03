import { ApiProperty } from '@nestjs/swagger';
import { AuthResponseData } from '../../common/interfaces/api-response.interface';

export class AuthResponseDto implements AuthResponseData {
  @ApiProperty()
  token!: string;

  @ApiProperty()
  user_name!: string;

  @ApiProperty()
  user_id!: string;

  @ApiProperty()
  refresh_token!: string;

  @ApiProperty({ nullable: true })
  phone!: string | null;
}
