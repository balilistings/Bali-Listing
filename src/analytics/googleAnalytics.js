// Initialize once per document, including when consent is granted after page load.
// Browser-history page views must be disabled in GA4: routing sends them explicitly.
export const initializeGoogleAnalytics = measurementId => {
  if (typeof window === 'undefined' || !measurementId) return;
  const initialized = window.__baliAnalyticsIds || (window.__baliAnalyticsIds = {});
  if (initialized[measurementId]) return;
  window.dataLayer = window.dataLayer || [];
  window.gtag =
    window.gtag ||
    function() {
      window.dataLayer.push(arguments);
    };
  window.gtag('js', new Date());
  window.gtag('config', measurementId, {
    cookie_flags: 'SameSite=None;Secure',
  });
  initialized[measurementId] = true;
};
