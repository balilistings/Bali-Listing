jest.mock('sharetribe-flex-sdk', () => ({
  types: { BigDecimal: class {} },
  tokenStore: {
    expressCookieStore: ({ req }) => ({ getToken: () => req.token }),
    memoryStore: () => ({ setToken: jest.fn() }),
  },
  createInstance: jest.fn(() => ({
    listings: { query: jest.fn().mockResolvedValue('public listings'), show: jest.fn().mockResolvedValue('listing') },
    reviews: { query: jest.fn().mockResolvedValue('reviews') },
    assetsByAlias: jest.fn().mockResolvedValue('assets'),
  })),
}));
jest.mock('sharetribe-flex-integration-sdk', () => ({ createInstance: jest.fn(() => ({})) }));
jest.mock('@aws-sdk/client-s3', () => ({ S3Client: jest.fn() }));
jest.mock('../log', () => ({ error: jest.fn() }));
const { getSdk, getIntegrationSdk } = require('./sdk');

test('reuses anonymous SDK reads but isolates every user session', async () => {
  const publicSdk = getSdk({ headers: {} }, {});
  expect(getSdk({ headers: {} }, {})).toBe(publicSdk);
  const query = { id: 'listing1' };
  expect(await publicSdk.listings.show(query)).toBe('listing');
  await publicSdk.listings.show(query);
  const sdkModule = require('sharetribe-flex-sdk');
  const anonymousOriginal = sdkModule.createInstance.mock.results[0].value;
  // Calls returned through the wrapper are cached; user sessions get untouched methods.
  const user1 = getSdk({ token: { access_token: 'user1' } }, {});
  const user2 = getSdk({ token: { access_token: 'user2' } }, {});
  expect(user1).not.toBe(user2);
  expect(user1.listings).not.toBe(anonymousOriginal.listings);
  await user1.listings.show(query);
  await user1.listings.show(query);
  expect(user1.listings.show).toHaveBeenCalledTimes(2);
  expect(user2.listings.show).not.toHaveBeenCalled();
});

test('integration SDK retains its server-only token store between calls', () => {
  expect(getIntegrationSdk()).toBe(getIntegrationSdk());
  expect(require('sharetribe-flex-integration-sdk').createInstance).toHaveBeenCalledTimes(1);
});
