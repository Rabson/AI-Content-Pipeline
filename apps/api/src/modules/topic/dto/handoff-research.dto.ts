import { IsOptional, IsString, MaxLength } from 'class-validator';

export class HandoffResearchDto {
  @IsOptional()
  @IsString()
  @MaxLength(64)
  traceId?: string;
}
