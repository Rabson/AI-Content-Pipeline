import { IsString, MaxLength, MinLength } from 'class-validator';

export class UpsertUserPublisherCredentialDto {
  @IsString()
  @MinLength(10)
  @MaxLength(4096)
  token!: string;
}
