import { IsOptional, IsString } from 'class-validator';

export class GenerateLinkedInDto {
  @IsOptional()
  @IsString()
  traceId?: string;
}
