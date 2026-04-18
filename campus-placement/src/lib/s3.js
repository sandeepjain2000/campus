import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { randomUUID } from 'crypto';

export function isS3Configured() {
  return Boolean(
    process.env.AWS_REGION
    && process.env.AWS_ACCESS_KEY_ID
    && process.env.AWS_SECRET_ACCESS_KEY
    && process.env.S3_BUCKET_NAME,
  );
}

function getClient() {
  return new S3Client({
    region: process.env.AWS_REGION,
    credentials: {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    },
  });
}

function sanitizeFilename(name) {
  return String(name || 'file')
    .replace(/[^a-zA-Z0-9._-]+/g, '_')
    .slice(0, 180);
}

/**
 * Public HTTPS URL for an object (virtual-hosted–style). Fine for metadata;
 * downloads can use presigned GET later if the bucket is private.
 */
export function buildS3ObjectPublicUrl(bucket, region, key) {
  const encKey = key.split('/').map(encodeURIComponent).join('/');
  return `https://${bucket}.s3.${region}.amazonaws.com/${encKey}`;
}

/**
 * @param {{ userId: string, fileName: string, contentType: string }} opts
 * @returns {Promise<{ uploadUrl: string, fileUrl: string, key: string, bucket: string, expiresIn: number }>}
 */
export async function createStudentDocumentPresign({ userId, fileName, contentType }) {
  if (!isS3Configured()) {
    throw new Error('S3 is not configured (missing AWS env vars).');
  }

  const bucket = process.env.S3_BUCKET_NAME;
  const region = process.env.AWS_REGION;
  const safe = sanitizeFilename(fileName);
  const key = `students/${userId}/${randomUUID()}-${safe}`;

  const client = getClient();
  const command = new PutObjectCommand({
    Bucket: bucket,
    Key: key,
    ContentType: contentType || 'application/octet-stream',
  });

  const expiresIn = parseInt(process.env.S3_PRESIGN_EXPIRES_SECONDS || '900', 10);
  const uploadUrl = await getSignedUrl(client, command, { expiresIn });

  const fileUrl = buildS3ObjectPublicUrl(bucket, region, key);

  return { uploadUrl, fileUrl, key, bucket, expiresIn };
}

/**
 * Profile photo — same bucket/IAM prefix `students/{userId}/…` as documents.
 * @param {{ userId: string, fileName: string, contentType: string }} opts
 * @returns {Promise<{ uploadUrl: string, fileUrl: string, key: string, bucket: string, expiresIn: number }>}
 */
export async function createStudentAvatarPresign({ userId, fileName, contentType }) {
  if (!isS3Configured()) {
    throw new Error('S3 is not configured (missing AWS env vars).');
  }

  const bucket = process.env.S3_BUCKET_NAME;
  const region = process.env.AWS_REGION;
  const safe = sanitizeFilename(fileName);
  const key = `students/${userId}/avatar/${randomUUID()}-${safe}`;

  const client = getClient();
  const command = new PutObjectCommand({
    Bucket: bucket,
    Key: key,
    ContentType: contentType || 'application/octet-stream',
  });

  const expiresIn = parseInt(process.env.S3_PRESIGN_EXPIRES_SECONDS || '900', 10);
  const uploadUrl = await getSignedUrl(client, command, { expiresIn });

  const fileUrl = buildS3ObjectPublicUrl(bucket, region, key);

  return { uploadUrl, fileUrl, key, bucket, expiresIn };
}
