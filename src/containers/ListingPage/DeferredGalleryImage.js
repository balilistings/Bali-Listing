import React, { useEffect, useState } from 'react';
import ResponsiveImage from '../../components/ResponsiveImage/ResponsiveImage';
import { get } from '../../util/api';

// Mounted only for photos that the visitor has selected; state is local to this gallery.
const DeferredGalleryImage = ({ image, listingId, ...props }) => {
  const [loaded, setLoaded] = useState(null);
  const [error, setError] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const deferred = image?.attributes?.deferred;
  const id = image?.id?.uuid;
  const listing = listingId?.uuid;
  useEffect(() => {
    if (!deferred) return;
    let cancelled = false;
    setLoaded(null);
    setError(false);
    get(`/api/listings/${listing}/photos/${id}`)
      .then(photo => { if (!cancelled) setLoaded(photo); })
      .catch(() => { if (!cancelled) setError(true); });
    return () => { cancelled = true; };
  }, [deferred, id, listing, attempt]);
  if (deferred && !loaded) {
    return error
      ? <button type="button" onClick={() => setAttempt(n => n + 1)}>Photo could not load. Retry</button>
      : <span role="status" aria-live="polite">Loading photo…</span>;
  }
  return <ResponsiveImage image={loaded || image} {...props} />;
};
export default DeferredGalleryImage;
