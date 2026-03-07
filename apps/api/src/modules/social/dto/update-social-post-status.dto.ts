import { SocialPostStatus } from '@prisma/client';
import { IsEnum, IsOptional, IsString, MaxLength } from 'class-validator';

export class UpdateSocialPostStatusDto {
  @IsEnum(SocialPostStatus)
  status!: SocialPostStatus;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  externalUrl?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  note?: string;
}
