import { IsEnum, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';
import { SourceType } from '@prisma/client';

export class AddSourceDto {
  @IsString()
  @MinLength(8)
  @MaxLength(2048)
  url!: string;

  @IsOptional()
  @IsString()
  @MaxLength(300)
  title?: string;

  @IsOptional()
  @IsEnum(SourceType)
  sourceType?: SourceType;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  excerpt?: string;
}
