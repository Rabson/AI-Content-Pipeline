import { IsArray, IsOptional, IsString, MaxLength } from 'class-validator';

export class RunResearchDto {
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  sourceUrls?: string[];

  @IsOptional()
  @IsString()
  @MaxLength(64)
  traceId?: string;
}
