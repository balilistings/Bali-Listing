import { optimizeListingPhoto } from './optimizeListingPhoto';

test('object URL failure still uploads the original JPEG', async () => {
  URL.createObjectURL = jest.fn(() => { throw new Error('unavailable'); });
  const file = new File(['photo'], 'photo.jpg', { type: 'image/jpeg' });
  expect(await optimizeListingPhoto(file)).toBe(file);
});

test('preserves unsupported or malformed containers', async () => {
  for (const type of ['image/png', 'image/gif', 'image/webp']) {
    const file = new File(['photo'], 'photo', { type });
    expect(await optimizeListingPhoto(file)).toBe(file);
  }
});

test('preserves PNG transparency, compresses opaque PNG as JPEG, and rejects bad/larger output', async () => {
  URL.createObjectURL = jest.fn(() => 'blob:photo');
  URL.revokeObjectURL = jest.fn();
  const OriginalImage = window.Image;
  window.Image = class { naturalWidth = 4000; naturalHeight = 3000; set src(value) { this.onload(); } };
  const context = { drawImage: jest.fn(), fillRect: jest.fn(), getImageData: jest.fn(() => ({ data: new Uint8Array([1,2,3,0]) })) };
  const canvas = { getContext: () => context, toBlob: jest.fn((cb, type) => cb(new Blob(['small'], { type }))) };
  const create = jest.spyOn(document, 'createElement').mockReturnValue(canvas);
  const file = new File([
    new Uint8Array([137,80,78,71,13,10,26,10,0,0,0,0]), 'IEND', new Uint8Array(4),
  ], 'transparent.png', { type: 'image/png' });
  const result = await optimizeListingPhoto(file);
  expect(result.type).toBe('image/png');
  expect(result.name).toBe('transparent.png');
  expect(canvas.width).toBe(2000);
  expect(context.fillRect).not.toHaveBeenCalled();
  expect(canvas.toBlob).toHaveBeenCalledWith(expect.any(Function), 'image/png', 0.82);
  context.getImageData.mockReturnValue({ data: new Uint8Array([1,2,3,255]) });
  const opaque = await optimizeListingPhoto(file);
  expect(opaque.type).toBe('image/jpeg');
  expect(opaque.name).toBe('transparent.jpg');
  canvas.toBlob.mockImplementation(cb => cb(new Blob(['small'], { type: 'image/webp' })));
  expect(await optimizeListingPhoto(file)).toBe(file);
  canvas.toBlob.mockImplementation(cb => cb(new Blob(['x'.repeat(100)], { type: 'image/jpeg' })));
  expect(await optimizeListingPhoto(file)).toBe(file);
  // WebP inputs become an API-supported format even when conversion is larger.
  const webp = new File(['RIFF', new Uint8Array([14,0,0,0]), 'WEBP', 'VP8L', new Uint8Array([2,0,0,0,0,0])], 'photo.webp', { type: 'image/webp' });
  const converted = await optimizeListingPhoto(webp);
  expect(converted.type).toBe('image/jpeg');
  expect(converted.name).toBe('photo.jpg');
  create.mockRestore();
  window.Image = OriginalImage;
});

test('JPEG decode failure falls back to the original file and releases its URL', async () => {
  URL.createObjectURL = jest.fn(() => 'blob:photo');
  URL.revokeObjectURL = jest.fn();
  const OriginalImage = window.Image;
  window.Image = class { set src(value) { this.onerror(new Error('decode')); } };
  const file = new File(['invalid'], 'photo.jpg', { type: 'image/jpeg' });
  expect(await optimizeListingPhoto(file)).toBe(file);
  expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:photo');
  window.Image = OriginalImage;
});

test('resizes a large JPEG to 2000 pixels while preserving its aspect ratio', async () => {
  URL.createObjectURL = jest.fn(() => 'blob:photo');
  URL.revokeObjectURL = jest.fn();
  const OriginalImage = window.Image;
  window.Image = class {
    naturalWidth = 4000;
    naturalHeight = 3000;
    set src(value) { this.onload(); }
  };
  const draw = jest.fn();
  const canvas = { getContext: () => ({ drawImage: draw }), toBlob: callback => callback(new Blob(['small'], { type: 'image/jpeg' })) };
  const create = jest.spyOn(document, 'createElement').mockReturnValue(canvas);
  const file = new File(['original original'], 'photo.jpg', { type: 'image/jpeg' });
  const result = await optimizeListingPhoto(file);
  expect(canvas.width).toBe(2000);
  expect(canvas.height).toBe(1500);
  expect(result.size).toBeLessThan(file.size);
  expect(result.name).toBe('photo.jpg');
  create.mockRestore();
  window.Image = OriginalImage;
});
