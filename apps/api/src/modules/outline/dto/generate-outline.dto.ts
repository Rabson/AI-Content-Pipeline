import { IsOptional, IsString, MaxLength } from 'class-validator';

export class GenerateOutlineDto {
  @IsOptional()
  @IsString()
  @MaxLength(64)
  traceId?: string;
}
