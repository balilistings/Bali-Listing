import { photoFingerprint, isStaticPhoto } from './photoFile';
const { createHash } = require('crypto');
beforeEach(() => Object.defineProperty(window, 'crypto', { configurable: true, value: {} }));
const png = animated => new File([
  new Uint8Array([137,80,78,71,13,10,26,10]),
  ...(animated ? [new Uint8Array([0,0,0,0]), 'acTL', new Uint8Array(4)] : []),
  new Uint8Array([0,0,0,0]), 'IEND', new Uint8Array(4),
], 'photo.png', { type: 'image/png' });
const webp = animated => new File([
  'RIFF', new Uint8Array([14,0,0,0]), 'WEBP', animated ? 'ANIM' : 'VP8L',
  new Uint8Array([2,0,0,0,0,0]),
], 'photo.webp', { type: 'image/webp' });

test('matches exact photo bytes across filenames but distinguishes same-name different photos', async () => {
  Object.defineProperty(window.crypto, 'subtle', { configurable: true, value: {
    digest: jest.fn(async (_, bytes) => createHash('sha256').update(Buffer.from(bytes)).digest()),
  } });
  const hash = await photoFingerprint(new File(['photo-a'], 'one.jpg'));
  expect(hash).toHaveLength(64);
  expect(await photoFingerprint(new File(['photo-a'], 'renamed.jpg'))).toBe(hash);
  expect(await photoFingerprint(new File(['photo-b'], 'one.jpg'))).not.toBe(hash);
});

test('missing crypto fails open without blocking uploads', async () => {
  Object.defineProperty(window.crypto, 'subtle', { configurable: true, value: undefined });
  expect(await photoFingerprint(new File(['photo'], 'photo.jpg'))).toBeNull();
});

test('optimizes static containers but preserves PNG/WebP animation and invalid files', async () => {
  expect(await isStaticPhoto(png(false))).toBe(true);
  expect(await isStaticPhoto(png(true))).toBe(false);
  expect(await isStaticPhoto(webp(false))).toBe(true);
  expect(await isStaticPhoto(webp(true))).toBe(false);
  expect(await isStaticPhoto(new File(['invalid'], 'x.png', { type: 'image/png' }))).toBe(false);
  expect(await isStaticPhoto(new File(['gif'], 'x.gif', { type: 'image/gif' }))).toBe(false);
});
