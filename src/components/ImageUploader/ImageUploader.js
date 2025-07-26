import React, { useCallback, useState, useEffect } from 'react';
import { useDropzone } from 'react-dropzone';
import { getPresignedUrlR2 } from '../../util/api';
import css from './ImageUploader.module.css';

export default function ImageUploader({
  columns = 3,
  dropzoneHeight = '15rem',
  labelText = 'Profile',
  onProfileChange = () => {},
  maxImages = null,
  label = 'label',
  userId = null, // Required for R2 storage path
  storagePath = 'documents', // Default storage path
}) {
  const [images, setImages] = useState([]);
  const [profileIndex, setProfileIndex] = useState(0);
  const [uploadProgress, setUploadProgress] = useState([]);
  const [uploadedUrls, setUploadedUrls] = useState([]);

  const uploadFileToR2 = async (file, progressIndex) => {
    try {
      const params = {
        file: {
          name: file.name,
          type: file.type,
        },
        storagePath: storagePath,
      };

      // Get presigned URL
      const response = await getPresignedUrlR2(params);

      if (!response.success) {
        throw new Error(response.error || 'Failed to get presigned URL');
      }

      // Upload file to R2 using presigned URL
      const uploadResponse = await fetch(response.file.url, {
        method: 'PUT',
        body: file,
        headers: { 'Content-Type': file.type },
      });

      if (!uploadResponse.ok) {
        throw new Error(`Upload failed: ${uploadResponse.statusText}`);
      }

      // Construct public URL
      const fileName = encodeURIComponent(file.name);
      const publicUrl = `${process.env.REACT_APP_R2_PUBLIC_DOMAIN}/${storagePath}/${fileName}`;

      return publicUrl;
    } catch (error) {
      console.error('Failed to upload file:', error);
      throw error;
    }
  };

  const onDrop = useCallback(
    async acceptedFiles => {
      const newFiles = acceptedFiles.map(file =>
        Object.assign(file, { preview: URL.createObjectURL(file) })
      );

      // Initialize progress tracking for new files
      const withProgress = newFiles.map(file => ({ file, progress: 0 }));
      setUploadProgress(prev => [...prev, ...withProgress]);

      const startIndex = images.length;

      // Add files to display immediately
      setImages(prev => {
        const updated = [...prev, ...newFiles];
        if (prev.length === 0 && newFiles.length > 0) setProfileIndex(0);
        return maxImages ? updated.slice(0, maxImages) : updated;
      });

      // Upload files to R2
      const uploadPromises = newFiles.map(async (file, index) => {
        const progressIndex = uploadProgress.length + index;

        try {
          // Simulate progress updates during upload
          const progressInterval = setInterval(() => {
            setUploadProgress(prevProgress => {
              const updated = [...prevProgress];
              if (updated[progressIndex] && updated[progressIndex].progress < 90) {
                updated[progressIndex].progress += 10;
              }
              return updated;
            });
          }, 200);

          const publicUrl = await uploadFileToR2(file, progressIndex);

          clearInterval(progressInterval);

          // Set progress to 100% on successful upload
          setUploadProgress(prevProgress => {
            const updated = [...prevProgress];
            if (updated[progressIndex]) {
              updated[progressIndex].progress = 100;
            }
            return updated;
          });

          return { index: startIndex + index, url: publicUrl };
        } catch (error) {
          console.error(`Failed to upload ${file.name}:`, error);

          // Set progress to 0 on error to indicate failure
          setUploadProgress(prevProgress => {
            const updated = [...prevProgress];
            if (updated[progressIndex]) {
              updated[progressIndex].progress = 0;
            }
            return updated;
          });

          return { index: startIndex + index, url: null, error: true };
        }
      });

      // Wait for all uploads to complete
      const uploadResults = await Promise.all(uploadPromises);

      // Update uploaded URLs
      setUploadedUrls(prev => {
        const updated = [...prev];
        uploadResults.forEach(result => {
          if (result.url) {
            updated[result.index] = result.url;
          }
        });
        return updated;
      });

      // If this is the first upload and it succeeded, call onProfileChange
      const firstSuccessfulUpload = uploadResults.find(result => result.url && result.index === 0);
      if (startIndex === 0 && firstSuccessfulUpload) {
        onProfileChange(firstSuccessfulUpload.url);
      }
    },
    [maxImages, uploadProgress.length, images.length, userId, storagePath, onProfileChange]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'image/*': [], 'application/pdf': [] },
    multiple: true,
  });

  useEffect(() => {
    return () => {
      images.forEach(file => URL.revokeObjectURL(file.preview));
    };
  }, [images]);

  const handleProfileChange = index => {
    setProfileIndex(index);
    const selectedUrl = uploadedUrls[index];
    if (selectedUrl) {
      onProfileChange(selectedUrl);
    } else {
      // If upload is still in progress or failed, pass the file object as fallback
      onProfileChange(images[index]);
    }
  };

  const handleDelete = index => {
    const newImages = images.filter((_, i) => i !== index);
    const newUploadedUrls = uploadedUrls.filter((_, i) => i !== index);

    setImages(newImages);
    setUploadedUrls(newUploadedUrls);
    setUploadProgress(prev => prev.filter((_, i) => i !== index));

    if (index === profileIndex) {
      const newProfileIndex = 0;
      setProfileIndex(newProfileIndex);
      const newSelectedUrl = newUploadedUrls[newProfileIndex];
      if (newSelectedUrl) {
        onProfileChange(newSelectedUrl);
      } else if (newImages[newProfileIndex]) {
        onProfileChange(newImages[newProfileIndex]);
      } else {
        onProfileChange(null);
      }
    } else if (index < profileIndex) {
      setProfileIndex(prev => prev - 1);
    }
  };

  return (
    <div className={css.uploadContainer}>
      <label>{label}</label>

      {images.length === 0 && (
        <div {...getRootProps()} className={css.dropzone} style={{ height: dropzoneHeight }}>
          <input {...getInputProps()} />
          <p className={css.text}>
            {isDragActive ? (
              'Drop the images here...'
            ) : (
              <>
                + Add photos
                <br />
                (JPG/PNG, max 20 MB)
              </>
            )}
          </p>
        </div>
      )}

      <div className={css.imageGrid} style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}>
        {images.map((file, index) => (
          <div
            key={index}
            className={`${css.imageWrapper} ${index === profileIndex ? css.selected : ''}`}
          >
            <button
              className={css.deleteButton}
              onClick={() => handleDelete(index)}
              title="Delete photo"
            >
              ✕
            </button>

            {file.type === 'application/pdf' ? (
              <div className={css.pdfPreview} onClick={() => handleProfileChange(index)}>
                <span className={css.fileTypeLabel}>PDF</span>
                <span className={css.fileName}>{file.name}</span>
              </div>
            ) : (
              <img
                src={file.preview}
                alt={`preview-${index}`}
                className={css.previewImage}
                onClick={() => handleProfileChange(index)}
              />
            )}

            {uploadProgress[index]?.progress < 100 && uploadProgress[index]?.progress > 0 && (
              <div className={css.progressBarContainer}>
                <div
                  className={css.progressBar}
                  style={{
                    width: `${uploadProgress[index]?.progress || 0}%`,
                  }}
                />
              </div>
            )}

            {uploadProgress[index]?.progress === 0 && uploadedUrls[index] === undefined && (
              <div className={css.uploadError}>
                <span className={css.errorText}>Upload failed</span>
              </div>
            )}

            {uploadedUrls[index] && (
              <div className={css.uploadSuccess}>
                <span className={css.successIcon}>✓</span>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
