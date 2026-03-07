import { Transform } from 'class-transformer';
import {
  ArrayMaxSize,
  IsArray,
  IsBoolean,
  IsIn,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';
import {
  DEFAULT_DISCOVERY_LIMIT,
  DEFAULT_DISCOVERY_MIN_SCORE,
  DISCOVERY_PROVIDER_HACKER_NEWS,
} from '../constants/discovery.constants';

export class ImportDiscoveryTopicsDto {
  @IsIn([DISCOVERY_PROVIDER_HACKER_NEWS])
  provider!: string;

  @IsOptional()
  @IsString()
  @MaxLength(160)
  query?: string;

  @IsOptional()
  @Transform(({ value }) => Number(value))
  @IsInt()
  @Min(1)
  @Max(20)
  limit: number = DEFAULT_DISCOVERY_LIMIT;

  @IsOptional()
  @IsString()
  @MaxLength(300)
  audience?: string;

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(12)
  @IsString({ each: true })
  tags?: string[];

  @IsOptional()
  @IsBoolean()
  autoScore: boolean = true;

  @IsOptional()
  @Transform(({ value }) => Number(value))
  @IsNumber()
  @Min(0)
  @Max(10)
  minimumScore: number = DEFAULT_DISCOVERY_MIN_SCORE;
}
