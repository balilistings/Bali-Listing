import { useSelector } from 'react-redux';
import Cookies from 'js-cookie';
import { useConfiguration } from '../context/configurationContext';

// Keep homepage and directory contact tracking subject to the same analytics consent.
export default function useServiceTracking() {
  const config = useConfiguration();
  const currentUser = useSelector(state => state.user.currentUser);
  return (event, properties = {}) => {
    const profileConsent = currentUser?.attributes?.profile?.protectedData?.cookieConsent?.accepted;
    const allowed = !config.cookieConsent?.enabled || (typeof profileConsent === 'boolean' ? profileConsent : Cookies.get('cookieConsent') === 'accepted');
    if (allowed && typeof window !== 'undefined' && window.gtag) window.gtag('event', event, properties);
  };
}
