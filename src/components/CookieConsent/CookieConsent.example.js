import React from 'react';
import CookieConsent from './CookieConsent';
import { fakeUser } from '../../util/testData';

export const Empty = {
  component: CookieConsent,
  props: {},
  group: 'components',
};

export const WithCurrentUser = {
  component: CookieConsent,
  props: {
    currentUser: fakeUser,
  },
  group: 'components',
};