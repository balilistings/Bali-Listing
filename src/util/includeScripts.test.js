import React from 'react';
import { render, act, cleanup } from '@testing-library/react';
import Cookies from 'js-cookie';
import { IncludeScripts } from './includeScripts';
import { useSelector } from 'react-redux';

jest.mock('react-redux', () => ({ useSelector: jest.fn() }));
jest.mock('../context/configurationContext', () => ({
  useConfiguration: () => ({ cookieConsent: { enabled: true } }),
}));
jest.mock('react-helmet-async', () => ({ Helmet: () => null }));
jest.mock('./deferredScriptLoader', () => ({ DeferredScriptLoader: () => null }));

const config = { analytics: { googleAnalyticsId: 'G-TEST' }, maps: {} };
const originalEnv = process.env.NODE_ENV;
beforeEach(() => {
  process.env.NODE_ENV = 'production';
  delete window.__baliAnalyticsIds;
  delete window.gtag;
  window.dataLayer = [];
  Cookies.remove('cookieConsent');
  useSelector.mockReturnValue(null);
});
afterEach(() => {
  cleanup();
  process.env.NODE_ENV = originalEnv;
  Cookies.remove('cookieConsent');
});
test('anonymous acceptance enables tracking immediately without reload, rerenders do not duplicate it', () => {
  const view = render(<IncludeScripts config={config} />);
  expect(window.dataLayer).toHaveLength(0);
  act(() => {
    Cookies.set('cookieConsent', 'accepted');
    window.dispatchEvent(new Event('cookie-consent-changed'));
  });
  expect(window.dataLayer).toHaveLength(2);
  view.rerender(<IncludeScripts config={config} />);
  expect(window.dataLayer).toHaveLength(2);
});
test('rejection does not enable analytics', () => {
  render(<IncludeScripts config={config} />);
  act(() => {
    Cookies.set('cookieConsent', 'rejected');
    window.dispatchEvent(new Event('cookie-consent-changed'));
  });
  expect(window.dataLayer).toHaveLength(0);
});
test('authenticated profile consent is observed from Redux', () => {
  useSelector.mockReturnValue({
    attributes: { profile: { protectedData: { cookieConsent: { accepted: true } } } },
  });
  render(<IncludeScripts config={config} />);
  expect(window.dataLayer).toHaveLength(2);
});
