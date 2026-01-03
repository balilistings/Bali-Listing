// ================ Action types ================ //

import { shallowEqual, useSelector } from "react-redux";

export const DISABLE_SCROLLING = 'app/ui/DISABLE_SCROLLING';
export const SET_MOBILE_MENU_OPEN = 'app/ui/SET_MOBILE_MENU_OPEN';

// ================ Reducer ================ //

const initialState = {
  disableScrollRequests: [],
  isMobileMenuOpen: false,
};

export default function reducer(state = initialState, action = {}) {
  const { type, payload } = action;
  switch (type) {
    case DISABLE_SCROLLING: {
      const { componentId, disableScrolling } = payload;
      const disableScrollRequests = state.disableScrollRequests;
      const componentIdExists = disableScrollRequests.find(c => c.componentId === componentId);

      if (componentIdExists) {
        const disableScrollRequestArray = disableScrollRequests.map(c => {
          return c.componentId === componentId ? { ...c, disableScrolling } : c;
        });
        return { ...state, disableScrollRequests: [...disableScrollRequestArray] };
      }

      const disableScrollRequestArray = [
        ...disableScrollRequests,
        { componentId, disableScrolling },
      ];
      return {
        ...state,
        disableScrollRequests: disableScrollRequestArray,
      };
    }

    case SET_MOBILE_MENU_OPEN: {
      return { ...state, isMobileMenuOpen: payload };
    }

    default:
      return state;
  }
}

// ================ Action creators ================ //

export const manageDisableScrolling = (componentId, disableScrolling) => ({
  type: DISABLE_SCROLLING,
  payload: { componentId, disableScrolling },
});

export const setMobileMenuOpen = isOpen => ({
  type: SET_MOBILE_MENU_OPEN,
  payload: isOpen,
});

// ================ Selectors ================ //

export const isScrollingDisabled = state => {
  const { disableScrollRequests } = state.ui;
  return disableScrollRequests.some(r => r.disableScrolling);
};

export const getIsMobileMenuOpen = state => state.ui.isMobileMenuOpen;

export const useIsScrollingDisabled = () => {
  const uiState = useSelector(state => state.ui || {}, shallowEqual);
  const { disableScrollRequests } = uiState;
  return disableScrollRequests.some(r => r.disableScrolling);
};