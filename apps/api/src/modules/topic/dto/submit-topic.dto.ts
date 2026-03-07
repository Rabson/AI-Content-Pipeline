import { IsOptional, IsString, MaxLength } from 'class-validator';

export class SubmitTopicDto {
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  note?: string;
}
