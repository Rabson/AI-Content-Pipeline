import { IsOptional, IsString, MaxLength } from 'class-validator';

export class UpdateTopicBannerImageDto {
  @IsOptional()
  @IsString()
  @MaxLength(120)
  storageObjectId?: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  alt?: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  caption?: string;
}
