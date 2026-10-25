import reducer, { searchListings } from './SearchPage.duck';
import { post } from '../../util/api';
jest.mock('../../util/api', () => ({ post: jest.fn() }));

test.each([
  ['6', '6,7,8,9,10,11,12,13,14,15,20'],
  ...['1', '2', '3', '4', '5', '7'].map(value => [value, value]),
  [undefined, undefined],
])('bedroom selection %s sends %s without dropping other filters', async (selection, expected) => {
  post.mockClear();
  const config = {
    accessControl: { marketplace: { private: true } }, currency: 'IDR',
    search: { defaultFilters: [], sortConfig: {} },
    listing: { listingTypes: [], enforceValidListingType: false,
      listingFields: [{ key: 'bedrooms', enumOptions: [...Array.from({ length: 15 }, (_, i) => String(i + 1)), '20'].map(option => ({ option })) }] },
    categoryConfiguration: { categories: [] },
  };
  const state = { SearchPage: reducer(undefined, {}), auth: { isAuthenticated: true }, user: {} };
  const bounds = { ne: { lat: -8.6, lng: 115.2 }, sw: { lat: -8.7, lng: 115.1 } };
  post.mockResolvedValue({ data: [], meta: { totalItems: 0, totalPages: 0, page: 1, perPage: 24 } });
  await searchListings({ pub_bedrooms: selection, bounds, pub_categoryLevel1: 'rentalvillas', page: 1, perPage: 24 }, config)(() => {}, () => state, {});
  expect(post).toHaveBeenCalledWith('/api/public-read/listings', { params: expect.objectContaining({
    pub_bedrooms: expected, bounds, pub_categoryLevel1: 'rentalvillas', perPage: 24,
  }) });
});
