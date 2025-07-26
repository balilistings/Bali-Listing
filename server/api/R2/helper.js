// Allowed file types
const ALLOWED_FILE_TYPES = {
  image: ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/jpg'],
  // video: ['video/mp4', 'video/mpeg', 'video/quicktime'],
  pdf: ['application/pdf'],
};

const getFileCategory = mimetype => {
  for (const [category, types] of Object.entries(ALLOWED_FILE_TYPES)) {
    if (types.includes(mimetype)) {
      return category;
    }
  }
  return 'other';
};

module.exports = {
  getFileCategory,
};
