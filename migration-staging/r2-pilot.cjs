'use strict';

const { GetObjectCommand, PutObjectCommand, S3Client } = require('@aws-sdk/client-s3');

const Bucket = 'balilistings-migration-staging';
const Key = 'migration-pilot/9d754b6b-70fb-494c-ba4c-be88a2ca61f3.png';
const image = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAIAAACQd1PeAAAADElEQVR4nGNQzgoHAAGYAOW+8C66AAAAAElFTkSuQmCC',
  'base64'
);

async function loadPilotImage() {
  const { R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY } = process.env;
  if (![R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY].some(Boolean)) return undefined;
  if (!/^[a-f0-9]{32}$/.test(R2_ACCOUNT_ID || '') || !R2_ACCESS_KEY_ID || !R2_SECRET_ACCESS_KEY) {
    throw new Error('R2 staging credentials are incomplete');
  }

  const storage = new S3Client({
    region: 'auto',
    endpoint: `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
    credentials: { accessKeyId: R2_ACCESS_KEY_ID, secretAccessKey: R2_SECRET_ACCESS_KEY },
    maxAttempts: 2,
  });

  try {
    await storage.send(new PutObjectCommand({
      Bucket,
      Key,
      Body: image,
      ContentType: 'image/png',
    }), { abortSignal: AbortSignal.timeout(5000) });

    const object = await storage.send(new GetObjectCommand({ Bucket, Key }), {
      abortSignal: AbortSignal.timeout(5000),
    });

    if (object.ContentLength !== image.length || object.ContentType !== 'image/png') {
      object.Body?.destroy?.();
      throw new Error('R2 returned unexpected image metadata');
    }

    const bytes = Buffer.from(await object.Body.transformToByteArray());
    if (!bytes.equals(image)) throw new Error('R2 returned unexpected image data');
    return bytes;
  } finally {
    storage.destroy();
  }
}

module.exports = { loadPilotImage };
