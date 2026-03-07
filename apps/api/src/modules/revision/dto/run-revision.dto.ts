import { IsArray, IsOptional, IsString, MaxLength, MinLength, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

class RevisionItemInputDto {
  @IsString()
  @MinLength(2)
  @MaxLength(120)
  sectionKey!: string;

  @IsString()
  @MinLength(3)
  @MaxLength(3000)
  instructionMd!: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  sourceCommentIds?: string[];
}

export class RunRevisionDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => RevisionItemInputDto)
  items!: RevisionItemInputDto[];

  @IsOptional()
  @IsString()
  @MaxLength(64)
  traceId?: string;
}
