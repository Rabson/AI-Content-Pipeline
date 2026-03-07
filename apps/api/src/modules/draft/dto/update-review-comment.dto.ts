import { ReviewCommentStatus } from '@prisma/client';
import { IsEnum, IsOptional, IsString, MaxLength } from 'class-validator';

export class UpdateReviewCommentDto {
  @IsOptional()
  @IsEnum(ReviewCommentStatus)
  status?: ReviewCommentStatus;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  resolutionNote?: string;
}
