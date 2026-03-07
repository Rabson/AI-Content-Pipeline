import {
  ArrayMaxSize,
  IsArray,
  IsBoolean,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';

export class CreateDiscoveryTopicDto {
  @IsString()
  @MinLength(5)
  @MaxLength(180)
  title!: string;

  @IsOptional()
  @IsString()
  @MaxLength(3000)
  brief?: string;

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
  @IsString()
  @MaxLength(1000)
  sourceUrl?: string;

  @IsOptional()
  @IsBoolean()
  autoScore?: boolean = true;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(10)
  minimumScore?: number = 6;
}
