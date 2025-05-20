import React from 'react';
import { useDropzone } from 'react-dropzone';
import css from './FieldAddImageMultiple.module.css';

const FieldAddImageMultiple = ({ onImageUploadHandler, disabled }) => {
  const onDrop = acceptedFiles => {
    acceptedFiles.forEach(file => {
      onImageUploadHandler(file);
    });
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: 'image/*',
    multiple: true,
    disabled,
  });

  return (
    <div {...getRootProps()} className={css.dropzone}>
      <input {...getInputProps()} />
      {isDragActive ? (
        <p>Drop the images here...</p>
      ) : (
        <p>
          + Add photos
          <br />
          (JPG/PNG, max 20 MB each)
        </p>
      )}
    </div>
  );
};

export default FieldAddImageMultiple;
