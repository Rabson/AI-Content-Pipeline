import { ReviewCommentSeverity } from '@prisma/client';
import { IsEnum, IsString, MaxLength, MinLength } from 'class-validator';

export class CreateReviewCommentDto {
  @IsString()
  @MinLength(2)
  @MaxLength(120)
  sectionKey!: string;

  @IsString()
  @MinLength(3)
  @MaxLength(3000)
  commentMd!: string;

  @IsEnum(ReviewCommentSeverity)
  severity!: ReviewCommentSeverity;
}
