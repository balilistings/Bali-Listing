import React, { useEffect, useState } from 'react';
import ResponsiveImage from '../../components/ResponsiveImage/ResponsiveImage';
import { get } from '../../util/api';

// Mounted only for photos that the visitor has selected; state is local to this gallery.
const DeferredGalleryImage = ({ image, listingId, photoRequests, ...props }) => {
  const [loaded, setLoaded] = useState(null);
  const [error, setError] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const hasPhoto = props.variants?.some(variant => image?.attributes?.variants?.[variant]?.url);
  const deferred = image?.attributes?.deferred && !hasPhoto;
  const id = image?.id?.uuid;
  const listing = listingId?.uuid;
  useEffect(() => {
    if (!deferred) return;
    let cancelled = false;
    setLoaded(null);
    setError(false);
    const key = `${listing}/${id}`;
    let request = photoRequests?.get(key);
    if (!request) {
      request = get(`/api/listings/${listing}/photos/${id}`);
      photoRequests?.set(key, request);
      // Keep successful reads only for this mounted gallery; failures must be retryable.
      request.catch(() => {
        if (photoRequests?.get(key) === request) photoRequests.delete(key);
      });
    }
    request
      .then(photo => { if (!cancelled) setLoaded(photo); })
      .catch(() => { if (!cancelled) setError(true); });
    return () => { cancelled = true; };
  }, [deferred, id, listing, attempt, photoRequests]);
  if (deferred && !loaded) {
    return error
      ? <button type="button" onClick={event => {
          event.preventDefault();
          event.stopPropagation();
          setAttempt(n => n + 1);
        }}>Photo could not load. Retry</button>
      : <span role="status" aria-live="polite">Loading photo…</span>;
  }
  return <ResponsiveImage image={loaded || image} {...props} />;
};
export default DeferredGalleryImage;
