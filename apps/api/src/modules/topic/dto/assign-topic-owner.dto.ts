import { IsString, MaxLength } from 'class-validator';

export class AssignTopicOwnerDto {
  @IsString()
  @MaxLength(120)
  ownerUserId!: string;
}
