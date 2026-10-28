export const readPhotoBytes = file => typeof file.arrayBuffer === 'function'
  ? file.arrayBuffer()
  : new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = () => reject(reader.error);
      reader.readAsArrayBuffer(file);
    });

// Exact bytes, not filenames: two different photos may have the same name.
// Unavailable browser crypto must never prevent a legitimate upload.
export const photoFingerprint = async file => {
  try {
    if (!window.crypto?.subtle) return null;
    const digest = await window.crypto.subtle.digest('SHA-256', await readPhotoBytes(file));
    return Array.from(new Uint8Array(digest), byte => byte.toString(16).padStart(2, '0')).join('');
  } catch (_) { return null; }
};

// Parse container chunks rather than searching compressed pixel data for strings.
// Unknown or malformed containers are preserved rather than flattened accidentally.
export const isStaticPhoto = async file => {
  if (file.type === 'image/jpeg') return true;
  if (!['image/png', 'image/webp'].includes(file.type)) return false;
  const bytes = new Uint8Array(await readPhotoBytes(file));
  const view = new DataView(bytes.buffer);
  const tag = offset => String.fromCharCode(...bytes.slice(offset, offset + 4));
  if (file.type === 'image/png') {
    if (bytes.length < 8 || ![137,80,78,71,13,10,26,10].every((b, i) => bytes[i] === b)) return false;
    for (let offset = 8; offset + 12 <= bytes.length;) {
      const size = view.getUint32(offset);
      if (offset + size + 12 > bytes.length) return false;
      const type = tag(offset + 4);
      if (type === 'acTL') return false;
      if (type === 'IEND') return true;
      offset += size + 12;
    }
  } else {
    if (bytes.length < 12 || tag(0) !== 'RIFF' || tag(8) !== 'WEBP') return false;
    const end = view.getUint32(4, true) + 8;
    if (end !== bytes.length) return false;
    let pixels = false;
    for (let offset = 12; offset + 8 <= end;) {
      const type = tag(offset);
      const size = view.getUint32(offset + 4, true);
      if (offset + size + 8 > end) return false;
      if (type === 'ANIM' || type === 'ANMF' ||
          (type === 'VP8X' && size > 0 && (bytes[offset + 8] & 2))) return false;
      if (type === 'VP8 ' || type === 'VP8L') pixels = true;
      offset += 8 + size + (size % 2);
      if (offset === end) return pixels;
    }
  }
  return false;
};
