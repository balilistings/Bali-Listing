import { addMarketplaceEntities } from '../../ducks/marketplaceData.duck';
import { fetchCurrentUser } from '../../ducks/user.duck';
import { types as sdkTypes, createImageVariantConfig } from '../../util/sdkLoader';
import { PROFILE_PAGE_PENDING_APPROVAL_VARIANT, parse } from '../../util/urlHelpers';
import { denormalisedResponseEntities } from '../../util/data';
import { storableError } from '../../util/errors';
import { hasPermissionToViewData, isUserAuthorized } from '../../util/userHelpers';
import { validate as uuidValidate } from 'uuid';
import { apiBaseUrl, get } from '../../util/api';
import { convertUnitToSubUnit, unitDivisor } from '../../util/currency';
import { constructQueryParamName, isOriginInUse } from '../../util/search';

const { UUID } = sdkTypes;

const RESULT_PAGE_SIZE = 24;

// ================ Helper functions ================ //

const priceSearchParams = (priceParam, config) => {
  const inSubunits = value => convertUnitToSubUnit(value, unitDivisor(config.currency));
  const values = priceParam ? priceParam.split(',') : [];
  return priceParam && values.length === 2
    ? {
        price: [inSubunits(values[0]), inSubunits(values[1]) + 1].join(','),
      }
    : {};
};

const rentPriceSearchParams = (weeklyPriceParam, monthlyPriceParam, yearlyPriceParam) => {
  const formatPriceRange = priceParam => {
    if (!priceParam) {
      return null;
    }
    const splitted = priceParam.split(',');
    const min = parseInt(splitted[0]);
    const max = parseInt(splitted[1]) + 1;
    return [min, max].join(',');
  };

  return {
    pub_weekprice: formatPriceRange(weeklyPriceParam),
    pub_monthprice: formatPriceRange(monthlyPriceParam),
    pub_yearprice: formatPriceRange(yearlyPriceParam),
  };
};

const omitInvalidCategoryParams = (params, config) => {
  const categoryConfig = config.search.defaultFilters?.find(f => f.schemaType === 'category');
  const categories = config.categoryConfiguration.categories;
  const { key: prefix, scope } = categoryConfig || {};
  const categoryParamPrefix = constructQueryParamName(prefix, scope);

  const validURLParamForCategoryData = (prefix, categories, level, params) => {
    const levelKey = `${categoryParamPrefix}${level}`;
    const levelValue =
      typeof params?.[levelKey] !== 'undefined' ? `${params?.[levelKey]}` : undefined;
    const foundCategory = categories.find(cat => cat.id === levelValue);
    const subcategories = foundCategory?.subcategories || [];
    return foundCategory && subcategories.length > 0
      ? {
          [levelKey]: levelValue,
          ...validURLParamForCategoryData(prefix, subcategories, level + 1, params),
        }
      : foundCategory
      ? { [levelKey]: levelValue }
      : {};
  };

  const categoryKeys = validURLParamForCategoryData(prefix, categories, 1, params);
  const nonCategoryKeys = Object.entries(params).reduce(
    (picked, [k, v]) => (k.startsWith(categoryParamPrefix) ? picked : { ...picked, [k]: v }),
    {}
  );

  return { ...nonCategoryKeys, ...categoryKeys };
};

// ================ Action types ================ //

export const SET_INITIAL_STATE = 'app/ProfilePage/SET_INITIAL_STATE';

export const SHOW_USER_REQUEST = 'app/ProfilePage/SHOW_USER_REQUEST';
export const SHOW_USER_SUCCESS = 'app/ProfilePage/SHOW_USER_SUCCESS';
export const SHOW_USER_ERROR = 'app/ProfilePage/SHOW_USER_ERROR';

export const QUERY_LISTINGS_REQUEST = 'app/ProfilePage/QUERY_LISTINGS_REQUEST';
export const QUERY_LISTINGS_SUCCESS = 'app/ProfilePage/QUERY_LISTINGS_SUCCESS';
export const QUERY_LISTINGS_ERROR = 'app/ProfilePage/QUERY_LISTINGS_ERROR';

export const QUERY_REVIEWS_REQUEST = 'app/ProfilePage/QUERY_REVIEWS_REQUEST';
export const QUERY_REVIEWS_SUCCESS = 'app/ProfilePage/QUERY_REVIEWS_SUCCESS';
export const QUERY_REVIEWS_ERROR = 'app/ProfilePage/QUERY_REVIEWS_ERROR';

export const SET_LAST_SLUG = 'app/ProfilePage/SET_LAST_SLUG';

// ================ Reducer ================ //

const initialState = {
  userId: null,
  userListingRefs: [],
  pagination: null,
  userShowError: null,
  queryListingsError: null,
  reviews: [],
  queryReviewsError: null,
  lastSlug: null,
};

export default function profilePageReducer(state = initialState, action = {}) {
  const { type, payload } = action;
  switch (type) {
    case SET_INITIAL_STATE:
      return { ...initialState };
    case SHOW_USER_REQUEST:
      return { ...state, userShowError: null, userId: payload.userId };
    case SHOW_USER_SUCCESS:
      return state;
    case SHOW_USER_ERROR:
      return { ...state, userShowError: payload };

    case QUERY_LISTINGS_REQUEST:
      return {
        ...state,

        // Empty listings only when user id changes
        userListingRefs: payload.userId === state.userId ? state.userListingRefs : [],
        pagination: payload.userId === state.userId ? state.pagination : null,
        queryListingsError: null,
      };
    case QUERY_LISTINGS_SUCCESS:
      const listingRefs = payload.data.data
        .filter(l => !l.attributes.deleted)
        .map(l => ({ id: l.id, type: 'listing' }));
      return { ...state, userListingRefs: listingRefs, pagination: payload.data.meta };
    case QUERY_LISTINGS_ERROR:
      return { ...state, userListingRefs: [], pagination: null, queryListingsError: payload };
    case QUERY_REVIEWS_REQUEST:
      return { ...state, queryReviewsError: null };
    case QUERY_REVIEWS_SUCCESS:
      return { ...state, reviews: payload };
    case QUERY_REVIEWS_ERROR:
      return { ...state, reviews: [], queryReviewsError: payload };

    case SET_LAST_SLUG:
      return { ...state, lastSlug: payload };

    default:
      return state;
  }
}

// ================ Action creators ================ //

export const setInitialState = () => ({
  type: SET_INITIAL_STATE,
});

export const showUserRequest = userId => ({
  type: SHOW_USER_REQUEST,
  payload: { userId },
});

export const showUserSuccess = () => ({
  type: SHOW_USER_SUCCESS,
});

export const showUserError = e => ({
  type: SHOW_USER_ERROR,
  error: true,
  payload: e,
});

export const queryListingsRequest = userId => ({
  type: QUERY_LISTINGS_REQUEST,
  payload: { userId },
});

export const queryListingsSuccess = response => ({
  type: QUERY_LISTINGS_SUCCESS,
  payload: { data: response.data },
});

export const queryListingsError = e => ({
  type: QUERY_LISTINGS_ERROR,
  error: true,
  payload: e,
});

export const queryReviewsRequest = () => ({
  type: QUERY_REVIEWS_REQUEST,
});

export const queryReviewsSuccess = reviews => ({
  type: QUERY_REVIEWS_SUCCESS,
  payload: reviews,
});

export const queryReviewsError = e => ({
  type: QUERY_REVIEWS_ERROR,
  error: true,
  payload: e,
});

// ================ Thunks ================ //

export const queryUserListings = (userId, config, ownProfileOnly = false, searchParams) => (
  dispatch,
  getState,
  sdk
) => {
  dispatch(queryListingsRequest(userId));

  const {
    aspectWidth = 1,
    aspectHeight = 1,
    variantPrefix = 'listing-card',
  } = config.layout.listingImage;
  const aspectRatio = aspectHeight / aspectWidth;

  const {
    perPage,
    page,
    price,
    pub_weekprice,
    pub_monthprice,
    pub_yearprice,
    ...restOfParams
  } = searchParams;

  const priceMaybe = priceSearchParams(price, config);
  const rentPriceMaybe = rentPriceSearchParams(pub_weekprice, pub_monthprice, pub_yearprice);

  const queryParams = {
    include: ['author', 'images'],
    'fields.listing': ['title', 'geolocation', 'price', 'deleted', 'state', 'publicData'],
    'fields.image': [
      `variants.${variantPrefix}`,
      `variants.${variantPrefix}-2x`,
      'variants.landscape-crop2x',
    ],
    ...createImageVariantConfig(`${variantPrefix}`, 400, aspectRatio),
    ...createImageVariantConfig(`${variantPrefix}-2x`, 800, aspectRatio),
    perPage,
    page,
    ...omitInvalidCategoryParams(restOfParams, config),
    ...priceMaybe,
    ...rentPriceMaybe,
  };

  const listingsPromise = ownProfileOnly
    ? sdk.ownListings.query({
        states: ['published'],
        ...queryParams,
      })
    : sdk.listings.query({
        author_id: userId,
        ...queryParams,
      });

  return listingsPromise
    .then(response => {
      dispatch(addMarketplaceEntities(response));
      dispatch(queryListingsSuccess(response));
      return response;
    })
    .catch(e => dispatch(queryListingsError(storableError(e))));
};

export const queryUserReviews = userId => (dispatch, getState, sdk) => {
  sdk.reviews
    .query({
      subject_id: userId,
      state: 'public',
      include: ['author', 'author.profileImage'],
      'fields.image': ['variants.square-small', 'variants.square-small2x'],
    })
    .then(response => {
      const reviews = denormalisedResponseEntities(response);
      dispatch(queryReviewsSuccess(reviews));
    })
    .catch(e => dispatch(queryReviewsError(e)));
};

export const showUser = (userId, config) => (dispatch, getState, sdk) => {
  dispatch(showUserRequest(userId));
  return sdk.users
    .show({
      id: userId,
      include: ['profileImage'],
      'fields.image': ['variants.square-small', 'variants.square-small2x'],
    })
    .then(response => {
      const userFields = config?.user?.userFields;
      const sanitizeConfig = { userFields };
      dispatch(addMarketplaceEntities(response, sanitizeConfig));
      dispatch(showUserSuccess());
      return response;
    })
    .catch(e => dispatch(showUserError(storableError(e))));
};

const isCurrentUser = (userId, cu) => userId?.uuid === cu?.id?.uuid;

export const loadData = (params, search, config) => (dispatch, getState, sdk) => {
  const slug = params.id;
  const isPreviewForCurrentUser = params.variant === PROFILE_PAGE_PENDING_APPROVAL_VARIANT;
  const state = getState();
  const currentUser = state?.user?.currentUser;
  const lastSlug = state.ProfilePage.lastSlug;
  const fetchCurrentUserOptions = {
    updateHasListings: false,
    updateNotifications: false,
  };
  const currentUserId = state.ProfilePage.userId;

  // Clear state so that previously loaded data is not visible
  // in case this page load fails.
  // However, if we are navigating on the same profile (e.g. pagination),
  // we don't want to clear the state as it would trigger a remount of the page.
  const isSameUser = (lastSlug && lastSlug === slug) || currentUserId?.uuid === slug;
  if (!isSameUser) {
    dispatch(setInitialState());
    dispatch({ type: SET_LAST_SLUG, payload: slug });
  }

  const queryParams = parse(search, {
    latlng: ['origin'],
    latlngBounds: ['bounds'],
  });

  const { page = 1, address, origin, ...rest } = queryParams;
  const originMaybe = isOriginInUse(config) && origin ? { origin } : {};

  const searchParams = {
    ...rest,
    ...originMaybe,
    page,
    perPage: RESULT_PAGE_SIZE,
  };

  const loadProfileData = userId => {
    if (isPreviewForCurrentUser) {
      return dispatch(fetchCurrentUser(fetchCurrentUserOptions)).then(() => {
        if (isCurrentUser(userId, currentUser) && isUserAuthorized(currentUser)) {
          // Scenario: 'active' user somehow tries to open a link for "variant" profile
          return Promise.all([
            dispatch(showUser(userId, config)),
            dispatch(queryUserListings(userId, config, false, searchParams)),
            dispatch(queryUserReviews(userId)),
          ]);
        } else if (isCurrentUser(userId, currentUser)) {
          // Handle a scenario, where user (in pending-approval state)
          // tries to see their own profile page.
          // => just set userId to state
          return dispatch(showUserRequest(userId));
        } else {
          return Promise.resolve({});
        }
      });
    }

    // Fetch data for plain profile page.
    // Note 1: returns 404s if user is not 'active'.
    // Note 2: In private marketplace mode, this page won't fetch data if the user is unauthorized
    const isAuthorized = currentUser && isUserAuthorized(currentUser);
    const isPrivateMarketplace = config.accessControl.marketplace.private === true;
    const hasNoViewingRights = currentUser && !hasPermissionToViewData(currentUser);
    const canFetchData = !isPrivateMarketplace || (isPrivateMarketplace && isAuthorized);
    // On a private marketplace, show active (approved) current user's own page
    // even if they don't have viewing rights
    const canFetchOwnProfileOnly =
      isPrivateMarketplace &&
      isAuthorized &&
      hasNoViewingRights &&
      isCurrentUser(userId, currentUser);

    if (!canFetchData) {
      return Promise.resolve();
    } else if (canFetchOwnProfileOnly) {
      return Promise.all([
        dispatch(fetchCurrentUser(fetchCurrentUserOptions)),
        dispatch(queryUserListings(userId, config, canFetchOwnProfileOnly, searchParams)),
        dispatch(showUserRequest(userId)),
      ]);
    }

    return Promise.all([
      dispatch(fetchCurrentUser(fetchCurrentUserOptions)),
      dispatch(showUser(userId, config)),
      dispatch(queryUserListings(userId, config, false, searchParams)),
      dispatch(queryUserReviews(userId)),
    ]);
  };

  if (uuidValidate(slug)) {
    return loadProfileData(new UUID(slug));
  } else {
    return get(`/api/users/by-slug/${slug}`)
      .then(data => {
        return loadProfileData(new UUID(data.userId));
      })
      .catch(e => {
        dispatch(showUserError(storableError(e)));
      });
  }
};
