const { PutObjectCommand } = require('@aws-sdk/client-s3');
const { getR2Client } = require('../../api-util/sdk');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');
const { getFileCategory } = require('./helper');

// Define constants
const R2_BUCKET_NAME = process.env.R2_BUCKET_NAME || 'default-bucket-name';
const URL_EXPIRATION = 30; // URL expiration in seconds

/**
 * Generates a presigned URL for uploading a single file to R2
 * @param {Object} R2 - R2 client instance
 * @param {Object} fileData - File data object
 * @param {string} storagePath - Storage path
 * @returns {Promise<Object>} Presigned URL and file information
 */
const generateSinglePresignedUrl = async (R2, fileData, storagePath) => {
  const { name, type } = fileData;
  const fileCategory = getFileCategory(type);
  const key = `${storagePath}/${name}`;

  // Generate presigned URL for PUT operation
  const command = new PutObjectCommand({
    Bucket: R2_BUCKET_NAME,
    Key: key,
    ContentType: type,
    Metadata: {
      originalname: name,
      category: fileCategory,
    },
  });

  const signedUrl = await getSignedUrl(R2, command, { expiresIn: URL_EXPIRATION });

  return {
    url: signedUrl,
    name: key,
    originalName: name,
    category: fileCategory,
  };
};

/**
 * Generates presigned URLs for uploading files to R2
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 */
const generatePresignedUrlR2 = async (req, res) => {
  try {
    const R2 = getR2Client();
    const { file, storagePath } = req.body;

    // Process single file
    const { name, type } = file;

    if (!name || !type) {
      return res.status(400).json({
        success: false,
        error: 'File name and type are required',
      });
    }

    try {
      const fileInfo = await generateSinglePresignedUrl(R2, file, storagePath);

      return res.status(200).json({
        success: true,
        file: fileInfo,
      });
    } catch (error) {
      console.error(`Error generating presigned URL for file: ${name}`, error);

      return res.status(500).json({
        success: false,
        error: 'Failed to generate presigned URL',
        details: error.message,
      });
    }
  } catch (error) {
    console.error('Error in generatePresignedUrlR2:', error);
    const statusCode = error.message.includes('environment variable') ? 503 : 500;

    return res.status(statusCode).json({
      success: false,
      error: 'Failed to generate presigned URL',
      details: error.message,
    });
  }
};

module.exports = {
  generatePresignedUrlR2,
};
