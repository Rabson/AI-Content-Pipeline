import { IsOptional, IsString } from 'class-validator';

export class GenerateSeoDto {
  @IsOptional()
  @IsString()
  traceId?: string;
}
