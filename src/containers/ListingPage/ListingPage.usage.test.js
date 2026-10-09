import reducer, { fetchReviews, fetchReviewsSuccess, showListing } from './ListingPage.duck';
import { post } from '../../util/api';
jest.mock('../../util/api', () => ({ post: jest.fn(), transactionLineItems: jest.fn() }));
jest.mock('../../ducks/user.duck', () => ({ fetchCurrentUser: () => ({ type: 'ignore' }), fetchCurrentUserHasOrdersSuccess: jest.fn() }));
beforeEach(() => { post.mockReset(); post.mockResolvedValue({ data: [] }); });

test('a late review response cannot replace the next listing reviews or mark them fresh', () => {
  const page = { id: { uuid: 'listing2' }, reviews: [], reviewsFetchedAt: null };
  const result = reducer(page, fetchReviewsSuccess(['old listing review'], { uuid: 'listing1' }));
  expect(result).toBe(page);
});

test('reuses fresh reviews hydrated from SSR but fetches another listing', async () => {
  const id = { uuid: 'listing1' };
  const page = reducer({ id }, fetchReviewsSuccess([]));
  const sdk = { reviews: { query: jest.fn().mockResolvedValue({ data: { data: [] } }) } };
  const dispatch = jest.fn();
  await fetchReviews(id)(dispatch, () => ({ ListingPage: page }), sdk);
  expect(sdk.reviews.query).not.toHaveBeenCalled();
  await fetchReviews({ uuid: 'listing2' })(dispatch, () => ({ ListingPage: page }), sdk);
  expect(post).toHaveBeenCalledTimes(1);
});

test('refreshes expired review data', async () => {
  const id = { uuid: 'listing1' };
  const sdk = { reviews: { query: jest.fn().mockResolvedValue({ data: { data: [] } }) } };
  await fetchReviews(id)(jest.fn(), () => ({ ListingPage: { id, reviewsFetchedAt: Date.now() - 61000 } }), sdk);
  expect(post).toHaveBeenCalledTimes(1);
});

test('listing hydration reuses the loaded entity and reviews reuse empty server results', async () => {
  const id = { uuid: 'listing1' };
  const entity = { id, type: 'listing', attributes: { title: 'Listing' } };
  const config = { layout: { listingImage: {} }, accessControl: { marketplace: { private: false } } };
  const state = { ListingPage: reducer(undefined, {}), auth: { isAuthenticated: false }, user: {}, marketplaceData: { entities: { listing: { listing1: entity } } } };
  const dispatch = action => { state.ListingPage = reducer(state.ListingPage, action); };
  post.mockResolvedValueOnce({ data: entity });
  await showListing(id, config)(dispatch, () => state, {});
  expect(post).toHaveBeenCalledTimes(1);
  // A fresh SDK has no browser memory cache, so this must reuse the serialized Redux entity.
  await showListing(id, config)(dispatch, () => state, {});
  expect(post).toHaveBeenCalledTimes(1);
  post.mockResolvedValueOnce({ data: [] });
  await fetchReviews(id, config)(dispatch, () => state, {});
  const calls = post.mock.calls.length;
  await fetchReviews(id, config)(dispatch, () => state, {});
  expect(post).toHaveBeenCalledTimes(calls);
});
