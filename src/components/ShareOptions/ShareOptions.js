import React, { useRef, useEffect, useState } from 'react';
// import { X } from 'lucide-react';

import IconInstagram from '../../assets//iconmonstr-instagram-11.svg';
import IconTiktok from '../../assets/iconmonstr-tiktok.svg';
import IconFacebook from '../../assets/iconmonstr-faebook.svg';
import IconLink from '../../assets/iconmonstr-copyLink.svg';
import ShareIcon from '../../assets/ShareIcon.svg';

import css from './ShareOptions.module.css';

const ShareOptions = ({ shareUrl, onClose }) => {
  const modalRef = useRef(null);

  const copyToClipboard = () => {
    // alert('Link copied to clipboard!');
    const currentUrl = window.location.href;

    // navigator.clipboard
    //   .writeText(currentUrl)
    navigator.clipboard
      .writeText(shareUrl)
      .then(() => {
        setCopySuccess(true);
        setCopyError(false);

        setTimeout(() => {
          setCopySuccess(false);
        }, 2000);
      })
      .catch(() => {
        setCopySuccess(false);
        setCopyError(true);

        setTimeout(() => {
          setCopyError(false);
        }, 2000);
      });
  };

  useEffect(() => {
    const handleClickOutside = event => {
      if (event.target === event.currentTarget) {
        onClose();
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onClose]);

  useEffect(() => {
    const handleEscape = event => {
      if (event.key === 'Escape') {
        onClose();
      }
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [onClose]);

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, []);

  const handleOverlayClick = event => {
    if (event.target === event.currentTarget) {
      onClose();
    }
  };
  const [copySuccess, setCopySuccess] = useState(false);
  const [copyError, setCopyError] = useState(false);

  const handleContentClick = event => {
    event.preventDefault();
    event.stopPropagation();
  };

  return (
    <div className={css.shareModal} onClick={handleOverlayClick}>
      <div className={css.shareModalContent} ref={modalRef} onClick={handleContentClick}>
        <div className={css.shareModalTop}>
          <button className={css.shareModalClose} onClick={onClose}>
            X
          </button>

          <div className={css.shareModalHeader}>
            <img src={ShareIcon} alt="Share" className={css.shareModalIcon} />
            <span className={css.shareModalLabel}>Share</span>
          </div>

          <h3 className={css.shareModalTitle}>Share this listing</h3>
        </div>

        <div className={css.shareModalBottom}>
          <div className={css.shareOptionsGrid}>
            <button
              className={css.shareOption}
              onClick={() =>
                window.open(`https://www.instagram.com/sharer/sharer.php?u=${shareUrl}`, '_blank')
              }
            >
              <div className={css.shareOptionIcon}>
                <img src={IconInstagram} alt="Instagram" width="48" height="48" />
              </div>
              <span className={css.shareOptionLabel}>Instagram</span>
            </button>
            <button
              className={css.shareOption}
              onClick={() =>
                window.open(`https://www.facebook.com/sharer/sharer.php?u=${shareUrl}`, '_blank')
              }
            >
              <div className={css.shareOptionIcon}>
                <img src={IconFacebook} alt="Facebook" width="48" height="48" />
              </div>
              <span className={css.shareOptionLabel}>Facebook</span>
            </button>
            <button
              className={css.shareOption}
              onClick={() =>
                window.open(`https://www.tiktok.com/sharer/sharer.php?u=${shareUrl}`, '_blank')
              }
            >
              <div className={css.shareOptionIcon}>
                <img src={IconTiktok} alt="TikTok" width="48" height="48" />
              </div>
              <span className={css.shareOptionLabel}>TikTok</span>
            </button>
            <button className={css.shareOption} onClick={copyToClipboard}>
              {(copySuccess || copyError) && (
                <div className={copySuccess ? css.successTooltip : css.errorTooltip}>
                  {copySuccess ? 'Link copied' : 'Failed to copy link'}
                </div>
              )}{' '}
              <div className={css.shareOptionIcon}>
                <img src={IconLink} alt="Copy Link" width="48" height="48" />
              </div>
              <span className={css.shareOptionLabel}>Copy Link</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ShareOptions;
