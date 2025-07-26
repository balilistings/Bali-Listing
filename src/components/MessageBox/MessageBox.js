import React from 'react';
import css from './MessageBox.module.css';
import { PrimaryButton } from '../Button/Button';

const MessageBox = ({ message, onConfirm, onCancel }) => {
  return (
    <div className={css.overlay}>
      <div className={css.messageBox}>
        <p>{message}</p>
        <div className={css.buttons}>
          <button className={css.button} onClick={onConfirm}>
            OK
          </button>
          <button className={css.button} onClick={onCancel}>
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

export default MessageBox;
