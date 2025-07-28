import React, { useEffect, useState } from 'react';
import { IconCollection } from '..';
import css from './ShareModal.module.css';

const ShareModal = ({ setShow }) => {
  const [copyStatus, setCopyStatus] = useState('idle');

  const currentUrl = window.location.href;

  useEffect(() => {
    const handleKeyDown = event => {
      if (event.key === 'Escape') {
        setShow(false);
      }
    };

    document.body.style.overflow = 'hidden';
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = 'unset';
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [setShow]);

  const copyLink = async () => {
    if (copyStatus !== 'idle') return;
    try {
      await navigator.clipboard.writeText(currentUrl);
      setCopyStatus('success');
    } catch (error) {
      setCopyStatus('error');
    } finally {
      setTimeout(() => setCopyStatus('idle'), 2000);
    }
  };

  const handleFacebookShare = () => {
    const shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(
      currentUrl
    )}`;
    window.open(shareUrl, '_blank', 'noopener,noreferrer');
  };

  const getTooltipMessage = () => {
    if (copyStatus === 'success') return 'Link copied!';
    if (copyStatus === 'error') return 'Failed to copy';
    return null;
  };

  return (
    <div className={css.shareModal} onClick={() => setShow(false)}>
      <div className={css.shareModalContent} onClick={e => e.stopPropagation()}>
        <div className={css.shareModalTop}>
          <div className={css.shareModalHeader}>
            <div className={css.headerSpacer} />
            <div className={css.headerCenter}>
              <IconCollection name="share-modal" />
              <span className={css.shareModalLabel}>Share</span>
            </div>
            <button className={css.closeButton} onClick={() => setShow(false)} aria-label="Close">
              <IconCollection name="close_icon" />
            </button>
          </div>
        </div>
        <p className={css.shareModalDescription}>Share this listing</p>

        <div className={css.shareModalGrid}>
          {/* Facebook Share Button */}
          <button className={css.shareOption} onClick={handleFacebookShare}>
            <div className={css.shareOptionIcon}>
              <IconCollection name="facebook" />
            </div>
            <span className={css.shareOptionLabel}>Facebook</span>
          </button>

          {/* Copy Link Button (Universal) */}
          <button className={css.shareOption} onClick={copyLink}>
            {copyStatus !== 'idle' && (
              <div className={copyStatus === 'success' ? css.successTooltip : css.errorTooltip}>
                {getTooltipMessage()}
              </div>
            )}
            <div className={css.shareOptionIcon}>
              <IconCollection name="copy-link" />
            </div>
            <span className={css.shareOptionLabel}>Copy Link</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default ShareModal;
