import reducer, { fetchHomepageServices } from './LandingPage.duck';
jest.mock('../PageBuilder/SectionBuilder/SectionArticle/PropertyCards', () => ({ customLocationBounds: [] }));
jest.mock('../../util/log', () => ({ error: jest.fn() }));
jest.mock('../../util/localeAssetUtils', () => ({ constructLocalizedPageAssets: (map, match, locale) => ({services: 'content/pages/services' + (locale === 'id' ? '-id' : '') + '.json'}) }));
jest.mock('../../util/data', () => ({ denormalizeAssetData: data => data }));

test('loads published service content with the same asset version as the homepage', async () => {
  const data={sections:[]};
  const sdk={assetByVersion:jest.fn().mockResolvedValue({data})};
  const dispatch=jest.fn();
  await fetchHomepageServices(null,'en')(dispatch,()=>({hostedAssets:{version:'published-version'}}),sdk);
  expect(sdk.assetByVersion).toHaveBeenCalledWith({path:'content/pages/services.json',version:'published-version'});
  expect(reducer(undefined,dispatch.mock.calls[0][0]).servicesPageData).toEqual(data);
});

test('falls back to the default directory when a translation is unavailable', async () => {
  const data={sections:[]};
  const sdk={assetByAlias:jest.fn().mockRejectedValueOnce(new Error('Missing translation')).mockResolvedValueOnce({data})};
  const dispatch=jest.fn();
  await fetchHomepageServices(null,'id')(dispatch,()=>({hostedAssets:{}}),sdk);
  expect(sdk.assetByAlias).toHaveBeenLastCalledWith({path:'content/pages/services.json',alias:'latest'});
  expect(reducer(undefined,dispatch.mock.calls[0][0]).servicesPageData).toEqual(data);
});

test('a services failure does not discard featured listings or reject homepage loading', async () => {
  const sdk={assetByAlias:jest.fn().mockRejectedValue(new Error('Unavailable'))};
  const dispatch=jest.fn();
  await fetchHomepageServices(null,'en')(dispatch,()=>({hostedAssets:{}}),sdk);
  const state={featuredListingIds:['existing-listing'],servicesPageData:{sections:[]}};
  expect(reducer(state,dispatch.mock.calls[0][0])).toEqual({featuredListingIds:['existing-listing'],servicesPageData:null});
});
