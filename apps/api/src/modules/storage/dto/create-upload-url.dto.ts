import { StorageObjectPurpose } from '@prisma/client';
import { IsEnum, IsOptional, IsString, MaxLength } from 'class-validator';

export class CreateUploadUrlDto {
  @IsString()
  @MaxLength(255)
  filename!: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  mimeType?: string;

  @IsOptional()
  @IsEnum(StorageObjectPurpose)
  purpose?: StorageObjectPurpose;
}
