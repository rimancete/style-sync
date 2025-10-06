import { ApiProperty } from '@nestjs/swagger';

export class UploadProfessionalPhotoDto {
  @ApiProperty({
    description: 'Professional photo file',
    type: 'string',
    format: 'binary',
  })
  photo: Express.Multer.File;
}
