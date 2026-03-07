import { PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { Injectable } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { env } from '../../../config/env';

@Injectable()
export class StorageSigningService {
  private readonly client = new S3Client({
    region: env.awsRegion,
    credentials:
      env.awsAccessKeyId && env.awsSecretAccessKey
        ? {
            accessKeyId: env.awsAccessKeyId,
            secretAccessKey: env.awsSecretAccessKey,
          }
        : undefined,
    endpoint: env.storageEndpoint || undefined,
    forcePathStyle: env.storageForcePathStyle,
  });

  getBucketOrThrow() {
    const bucket = env.storageBucket;
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
    const publicBase = env.storagePublicBaseUrl?.replace(/\/$/, '');
    return publicBase ? `${publicBase}/${objectKey}` : undefined;
  }
}
