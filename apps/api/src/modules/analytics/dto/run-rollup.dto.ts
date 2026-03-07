import { IsDateString, IsOptional } from 'class-validator';

export class RunRollupDto {
  @IsOptional()
  @IsDateString()
  usageDate?: string;
}
