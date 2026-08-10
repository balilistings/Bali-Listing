process.env.REACT_APP_MARKETPLACE_ROOT_URL = 'https://balilistings.com';

const { loadData } = require('./dataLoader');

const createAppInfo = matchPathname => {
  const dispatch = jest.fn(action =>
    action && typeof action.then === 'function' ? action : Promise.resolve()
  );
  const store = {
    dispatch,
    getState: () => ({}),
  };
  const fetchAppAssets = jest.fn(() => Promise.resolve({}));

  return {
    appInfo: {
      matchPathname,
      configureStore: jest.fn(() => store),
      routeConfiguration: jest.fn(() => []),
      defaultConfig: {
        layout: {},
        appCdnAssets: {},
      },
      mergeConfig: jest.fn((hostedConfig, defaultConfig) => defaultConfig),
      fetchAppAssets,
    },
    dispatch,
    fetchAppAssets,
  };
};

describe('server-side data loading', () => {
  test('skips hosted asset loading for unmatched routes', async () => {
    const matchPathname = jest.fn(() => []);
    const { appInfo, dispatch, fetchAppAssets } = createAppInfo(matchPathname);

    const result = await loadData('/missing-page', {}, appInfo);

    expect(matchPathname).toHaveBeenCalledWith('/missing-page', []);
    expect(dispatch).not.toHaveBeenCalled();
    expect(fetchAppAssets).not.toHaveBeenCalled();
    expect(result.unmatchedRoute).toBe(true);
  });

  test('keeps loading data for matched application routes', async () => {
    const matchPathname = jest.fn(() => [{ route: {} }]);
    const { appInfo, fetchAppAssets } = createAppInfo(matchPathname);

    const result = await loadData('/', {}, appInfo);

    expect(fetchAppAssets).toHaveBeenCalledWith({});
    expect(result.unmatchedRoute).toBeUndefined();
  });
  test.each([
    '/s/commercial',
    '/s/commerical',
    '/s?pub_categoryLevel1=commercial',
    '/s?pub_categoryLevel1=commerical',
  ])('short-circuits inactive commercial search request %s', async requestUrl => {
    const matchPathname = jest.fn(() => [{ route: {} }]);
    const { appInfo, dispatch, fetchAppAssets } = createAppInfo(matchPathname);

    const result = await loadData(requestUrl, {}, appInfo);

    expect(dispatch).not.toHaveBeenCalled();
    expect(fetchAppAssets).not.toHaveBeenCalled();
    expect(result.unmatchedRoute).toBe(true);
  });

  test('keeps active category search routes working', async () => {
    const matchPathname = jest.fn(() => [{ route: {} }]);
    const { appInfo, fetchAppAssets } = createAppInfo(matchPathname);

    const result = await loadData('/s?pub_categoryLevel1=rentalvillas', {}, appInfo);

    expect(fetchAppAssets).toHaveBeenCalledWith({});
    expect(result.unmatchedRoute).toBeUndefined();
  });

});
