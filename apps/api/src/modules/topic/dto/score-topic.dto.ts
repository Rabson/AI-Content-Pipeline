import { IsNumber, IsOptional, IsString, Max, MaxLength, Min } from 'class-validator';

export class ScoreTopicDto {
  @IsNumber()
  @Min(0)
  @Max(10)
  novelty!: number;

  @IsNumber()
  @Min(0)
  @Max(10)
  businessValue!: number;

  @IsNumber()
  @Min(0)
  @Max(10)
  effort!: number;

  @IsNumber()
  @Min(0)
  @Max(10)
  audienceFit!: number;

  @IsNumber()
  @Min(0)
  @Max(10)
  timeRelevance!: number;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  notes?: string;
}
