import { IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

export class UpsertUserPublisherCredentialDto {
  @IsString()
  @MinLength(10)
  @MaxLength(4096)
  token!: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  mediumAuthorId?: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  mediumPublicationId?: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  linkedinAuthorUrn?: string;
}
