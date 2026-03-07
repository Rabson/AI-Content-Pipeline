import { IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

export class UpdateTopicDto {
  @IsOptional()
  @IsString()
  @MinLength(5)
  @MaxLength(180)
  title?: string;

  @IsOptional()
  @IsString()
  @MaxLength(3000)
  brief?: string;

  @IsOptional()
  @IsString()
  @MaxLength(300)
  audience?: string;
}
