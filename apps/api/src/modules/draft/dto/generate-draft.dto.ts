import { IsOptional, IsString, MaxLength } from 'class-validator';

export class GenerateDraftDto {
  @IsOptional()
  @IsString()
  @MaxLength(80)
  styleProfile?: string;

  @IsOptional()
  @IsString()
  @MaxLength(64)
  traceId?: string;
}
