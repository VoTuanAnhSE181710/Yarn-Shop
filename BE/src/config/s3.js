import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { configDotenv } from "dotenv";
configDotenv();

const s3Client = new S3Client({
  region: process.env.AWS_REGION || "ap-southeast-1",
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

const BUCKET_NAME = process.env.S3_BUCKET_NAME || "yarn-shop-videos";

/**
 * Generate a presigned upload URL for S3
 * @param {string} key - S3 object key (e.g. "videos/vid_abc123.mp4")
 * @param {string} mimeType - MIME type of the file
 * @param {number} expiresIn - Expiration time in seconds (default: 3600 = 1 hour)
 * @returns {Promise<{uploadUrl: string, expiresAt: string}>}
 */
export const generatePresignedUploadUrl = async (key, mimeType, expiresIn = 3600) => {
  const command = new PutObjectCommand({
    Bucket: BUCKET_NAME,
    Key: key,
    ContentType: mimeType,
  });

  const uploadUrl = await getSignedUrl(s3Client, command, { expiresIn });
  const expiresAt = new Date(Date.now() + expiresIn * 1000).toISOString();

  return { uploadUrl, expiresAt };
};

/**
 * Generate the public CDN URL for a video
 * @param {string} key - S3 object key
 * @returns {string}
 */
export const getVideoCdnUrl = (key) => {
  const cdnDomain = process.env.CDN_DOMAIN || `https://${BUCKET_NAME}.s3.amazonaws.com`;
  return `${cdnDomain}/${key}`;
};

export { s3Client, BUCKET_NAME };