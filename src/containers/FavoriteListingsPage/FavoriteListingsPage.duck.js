// src/ducks/FavoriteListingsPage.duck.js
import { storableError } from '../../util/errors';
import { createImageVariantConfig } from '../../util/sdkLoader';
import { parse } from '../../util/urlHelpers';
import { addMarketplaceEntities } from '../../ducks/marketplaceData.duck';
import { fetchCurrentUser } from '../../ducks/user.duck';

// Pagination page size might need to be dynamic on responsive page layouts
const RESULT_PAGE_SIZE = 42;

// ================ Action types ================ //
export const FAVORITES_CLEAR = 'app/FavoriteListingsPage/FAVORITES_CLEAR';
export const FAVORITES_UNFAVORITE = 'app/FavoriteListingsPage/FAVORITES_UNFAVORITE';
export const FETCH_LISTINGS_REQUEST = 'app/FavoriteListingsPage/FETCH_LISTINGS_REQUEST';
export const FETCH_LISTINGS_SUCCESS = 'app/FavoriteListingsPage/FETCH_LISTINGS_SUCCESS';
export const FETCH_LISTINGS_ERROR = 'app/FavoriteListingsPage/FETCH_LISTINGS_ERROR';

// ================ Reducer ================ //

const initialState = {
  pagination: null,
  queryParams: null,
  queryInProgress: false,
  queryFavoritesError: null,
  currentPageResultIds: [],
  listings: [],
};

const resultIds = data => data.data.map(l => l.id);

// Thunk: unfavoriteAllListings
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
      };

    case FETCH_LISTINGS_SUCCESS:
      // ✅ FIXED: Hapus duplikasi, simpan listings dengan benar
      return {
        ...state,
        currentPageResultIds: resultIds(payload.data),
        listings: Array.isArray(payload.data?.data) ? payload.data.data : [],
        pagination: payload.data?.meta || null,
        queryInProgress: false,
      };

    case FETCH_LISTINGS_ERROR:
      console.error(payload);
      return {
        ...state,
        queryInProgress: false,
        queryFavoritesError: payload
      };

    case FAVORITES_UNFAVORITE:
      return {
        ...state,
        currentPageResultIds: state.currentPageResultIds.filter(
          idObj => idObj?.uuid !== payload.listingId
        ),
        listings: state.listings.filter(
          listing => listing.id?.uuid !== payload.listingId
        ),
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

// ================ Action creators ================ //

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

// ================ Thunks ================ //

export const queryFavoriteListings = queryParams => (dispatch, getState, sdk) => {
  dispatch(queryFavoritesRequest(queryParams));
  const { currentUser } = getState().user;
  const { favorites } = currentUser?.attributes.profile.privateData || {};

  console.log('=== 🚀 DEBUGGING QUERY FAVORITE LISTINGS ===');
  console.log('👤 Current user:', currentUser);
  console.log('❤️  User favorites IDs:', favorites);
  console.log('📋 Query params:', queryParams);

  const favoritesMaybe = favorites ? { ids: favorites } : {};
  const { perPage, ...rest } = queryParams;
  const params = { ...favoritesMaybe, ...rest, perPage };

  console.log('🔍 Final API params:', params);

  return sdk.listings
    .query(params)
    .then(response => {
      console.log('✅ API Response received:', response);
      console.log('📊 Number of listings:', response.data?.data?.length || 0);
      
      // ✅ Log gambar untuk debugging
      if (response.data?.data) {
        response.data.data.forEach((listing, idx) => {
          console.log(`📸 Listing ${idx + 1} images:`, listing.relationships?.images);
        });
      }

      dispatch(addMarketplaceEntities(response));
      dispatch(queryFavoritesSuccess(response));
      return response;
    })
    .catch(e => {
      console.error('❌ API Error:', e);
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

export const loadData = (params, search, config) => {
  const queryParams = parse(search);
  const page = queryParams.page || 1;

  const {
    aspectWidth = 1,
    aspectHeight = 1,
    variantPrefix = 'listing-card',
  } = config.layout.listingImage;
  const aspectRatio = aspectHeight / aspectWidth;

  console.log('=== 🔧 LOAD DATA CONFIGURATION ===');
  console.log('🖼️ Image config:', { aspectWidth, aspectHeight, variantPrefix, aspectRatio });

  // ✅ FIXED: Tambah lebih banyak image variants
  const imageVariantConfig = {
    ...createImageVariantConfig(`${variantPrefix}`, 400, aspectRatio),
    ...createImageVariantConfig(`${variantPrefix}-2x`, 800, aspectRatio),
  };

  console.log('🎨 Image variant config:', imageVariantConfig);

  const apiParams = {
    ...queryParams,
    page,
    perPage: RESULT_PAGE_SIZE,
    include: ['images', 'author', 'author.profileImage'],
    'fields.image': [
      // Primary variants
      `variants.${variantPrefix}`,
      `variants.${variantPrefix}-2x`,
      // Fallback variants
      'variants.landscape-crop',
      'variants.landscape-crop2x',
      'variants.scaled-small',
      'variants.scaled-medium',
      'variants.scaled-large',
      // Original
      'url'
    ],
    'fields.listing': [
      'title',
      'description',
      'price',
      'publicData',
      'geolocation',
      'state'
    ],
    ...imageVariantConfig,
    'limit.images': 10, // ✅ Reasonable limit
  };

  console.log('📡 Final API params for loadData:', apiParams);

  return queryFavoriteListings(apiParams);
};