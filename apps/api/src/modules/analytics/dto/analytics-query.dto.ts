import { Transform } from 'class-transformer';
import { IsInt, IsOptional, Min } from 'class-validator';

export class AnalyticsQueryDto {
  @IsOptional()
  @Transform(({ value }) => Number(value))
  @IsInt()
  @Min(1)
  days = 14;
}
