import { optimizeListingPhoto } from './optimizeListingPhoto';

test('object URL failure still uploads the original JPEG', async () => {
  URL.createObjectURL = jest.fn(() => { throw new Error('unavailable'); });
  const file = new File(['photo'], 'photo.jpg', { type: 'image/jpeg' });
  expect(await optimizeListingPhoto(file)).toBe(file);
});

test('preserves transparency and animated image uploads', async () => {
  for (const type of ['image/png', 'image/gif', 'image/webp']) {
    const file = new File(['photo'], 'photo', { type });
    expect(await optimizeListingPhoto(file)).toBe(file);
  }
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
