import { useEffect } from 'react';
import { useSelector } from 'react-redux';
import { post } from '../../util/api';

// Record a visible signed-in visit or interaction, never an idle-tab heartbeat.
export default function ProviderActivity() {
  const user = useSelector(state => state.user.currentUser);
  const hasListings = useSelector(state => state.user.currentUserHasListings);
  const id = hasListings ? user?.id?.uuid : null;
  const stored = user?.attributes?.profile?.privateData?.blLastActiveAt;
  useEffect(() => {
    if (!id) return;
    const key = 'bl-activity-' + id;
    let last = Date.parse(stored) || 0;
    try { last = Math.max(last, Number(localStorage.getItem(key)) || 0); } catch (_) {}
    let busy = false;
    let retryAfter = 0;
    let stopped = false;
    const record = () => {
      const now = Date.now();
      if (stopped || document.visibilityState !== 'visible' || busy || now < retryAfter || (last <= now && now - last < 86400000)) return;
      busy = true;
      post('/api/provider-activity', {}).then(({ lastActiveAt }) => {
        last = Date.parse(lastActiveAt);
        try { localStorage.setItem(key, String(last)); } catch (_) {}
      }).catch(() => { retryAfter = Date.now() + 300000; }).finally(() => { busy = false; });
    };
    record();
    document.addEventListener('visibilitychange', record);
    document.addEventListener('pointerdown', record, { passive: true });
    document.addEventListener('keydown', record);
    return () => {
      stopped = true;
      document.removeEventListener('visibilitychange', record);
      document.removeEventListener('pointerdown', record);
      document.removeEventListener('keydown', record);
    };
  }, [id, stored]);
  return null;
}
