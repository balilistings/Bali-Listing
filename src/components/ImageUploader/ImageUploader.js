import React, { useCallback, useState, useEffect } from 'react';
import { useDropzone } from 'react-dropzone';
import css from './ImageUploader.module.css';

export default function ImageUploader({
  columns = 3,
  dropzoneHeight = '15rem',
  labelText = 'Profile',
  onProfileChange = () => {},
  maxImages = null,
  label = 'label',
}) {
  const [images, setImages] = useState([]);
  const [profileIndex, setProfileIndex] = useState(0);
  const [uploadProgress, setUploadProgress] = useState([]);

  const onDrop = useCallback(
    acceptedFiles => {
      const newFiles = acceptedFiles.map(file =>
        Object.assign(file, { preview: URL.createObjectURL(file) })
      );

      const withProgress = newFiles.map(file => ({ file, progress: 0 }));
      setUploadProgress(prev => [...prev, ...withProgress]);

      // Simulate upload
      withProgress.forEach((item, i) => {
        const index = uploadProgress.length + i;
        const interval = setInterval(() => {
          setUploadProgress(prevProgress => {
            const updated = [...prevProgress];
            if (updated[index].progress < 100) {
              updated[index].progress += 10;
            }
            return updated;
          });
        }, 100);
        setTimeout(() => clearInterval(interval), 1000);
      });

      setImages(prev => {
        const updated = [...prev, ...newFiles];
        if (prev.length === 0 && newFiles.length > 0) setProfileIndex(0);
        return maxImages ? updated.slice(0, maxImages) : updated;
      });
    },
    [maxImages, uploadProgress.length]
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
    onProfileChange(images[index]);
  };

  const handleDelete = index => {
    const newImages = images.filter((_, i) => i !== index);
    setImages(newImages);
    setUploadProgress(prev => prev.filter((_, i) => i !== index));

    if (index === profileIndex) {
      setProfileIndex(0);
      onProfileChange(newImages[0] || null);
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

            {uploadProgress[index]?.progress < 100 && (
              <div className={css.progressBarContainer}>
                <div
                  className={css.progressBar}
                  style={{
                    width: `${uploadProgress[index]?.progress || 0}%`,
                  }}
                />
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
