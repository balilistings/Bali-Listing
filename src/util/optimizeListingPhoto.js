import { isStaticPhoto } from './photoFile';

// Sharetribe accepts JPEG/PNG uploads. Preserve alpha using PNG, and never flatten animation.
export const optimizeListingPhoto = async file => {
  if (!file || typeof document === 'undefined') return file;
  let url;
  try {
    if (!(await isStaticPhoto(file))) return file;
    url = URL.createObjectURL(file);
    const image = await new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = reject;
      img.src = url;
    });
    const scale = Math.min(1, 2000 / Math.max(image.naturalWidth, image.naturalHeight));
    const canvas = document.createElement('canvas');
    canvas.width = Math.max(1, Math.round(image.naturalWidth * scale));
    canvas.height = Math.max(1, Math.round(image.naturalHeight * scale));
    const context = canvas.getContext('2d');
    context.drawImage(image, 0, 0, canvas.width, canvas.height);
    let transparent = false;
    if (file.type !== 'image/jpeg') {
      const pixels = context.getImageData(0, 0, canvas.width, canvas.height).data;
      for (let i = 3; i < pixels.length; i += 4) {
        if (pixels[i] < 255) { transparent = true; break; }
      }
    }
    const type = transparent ? 'image/png' : 'image/jpeg';
    const extension = transparent ? '.png' : '.jpg';
    const name = type === file.type ? file.name : file.name.replace(/\.[^.]+$/, '') + extension;
    const blob = await new Promise(resolve => canvas.toBlob(resolve, type, 0.82));
    // Static WebP must be converted even if larger: the API does not accept WebP input.
    return blob && blob.type === type && (blob.size < file.size || file.type === 'image/webp')
      ? new File([blob], name, { type, lastModified: file.lastModified })
      : file;
  } catch (e) {
    return file;
  } finally {
    if (url) URL.revokeObjectURL(url);
  }
};
