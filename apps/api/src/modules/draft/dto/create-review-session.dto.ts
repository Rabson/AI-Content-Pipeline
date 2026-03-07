import { IsOptional, IsString, MaxLength } from 'class-validator';

export class CreateReviewSessionDto {
  @IsOptional()
  @IsString()
  @MaxLength(120)
  reviewerId?: string;
}
