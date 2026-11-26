'use strict';

const { DeleteObjectCommand, GetObjectCommand, PutObjectCommand } = require('@aws-sdk/client-s3');
const { createPilotStorage, pilotBucket } = require('../r2-pilot.cjs');
const { SiteError } = require('./common.cjs');

const maxPhotoBytes = 5 * 1024 * 1024;
const png = Buffer.from('89504e470d0a1a0a', 'hex');
const jpeg = Buffer.from([0xff, 0xd8, 0xff]);

function contentType(bytes) {
  if (bytes.length < 16) throw new SiteError(415, 'Choose a JPEG, PNG or WebP image.');
  if (bytes.subarray(0, 8).equals(png)) return 'image/png';
  if (bytes.subarray(0, 3).equals(jpeg)) return 'image/jpeg';
  if (bytes.toString('ascii', 0, 4) === 'RIFF' && bytes.toString('ascii', 8, 12) === 'WEBP') return 'image/webp';
  throw new SiteError(415, 'Choose a JPEG, PNG or WebP image.');
}

function photoStorage() {
  let client;
  function send(command) {
    client ??= createPilotStorage();
    if (!client) throw new SiteError(503, 'Photo storage is unavailable.');
    return client.send(command, { abortSignal: AbortSignal.timeout(8000) });
  }
  return {
    contentType,
    put: (key, bytes, type) => send(new PutObjectCommand({
      Bucket: pilotBucket, Key: key, Body: bytes, ContentType: type,
    })),
    remove: key => send(new DeleteObjectCommand({ Bucket: pilotBucket, Key: key })),
    async get(key, type) {
      let response;
      try {
        response = await send(new GetObjectCommand({ Bucket: pilotBucket, Key: key }));
      } catch (error) {
        if (error.$metadata?.httpStatusCode === 404) throw new SiteError(404, 'Photo not found.');
        throw error;
      }
      if (!response.Body || response.ContentType !== type ||
          !Number.isSafeInteger(response.ContentLength) || response.ContentLength > maxPhotoBytes) {
        response.Body?.destroy();
        throw new SiteError(404, 'Photo not found.');
      }
      return { bytes: Buffer.from(await response.Body.transformToByteArray()), contentType: type };
    },
  };
}

module.exports = { photoStorage, maxPhotoBytes };
