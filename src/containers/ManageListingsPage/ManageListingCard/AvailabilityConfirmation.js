import React, { useState } from 'react';
import { post } from '../../../util/api';
import { nativeCall, nativeMarketplace } from '../../../util/nativeMarketplace';
import css from './ManageListingCard.module.css';

export default function AvailabilityConfirmation({ listing }) {
  const [savedAt, setSavedAt] = useState(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const value = savedAt || listing.attributes.privateData?.blAvailabilityConfirmedAt;
  const date = value && new Date(value);
  const valid = date && Number.isFinite(date.getTime());
  const overdue = valid && Date.now() - date.getTime() >= 60 * 86400000;
  const confirm = async event => {
    event.preventDefault();
    event.stopPropagation();
    setSaving(true);
    setError('');
    try {
      const listingId = listing.id.uuid;
      const result = nativeMarketplace
        ? await nativeCall('/api/marketplace/listings/' + listingId + '/availability', { method: 'POST', body: {} })
        : await post('/api/listings/confirm-availability', { listingId });
      setSavedAt(result.confirmedAvailableAt);
    } catch (_) { setError('Could not save confirmation. Please try again.'); }
    finally { setSaving(false); }
  };
  if (listing.attributes.state !== 'published') return null;
  return <div className={css.availabilityConfirmation}>
    <p role="status">{valid ? 'Availability confirmed: ' + date.toLocaleDateString('en-GB') : 'Availability not yet confirmed'}{overdue ? ' — please confirm again' : ''}</p>
    <button type="button" onClick={confirm} disabled={saving || !!savedAt}>{saving ? 'Saving…' : savedAt ? 'Confirmed available' : 'Confirm still available'}</button>
    <small>Confirm that this listing is still available for enquiries. Review every 60 days.</small>
    {error ? <p role="alert">{error}</p> : null}
  </div>;
}
