
const FETCH_CONVERSION_RATE_REQUEST = 'app/currency/FETCH_CONVERSION_RATE_REQUEST';
const FETCH_CONVERSION_RATE_SUCCESS = 'app/currency/FETCH_CONVERSION_RATE_SUCCESS';
const FETCH_CONVERSION_RATE_ERROR = 'app/currency/FETCH_CONVERSION_RATE_ERROR';

const SET_CURRENCY = 'app/currency/SET_CURRENCY';

const initialState = {
  conversionRate: {
    USD: 0.00005982,
    IDR: 1,
  },
  fetchConversionRateInProgress: false,
  fetchConversionRateError: null,
  selectedCurrency: 'IDR',
};

export default function reducer(state = initialState, action = {}) {
  switch (action.type) {
    case FETCH_CONVERSION_RATE_REQUEST:
      return {
        ...state,
        fetchConversionRateInProgress: true,
        fetchConversionRateError: null,
      };
    case FETCH_CONVERSION_RATE_SUCCESS:
      return {
        ...state,
        conversionRate: action.payload,
        fetchConversionRateInProgress: false,
      };
    case FETCH_CONVERSION_RATE_ERROR:
      return {
        ...state,
        fetchConversionRateInProgress: false,
        fetchConversionRateError: action.payload,
      };
    case SET_CURRENCY:
      return {
        ...state,
        selectedCurrency: action.payload,
      };
    default:
      return state;
  }
}

export const fetchConversionRateRequest = () => ({ type: FETCH_CONVERSION_RATE_REQUEST });
export const fetchConversionRateSuccess = rate => ({
  type: FETCH_CONVERSION_RATE_SUCCESS,
  payload: rate,
});
export const fetchConversionRateError = error => ({
  type: FETCH_CONVERSION_RATE_ERROR,
  payload: error,
});

export const setCurrency = currency => ({
  type: SET_CURRENCY,
  payload: currency,
});

export const fetchConversionRate = () => (dispatch, getState, sdk) => {
  dispatch(fetchConversionRateRequest());
  return sdk.currency.getConversionRate()
    .then(response => {
      dispatch(fetchConversionRateSuccess(response.data));
      return response;
    })
    .catch(e => {
      dispatch(fetchConversionRateError(e));
      throw e;
    });
};
