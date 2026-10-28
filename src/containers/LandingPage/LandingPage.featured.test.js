import reducer, { fetchFeaturedListings, searchFeaturedListingsRequest, searchFeaturedListingsSuccess, searchFeaturedListingsError } from './LandingPage.duck';
import { featuredListingIdsByArea } from '../../config/featuredListings';
import { post } from '../../util/api';
jest.mock('../../util/api', () => ({ post: jest.fn() }));
jest.mock('../PageBuilder/SectionBuilder/SectionArticle/PropertyCards', () => ({ customLocationBounds: [{ bounds: 'canggu-bounds' }] }));
jest.mock('../../ducks/marketplaceData.duck', () => ({ addMarketplaceEntities: response => ({ type: 'entities', payload: response }) }));

const listing = id => ({ id: { uuid: id }, type: 'listing' });
const response = ids => ({ data: { data: ids.map(listing), included: [] } });

test('fetches only the three selected listings in one query, even if they have never been marked featured', async () => {
  const ids = featuredListingIdsByArea.canggu;
  const original = response([...ids].reverse());
  const sdk = { listings: { query: jest.fn().mockResolvedValue(original) } };
  post.mockResolvedValue(original.data);
  const dispatch = jest.fn();
  const result = await fetchFeaturedListings()(dispatch, () => ({}), sdk);
  expect(sdk.listings.query).not.toHaveBeenCalled();
  const params = post.mock.calls[0][1].params;
  expect(post.mock.calls[0][1].deferImages).toBe(true);
  expect(params.ids).toBe(ids.join(','));
  expect(params.perPage).toBe(3);
  expect(params).not.toHaveProperty('pub_featured');
  expect(params).not.toHaveProperty('area');
  expect(result.data.data.map(l => l.id.uuid)).toEqual(ids);
  expect(original.data.data.map(l => l.id.uuid)).toEqual([...ids].reverse());
});

test('Pererenan uses its own selections and omits listings no longer returned as published', async () => {
  const ids = featuredListingIdsByArea.pererenan;
  const sdk = { listings: { query: jest.fn().mockResolvedValue(response([ids[2], ids[0]])) } };
  post.mockClear().mockResolvedValue(response([ids[2], ids[0]]).data);
  const result = await fetchFeaturedListings({ area: 'pererenan' })(jest.fn(), () => ({}), sdk);
  expect(post.mock.calls[0][1].params.ids).toBe(ids.join(','));
  expect(result.data.data.map(l => l.id.uuid)).toEqual([ids[0], ids[2]]);
});

test('slow responses from a previously selected area cannot replace the active area', () => {
  let state = reducer(undefined, searchFeaturedListingsRequest('canggu'));
  state = reducer(state, searchFeaturedListingsRequest('pererenan'));
  expect(reducer(state, searchFeaturedListingsSuccess(response(['old']), 'canggu'))).toBe(state);
  expect(reducer(state, searchFeaturedListingsError(new Error('old request'), 'canggu'))).toBe(state);
  state = reducer(state, searchFeaturedListingsSuccess(response(['current']), 'pererenan'));
  expect(state.featuredListingIds).toEqual([{ uuid: 'current' }]);
  expect(state.featuredListingsInProgress).toBe(false);
});
