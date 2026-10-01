jest.mock('sharetribe-flex-sdk', () => ({
  types: { BigDecimal: class {} },
  tokenStore: {
    expressCookieStore: ({ req, res = {} }) => ({ getToken: () => req.token, setToken: token => { res.token = token; } }),
    memoryStore: () => { let token; return { getToken: () => token, setToken: value => { token = value; } }; },
  },
  createInstance: jest.fn(({ tokenStore }) => {
    const show = jest.fn().mockResolvedValue('listing');
    return {
    originalShow: show,
    authInfo: () => Promise.resolve({ isAnonymous: !tokenStore.getToken()?.access_token }),
    loginAs: jest.fn(() => { tokenStore.setToken({ access_token: 'authenticated-user' }); return Promise.resolve(); }),
    listings: { query: jest.fn().mockResolvedValue('public listings'), show },
    reviews: { query: jest.fn().mockResolvedValue('reviews') },
    assetsByAlias: jest.fn().mockResolvedValue('assets'),
  }; }),
}));
jest.mock('sharetribe-flex-integration-sdk', () => ({ createInstance: jest.fn(() => ({})) }));
jest.mock('@aws-sdk/client-s3', () => ({ S3Client: jest.fn() }));
jest.mock('../log', () => ({ error: jest.fn() }));
const { getSdk, getReadSdk, getIntegrationSdk } = require('./sdk');

test('reuses anonymous SDK reads but isolates every user session', async () => {
  const publicSdk = getReadSdk({ headers: {} }, {});
  expect(getReadSdk({ headers: {} }, {})).toBe(publicSdk);
  const query = { id: 'listing1' };
  expect(await publicSdk.listings.show(query)).toBe('listing');
  await publicSdk.listings.show(query);
  const sdkModule = require('sharetribe-flex-sdk');
  const anonymousOriginal = sdkModule.createInstance.mock.results[0].value;
  // Calls returned through the wrapper are cached; user sessions get untouched methods.
  const user1 = getReadSdk({ token: { access_token: 'user1' } }, {});
  const user2 = getReadSdk({ token: { access_token: 'user2' } }, {});
  expect(user1).not.toBe(user2);
  expect(user1.listings).not.toBe(anonymousOriginal.listings);
  await user1.listings.show(query);
  await user1.listings.show(query);
  expect(user1.listings.show).toHaveBeenCalledTimes(2);
  expect(user2.listings.show).not.toHaveBeenCalled();
});

test('a login-as callback without a cookie cannot authenticate the shared anonymous SDK', async () => {
  const publicSdk = getReadSdk({ headers: {} }, {});
  const response = {};
  const loginSdk = getSdk({ headers: {} }, response);
  expect(loginSdk).not.toBe(publicSdk);
  await loginSdk.loginAs({ code: 'test-only' });
  expect(response.token).toEqual({ access_token: 'authenticated-user' });
  expect(await publicSdk.authInfo()).toEqual({ isAnonymous: true });
  expect(getSdk({ headers: {} }, {})).not.toBe(loginSdk);
});

test('cached public reads preserve all arguments including the response options', async () => {
  const sdk = getReadSdk({ headers: {} }, {});
  const module = require('sharetribe-flex-sdk');
  const original = module.createInstance.mock.results[0].value;
  // Public cache is keyed by the complete argument list, so differing options cannot collide.
  const query = { id: 'options-listing' };
  const instanceCount = module.createInstance.mock.calls.length;
  original.originalShow.mockClear();
  await sdk.listings.show(query, { expand: true });
  await sdk.listings.show(query, { expand: true });
  await sdk.listings.show(query, { expand: false });
  expect(module.createInstance).toHaveBeenCalledTimes(instanceCount);
  expect(original.originalShow.mock.calls).toEqual([[query, { expand: true }], [query, { expand: false }]]);
});

test('integration SDK retains its server-only token store between calls', () => {
  expect(getIntegrationSdk()).toBe(getIntegrationSdk());
  expect(require('sharetribe-flex-integration-sdk').createInstance).toHaveBeenCalledTimes(1);
});
