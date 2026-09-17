import { initializeGoogleAnalytics } from './googleAnalytics';
import { GoogleAnalyticsHandler } from './handlers';

beforeEach(() => {
  delete window.__baliAnalyticsIds;
  delete window.gtag;
  window.dataLayer = [];
});
test('repeat initialization sends only one config/initial page view', () => {
  initializeGoogleAnalytics('G-TEST');
  initializeGoogleAnalytics('G-TEST');
  expect(
    window.dataLayer.map(args => Array.from(args)).filter(a => a[0] === 'config')
  ).toHaveLength(1);
});
test('does not initialize without a configured property', () => {
  initializeGoogleAnalytics(undefined);
  expect(window.dataLayer).toHaveLength(0);
});
test('SPA navigation records location and previous page once, not repeated route notifications', () => {
  jest.useFakeTimers();
  window.gtag = jest.fn();
  const handler = new GoogleAnalyticsHandler();
  handler.trackPageView('/', null);
  handler.trackPageView('/s', '/');
  handler.trackPageView('/s', '/s');
  jest.runAllTimers();
  expect(window.gtag).toHaveBeenCalledTimes(1);
  expect(window.gtag).toHaveBeenCalledWith('event', 'page_view', {
    page_path: '/s',
    page_location: `${window.location.origin}/s`,
    page_referrer: `${window.location.origin}/`,
  });
  jest.useRealTimers();
});
