import { storableError } from '../../util/errors';
import { parse } from '../../util/urlHelpers';
import { addMarketplaceEntities } from '../../ducks/marketplaceData.duck';
import { fetchCurrentUser } from '../../ducks/user.duck';

const RESULT_PAGE_SIZE = 42;

export const FAVORITES_CLEAR = 'app/FavoriteListingsPage/FAVORITES_CLEAR';
export const FAVORITES_UNFAVORITE = 'app/FavoriteListingsPage/FAVORITES_UNFAVORITE';
export const FETCH_LISTINGS_REQUEST = 'app/FavoriteListingsPage/FETCH_LISTINGS_REQUEST';
export const FETCH_LISTINGS_SUCCESS = 'app/FavoriteListingsPage/FETCH_LISTINGS_SUCCESS';
export const FETCH_LISTINGS_ERROR = 'app/FavoriteListingsPage/FETCH_LISTINGS_ERROR';

const initialState = {
  pagination: null,
  queryParams: null,
  queryInProgress: false,
  queryFavoritesError: null,
  currentPageResultIds: [],
  listings: [],
};

const resultIds = data => data.data.map(l => l.id);

// ✅ Helper function to expand relationships manually
const expandListingRelationships = (listing, included) => {
  if (!listing || !included) return listing;

  const expandedListing = { ...listing };

  // Expand images
  if (listing.relationships?.images?.data) {
    expandedListing.images = listing.relationships.images.data
      .map(imgRef => included.find(inc => inc.id.uuid === imgRef.id.uuid && inc.type === 'image'))
      .filter(Boolean);
  }

  // Expand author
  if (listing.relationships?.author?.data) {
    const authorRef = listing.relationships.author.data;
    expandedListing.author = included.find(
      inc => inc.id.uuid === authorRef.id.uuid && inc.type === 'user'
    );
  }

  return expandedListing;
};

export const unfavoriteAllListings = () => async (dispatch, getState, sdk) => {
  const { currentUser } = getState().user;

  if (!currentUser) {
    dispatch(unfavoriteAllSuccess());
    return Promise.resolve();
  }

  const profile = currentUser.attributes?.profile || {};
  const payload = {
    privateData: {
      ...profile.privateData,
      favorites: [],
    },
  };

  try {
    const response = await sdk.currentUser.updateProfile(payload);
    await dispatch(fetchCurrentUser());
    dispatch(unfavoriteAllSuccess());
    return response;
  } catch (e) {
    console.error('❌ unfavoriteAllListings failed:', e);
    throw e;
  }
};

const favoriteListingsPageReducer = (state = initialState, action = {}) => {
  const { type, payload } = action;
  switch (type) {
    case FETCH_LISTINGS_REQUEST:
      return {
        ...state,
        queryParams: payload.queryParams,
        queryInProgress: true,
        queryFavoritesError: null,
        currentPageResultIds: [],
        listings: [],
      };

    case FETCH_LISTINGS_SUCCESS:
      return {
        ...state,
        currentPageResultIds: resultIds(payload.data),
        listings: Array.isArray(payload.data?.data) ? payload.data.data : [],
        pagination: payload.data?.meta || null,
        queryInProgress: false,
      };

    case FETCH_LISTINGS_ERROR:
      return {
        ...state,
        queryInProgress: false,
        queryFavoritesError: payload,
      };

    case FAVORITES_UNFAVORITE:
      const updatedListings = state.listings.filter(
        listing => listing.id?.uuid !== payload.listingId
      );
      return {
        ...state,
        currentPageResultIds: state.currentPageResultIds.filter(
          idObj => idObj?.uuid !== payload.listingId
        ),
        listings: updatedListings,
      };

    case FAVORITES_CLEAR:
      return {
        ...state,
        currentPageResultIds: [],
        listings: [],
        pagination: null,
      };

    default:
      return state;
  }
};

export default favoriteListingsPageReducer;

export const queryFavoritesRequest = queryParams => ({
  type: FETCH_LISTINGS_REQUEST,
  payload: { queryParams },
});

export const queryFavoritesSuccess = response => ({
  type: FETCH_LISTINGS_SUCCESS,
  payload: { data: response.data },
});

export const queryFavoritesError = e => ({
  type: FETCH_LISTINGS_ERROR,
  error: true,
  payload: e,
});

export const unfavoriteSuccess = listingId => ({
  type: FAVORITES_UNFAVORITE,
  payload: { listingId },
});

export const unfavoriteAllSuccess = () => ({
  type: FAVORITES_CLEAR,
});

export const queryFavoriteListings = queryParams => (dispatch, getState, sdk) => {
  dispatch(queryFavoritesRequest(queryParams));

  const { currentUser } = getState().user;
  const favorites = currentUser?.attributes?.profile?.privateData?.favorites || [];

  if (!favorites || favorites.length === 0) {
    const emptyResponse = {
      data: {
        data: [],
        meta: { totalItems: 0, totalPages: 1, perPage: RESULT_PAGE_SIZE, page: 1 },
      },
    };
    dispatch(queryFavoritesSuccess(emptyResponse));
    return Promise.resolve(emptyResponse);
  }

  const params = {
    ...queryParams,
    ids: favorites,
    include: ['images', 'author', 'author.profileImage'],
    'fields.image': [
      'variants.landscape-crop',
      'variants.landscape-crop2x',
      'variants.scaled-small',
      'variants.scaled-medium',
      'variants.scaled-large',
      'variants.default',
    ],
    'limit.images': 10,
  };

  return sdk.listings
    .query(params)
    .then(response => {
      // CRITICAL FIX: Manually expand relationships before storing
      const expandedListings = response.data.data.map(listing =>
        expandListingRelationships(listing, response.data.included)
      );

      // Create modified response with expanded listings
      const expandedResponse = {
        data: {
          ...response.data,
          data: expandedListings,
        },
      };

      // Still call addMarketplaceEntities for other parts of the app
      dispatch(addMarketplaceEntities(response));
      dispatch(queryFavoritesSuccess(expandedResponse));

      return expandedResponse;
    })
    .catch(e => {
      console.error('❌ Favorites API Error:', e);
      dispatch(queryFavoritesError(storableError(e)));
      throw e;
    });
};

export const unfavoriteListing = listingId => async (dispatch, getState, sdk) => {
  const { currentUser } = getState().user;

  if (!currentUser) {
    dispatch(unfavoriteSuccess(listingId));
    return Promise.resolve();
  }

  const profile = currentUser.attributes?.profile || {};
  const favorites = profile.privateData?.favorites || [];
  const updatedFavorites = favorites.filter(id => id !== listingId);

  const payload = {
    privateData: {
      ...profile.privateData,
      favorites: updatedFavorites,
    },
  };

  try {
    const response = await sdk.currentUser.updateProfile(payload);
    await dispatch(fetchCurrentUser());
    dispatch(unfavoriteSuccess(listingId));
    return response;
  } catch (e) {
    console.error('❌ unfavoriteListing failed:', e);
    throw e;
  }
};

export const loadData = (params, search) => {
  const queryParams = parse(search);
  const apiParams = {
    ...queryParams,
    page: queryParams.page || 1,
    perPage: RESULT_PAGE_SIZE,
  };
  return queryFavoriteListings(apiParams);
};
