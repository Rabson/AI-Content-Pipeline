import { PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { Injectable } from '@nestjs/common';
import { randomUUID } from 'crypto';

@Injectable()
export class StorageSigningService {
  private readonly client = new S3Client({
    region: process.env.AWS_REGION ?? 'auto',
    credentials:
      process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY
        ? {
            accessKeyId: process.env.AWS_ACCESS_KEY_ID,
            secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
          }
        : undefined,
    endpoint: process.env.STORAGE_ENDPOINT || undefined,
    forcePathStyle: process.env.STORAGE_FORCE_PATH_STYLE === 'true',
  });

  getBucketOrThrow() {
    const bucket = process.env.STORAGE_BUCKET;
    if (!bucket) {
      throw new Error('STORAGE_BUCKET is not configured');
    }

    return bucket;
  }

  buildObjectKey(topicId: string, filename: string) {
    const safeFilename = filename.replace(/[^a-zA-Z0-9._-]/g, '-');
    return `topics/${topicId}/${randomUUID()}-${safeFilename}`;
  }

  signUploadUrl(bucket: string, objectKey: string, mimeType?: string) {
    const command = new PutObjectCommand({
      Bucket: bucket,
      Key: objectKey,
      ContentType: mimeType || 'application/octet-stream',
    });

    return getSignedUrl(this.client, command, { expiresIn: 900 });
  }

  buildPublicUrl(objectKey: string) {
    const publicBase = process.env.STORAGE_PUBLIC_BASE_URL?.replace(/\/$/, '');
    return publicBase ? `${publicBase}/${objectKey}` : undefined;
  }
}
