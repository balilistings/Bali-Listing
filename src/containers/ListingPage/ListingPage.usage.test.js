import reducer, { fetchReviews, fetchReviewsSuccess } from './ListingPage.duck';

test('reuses fresh reviews hydrated from SSR but fetches another listing', async () => {
  const id = { uuid: 'listing1' };
  const page = reducer({ id }, fetchReviewsSuccess([]));
  const sdk = { reviews: { query: jest.fn().mockResolvedValue({ data: { data: [] } }) } };
  const dispatch = jest.fn();
  await fetchReviews(id)(dispatch, () => ({ ListingPage: page }), sdk);
  expect(sdk.reviews.query).not.toHaveBeenCalled();
  await fetchReviews({ uuid: 'listing2' })(dispatch, () => ({ ListingPage: page }), sdk);
  expect(sdk.reviews.query).toHaveBeenCalledTimes(1);
});

test('refreshes expired review data', async () => {
  const id = { uuid: 'listing1' };
  const sdk = { reviews: { query: jest.fn().mockResolvedValue({ data: { data: [] } }) } };
  await fetchReviews(id)(jest.fn(), () => ({ ListingPage: { id, reviewsFetchedAt: Date.now() - 61000 } }), sdk);
  expect(sdk.reviews.query).toHaveBeenCalledTimes(1);
});
