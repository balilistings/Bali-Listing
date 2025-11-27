import { types as sdkTypes } from '../../util/sdkLoader';
import { storableError } from '../../util/errors';
import { addMarketplaceEntities } from '../../ducks/marketplaceData.duck';
import { getListingDataKey } from './storageKeys';

// ================ Action types ================ //

export const FETCH_LISTING_REQUEST = 'app/HelpWidget/FETCH_LISTING_REQUEST';
export const FETCH_LISTING_SUCCESS = 'app/HelpWidget/FETCH_LISTING_SUCCESS';
export const FETCH_LISTING_ERROR = 'app/HelpWidget/FETCH_LISTING_ERROR';

// ================ Reducer ================ //

const initialState = {
  fetchListingInProgress: false,
  fetchListingError: null,
};

export default function helpWidgetReducer(state = initialState, action = {}) {
  const { type, payload } = action;
  switch (type) {
    case FETCH_LISTING_REQUEST:
      return { ...state, fetchListingInProgress: true, fetchListingError: null };
    case FETCH_LISTING_SUCCESS:
      return { ...state, fetchListingInProgress: false };
    case FETCH_LISTING_ERROR:
      return { ...state, fetchListingInProgress: false, fetchListingError: payload };

    default:
      return state;
  }
}

// ================ Action creators ================ //

export const fetchListingRequest = () => ({ type: FETCH_LISTING_REQUEST });
export const fetchListingSuccess = () => ({ type: FETCH_LISTING_SUCCESS });
export const fetchListingError = e => ({
  type: FETCH_LISTING_ERROR,
  error: true,
  payload: e,
});

// ================ Thunks ================ //

export const fetchListing = (listingId) => (dispatch, getState, sdk) => {
  dispatch(fetchListingRequest());
  const storageKey = getListingDataKey(listingId);

  // Try to load from sessionStorage first
  try {
    const cachedData = typeof window !== 'undefined' ? sessionStorage.getItem(storageKey) : null;
    if (cachedData) {
      const response = JSON.parse(cachedData);
      dispatch(addMarketplaceEntities(response));
      dispatch(fetchListingSuccess());
      return Promise.resolve(response);
    }
  } catch (e) {
    console.warn('Could not load listing data from sessionStorage', e);
  }

  const params = {
    id: new sdkTypes.UUID(listingId),
    include: ['author', 'author.profileImage', 'images'],
    'fields.listing': ['title', 'price', 'publicData'],
    'fields.image': ['variants.scaled-small'],
  };

  return sdk.listings.show(params)
    .then(response => {
      // Save to sessionStorage
      try {
        if (typeof window !== 'undefined') {
          sessionStorage.setItem(storageKey, JSON.stringify(response));
        }
      } catch (e) {
        console.warn('Could not save listing data to sessionStorage', e);
      }

      const entities = response.data;
      // Add to marketplaceData entities
      dispatch(addMarketplaceEntities(response));
      dispatch(fetchListingSuccess());
      return entities;
    })
    .catch(e => {
      dispatch(fetchListingError(storableError(e)));
      // We don't rethrow here to avoid breaking the promise chain if the component doesn't catch
      // but usually it's better to let the component know if needed. 
      // For this case, the component just listens to the store updates (via marketplaceData).
    });
};
