// Keep original uploads if decoding/encoding fails, or if re-encoding saves no bytes.
export const optimizeListingPhoto = async file => {
  if (!file || file.type !== 'image/jpeg' || typeof document === 'undefined') return file;
  let url;
  try {
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
    canvas.getContext('2d').drawImage(image, 0, 0, canvas.width, canvas.height);
    const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/jpeg', 0.82));
    return blob && blob.size < file.size
      ? new File([blob], file.name, { type: 'image/jpeg', lastModified: file.lastModified })
      : file;
  } catch (e) {
    return file;
  } finally {
    if (url) URL.revokeObjectURL(url);
  }
};
