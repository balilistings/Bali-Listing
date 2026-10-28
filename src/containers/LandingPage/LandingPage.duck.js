import { fetchPageAssets } from '../../ducks/hostedAssets.duck';
import { addMarketplaceEntities } from '../../ducks/marketplaceData.duck';
import { denormalizeAssetData } from '../../util/data';
import { storableError } from '../../util/errors';
import * as log from '../../util/log';
import { constructLocalizedPageAssets } from '../../util/localeAssetUtils';
import { customLocationBounds } from '../PageBuilder/SectionBuilder/SectionArticle/PropertyCards';
import { util as sdkUtil } from '../../util/sdkLoader';
import { featuredListingIdsByArea } from '../../config/featuredListings';
import deferListingImages from '../../util/deferListingImages';
import { post } from '../../util/api';

export const ASSET_NAME = 'landing-page';
const SERVICES_LOADED = 'app/LandingPage/SERVICES_LOADED';

const SEARCH_FEATURED_LISTINGS_REQUEST = 'app/LandingPage/SEARCH_FEATURED_LISTINGS_REQUEST';
const SEARCH_FEATURED_LISTINGS_SUCCESS = 'app/LandingPage/SEARCH_FEATURED_LISTINGS_SUCCESS';
const SEARCH_FEATURED_LISTINGS_ERROR = 'app/LandingPage/SEARCH_FEATURED_LISTINGS_ERROR';

// ================ Reducer ================ //

const initialState = {
  servicesPageData: null,
  featuredArea: 'canggu',
  featuredListingIds: [],
  featuredListingsInProgress: false,
  featuredListingsError: null,
};

const resultIds = data => data.data.map(l => l.id);

export default function reducer(state = initialState, action = {}) {
  const { type, payload } = action;
  switch (type) {
    case SERVICES_LOADED:
      return { ...state, servicesPageData: payload };
    case SEARCH_FEATURED_LISTINGS_REQUEST:
      return {
        ...state,
        featuredArea: payload.area,
        featuredListingsInProgress: true,
        featuredListingsError: null,
      };

    case SEARCH_FEATURED_LISTINGS_SUCCESS:
      if (payload.area !== state.featuredArea) return state;
      const currentSequence = resultIds(payload.data);

      return {
        ...state,
        featuredListingsInProgress: false,
        featuredListingIds: currentSequence,
      };

    case SEARCH_FEATURED_LISTINGS_ERROR:
      if (action.area !== state.featuredArea) return state;
      return { ...state, featuredListingsInProgress: false, featuredListingsError: payload };

    default:
      return state;
  }
}

// ================ Action creators ================ //

export const searchFeaturedListingsRequest = area => ({
  payload: { area },
  type: SEARCH_FEATURED_LISTINGS_REQUEST,
});

export const searchFeaturedListingsSuccess = (response, area) => ({
  type: SEARCH_FEATURED_LISTINGS_SUCCESS,
  payload: { data: response.data, area },
});

export const searchFeaturedListingsError = (e, area) => ({
  area,
  type: SEARCH_FEATURED_LISTINGS_ERROR,
  error: true,
  payload: e,
});

// ================ Thunks ================ //

export const fetchFeaturedListings = (
  params = { area: 'canggu', bounds: customLocationBounds[0].bounds }
) => async (dispatch, getState, sdk) => {
  const { area = 'canggu', ...queryParams } = params;
  const selectedIds = featuredListingIdsByArea[area];
  try {
    dispatch(searchFeaturedListingsRequest(area));
    const query = {
      ...(selectedIds ? { ids: selectedIds.join(',') } : { ...queryParams, pub_featured: true }),
      perPage: 3,
      include: ['author', 'images'],
      'fields.listing': ['title', 'description', 'geolocation', 'price', 'publicData'],
      'fields.user': ['profile.displayName', 'profile.abbreviatedName'],
      'fields.image': ['variants.landscape-crop2x', 'variants.featured-listing'],
      'imageVariant.featured-listing': sdkUtil.objectQueryString({
        w: 640,
        h: 480,
        fit: 'scale'
      }),
    };
    // Keep photo IDs for swipe navigation, but expose only covers until selected.
    const response = typeof window === 'undefined'
      ? deferListingImages(await sdk.listings.query(query))
      : { data: await post('/api/public-read/listings', { params: query, deferImages: true }) };

    // The API controls query order; restore the intentional provider order without mutating cached data.
    const orderedResponse = selectedIds ? {
      ...response,
      data: { ...response.data, data: selectedIds.map(id => response.data.data.find(l => l.id.uuid === id)).filter(Boolean) },
    } : response;
    dispatch(addMarketplaceEntities(orderedResponse));
    dispatch(searchFeaturedListingsSuccess(orderedResponse, area));
    return orderedResponse;
  } catch (error) {
    return dispatch(searchFeaturedListingsError(storableError(error), area));
  }
};

// A directory failure must not hide the homepage or its featured listings.
export const fetchHomepageServices = (match, currentLocale) => async (dispatch, getState, sdk) => {
  const version = getState()?.hostedAssets?.version;
  const read = async path => {
    const response = version
      ? await sdk.assetByVersion({ path, version })
      : await sdk.assetByAlias({ path, alias: 'latest' });
    return denormalizeAssetData(response.data);
  };
  const localizedPath = constructLocalizedPageAssets({ services: 'services' }, match, currentLocale).services;
  try {
    let data;
    try { data = await read(localizedPath); } catch (error) {
      if (localizedPath === 'content/pages/services.json') throw error;
    }
    if ((!data || !Object.keys(data).length) && localizedPath !== 'content/pages/services.json') {
      data = await read('content/pages/services.json');
    }
    dispatch({ type: SERVICES_LOADED, payload: data || null });
  } catch (error) {
    dispatch({ type: SERVICES_LOADED, payload: null });
    log.error(error, 'homepage-services-fetch-failed');
  }
};

export const loadData = (params, search, config, match, currentLocale) => dispatch => {
  const assetMap = {
    landingPage: ASSET_NAME,
  };

  const pageAsset = constructLocalizedPageAssets(assetMap, match, currentLocale);

  const pageAssetsPromise = dispatch(fetchPageAssets(pageAsset, true));
  const featuredListingsPromise = dispatch(fetchFeaturedListings());

  return Promise.all([pageAssetsPromise, featuredListingsPromise, dispatch(fetchHomepageServices(match, currentLocale))])
    .then(() => true)
    .catch(e => {
      log.error(e, 'landing-page-fetch-failed');
    });
};
