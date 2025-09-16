import { updateProfile } from '../containers/ProfileSettingsPage/ProfileSettingsPage.duck';
import { storableError } from '../util/errors';

// ================ Action types ================ //

export const SAVE_COOKIE_CONSENT_REQUEST = 'app/CookieConsent/SAVE_COOKIE_CONSENT_REQUEST';
export const SAVE_COOKIE_CONSENT_SUCCESS = 'app/CookieConsent/SAVE_COOKIE_CONSENT_SUCCESS';
export const SAVE_COOKIE_CONSENT_ERROR = 'app/CookieConsent/SAVE_COOKIE_CONSENT_ERROR';

// ================ Reducer ================ //

// Cookie consent state is stored in the user's protected data,
// so we don't need separate state for it in this reducer.
// We rely on the ProfileSettingsPage reducer for update status.

const initialState = {};

export default function reducer(state = initialState, action = {}) {
  // We don't need to handle cookie consent specific actions
  // since we're using the ProfileSettingsPage actions for updating the profile.
  return state;
}

// ================ Action creators ================ //

export const saveCookieConsentRequest = () => ({ type: SAVE_COOKIE_CONSENT_REQUEST });
export const saveCookieConsentSuccess = () => ({ type: SAVE_COOKIE_CONSENT_SUCCESS });
export const saveCookieConsentError = e => ({
  type: SAVE_COOKIE_CONSENT_ERROR,
  error: true,
  payload: e,
});

// ================ Thunks ================ //

/**
 * Save cookie consent to the current user's protected data.
 * Uses the existing updateProfile action from ProfileSettingsPage.
 */
export const saveCookieConsent = consentData => (dispatch, getState, sdk) => {
  dispatch(saveCookieConsentRequest());

  // Use the existing updateProfile action from ProfileSettingsPage
  return dispatch(
    updateProfile({
      protectedData: { cookieConsent: consentData },
    })
  )
    .then(response => {
      dispatch(saveCookieConsentSuccess());
      return response;
    })
    .catch(e => {
      dispatch(saveCookieConsentError(storableError(e)));
      throw e;
    });
};