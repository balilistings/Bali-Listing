import { fetchPageAssets } from '../../ducks/hostedAssets.duck';
import { addMarketplaceEntities } from '../../ducks/marketplaceData.duck';
import { denormalisedResponseEntities } from '../../util/data';
import { storableError } from '../../util/errors';
import * as log from '../../util/log';
import { getSupportedLocales } from '../../util/translation';
import { customLocationBounds } from '../PageBuilder/SectionBuilder/SectionArticle/PropertyCards';

export const ASSET_NAME = 'landing-page';

const SEARCH_FEATURED_LISTINGS_REQUEST = 'app/LandingPage/SEARCH_FEATURED_LISTINGS_REQUEST';
const SEARCH_FEATURED_LISTINGS_SUCCESS = 'app/LandingPage/SEARCH_FEATURED_LISTINGS_SUCCESS';
const SEARCH_FEATURED_LISTINGS_ERROR = 'app/LandingPage/SEARCH_FEATURED_LISTINGS_ERROR';

// ================ Reducer ================ //

const initialState = {
  featuredListingIds: [],
  featuredListingsInProgress: false,
  featuredListingsError: null,
};

const resultIds = data => data.data.map(l => l.id);

export default function reducer(state = initialState, action = {}) {
  const { type, payload } = action;
  switch (type) {
    case SEARCH_FEATURED_LISTINGS_REQUEST:
      return {
        ...state,
        featuredListingsInProgress: true,
      };

    case SEARCH_FEATURED_LISTINGS_SUCCESS:
      const currentSequence = resultIds(payload.data);

      return {
        ...state,
        featuredListingsInProgress: false,
        featuredListingIds: currentSequence,
      };

    case SEARCH_FEATURED_LISTINGS_ERROR:
      return { ...state, featuredListingsInProgress: false, featuredListingsError: payload };

    default:
      return state;
  }
}

// ================ Action creators ================ //

export const searchFeaturedListingsRequest = () => ({
  type: SEARCH_FEATURED_LISTINGS_REQUEST,
});

export const searchFeaturedListingsSuccess = response => ({
  type: SEARCH_FEATURED_LISTINGS_SUCCESS,
  payload: { data: response.data },
});

export const searchFeaturedListingsError = e => ({
  type: SEARCH_FEATURED_LISTINGS_ERROR,
  error: true,
  payload: e,
});

// ================ Thunks ================ //

export const fetchFeaturedListings = (
  params = { bounds: customLocationBounds[0].bounds }
) => async (dispatch, getState, sdk) => {
  try {
    dispatch(searchFeaturedListingsRequest());
    const response = await sdk.listings.query({
      ...params,
      perPage: 3,
      include: ['author', 'images'],
      'fields.listing': ['title', 'description', 'geolocation', 'price', 'publicData'],
      'fields.user': ['profile.displayName', 'profile.abbreviatedName'],
      'fields.image': ['variants.landscape-crop2x'],
      pub_featured: true,
    });

    dispatch(addMarketplaceEntities(response));
    dispatch(searchFeaturedListingsSuccess(response));
    return response;
  } catch (error) {
    return dispatch(searchFeaturedListingsError(storableError(error)));
  }
};

export const loadData = (params, search, config, match) => dispatch => {
  const urlLocale = match?.params?.locale;

  // If there's a locale in the URL, use it directly
  if (urlLocale) {
    const assetName = `${ASSET_NAME}-${urlLocale}`;
    const pageAsset = { landingPage: `content/pages/${assetName}.json` };

    return dispatch(fetchPageAssets(pageAsset, true))
      .then(() => {
        dispatch(fetchFeaturedListings());
        return true;
      })
      .catch(e => {
        log.error(e, 'landing-page-fetch-failed');
      });
  }

  // If no locale in URL, check if we need to redirect based on saved locale
  const savedLocale = typeof window !== 'undefined' ? localStorage.getItem('locale') : null;
  const useDefaultLocale =
    typeof window !== 'undefined' ? localStorage.getItem('useDefaultLocale') === 'true' : false;

  // Get supported locales dynamically
  const SUPPORTED_LOCALES = getSupportedLocales();
  const DEFAULT_LOCALE = 'en';

  // Check if we would redirect to a locale-prefixed URL
  if (
    savedLocale &&
    SUPPORTED_LOCALES.includes(savedLocale) &&
    savedLocale !== DEFAULT_LOCALE &&
    !useDefaultLocale
  ) {
    // If we would redirect, use the saved locale to fetch content immediately
    const assetName = `${ASSET_NAME}-${savedLocale}`;
    const pageAsset = { landingPage: `content/pages/${assetName}.json` };

    return dispatch(fetchPageAssets(pageAsset, true))
      .then(() => {
        dispatch(fetchFeaturedListings());
        return true;
      })
      .catch(e => {
        log.error(e, 'landing-page-fetch-failed');
      });
  }

  const assetName = ASSET_NAME;
  const pageAsset = { landingPage: `content/pages/${assetName}.json` };

  return dispatch(fetchPageAssets(pageAsset, true))
    .then(() => {
      dispatch(fetchFeaturedListings());
      return true;
    })
    .catch(e => {
      log.error(e, 'landing-page-fetch-failed');
    });
};
