import React, { useState, useEffect } from 'react';
import classNames from 'classnames';
import { shallowEqual, useDispatch, useSelector } from 'react-redux';
import { FormattedMessage, useIntl } from '../../util/reactIntl';
import { propTypes } from '../../util/types';
import { NamedLink } from '../../components';
import { useConfiguration } from '../../context/configurationContext';
import Cookies from 'js-cookie';

import { saveCookieConsent } from '../../ducks/cookieConsent.duck';

import css from './CookieConsent.module.css';

const COOKIE_CONSENT_KEY = 'cookieConsent';
const USER_COOKIE_CONSENT_KEY = 'userCookieConsent';

const CookieConsent = () => {
  const [showConsent, setShowConsent] = useState(false);
  const dispatch = useDispatch();
  const currentUser = useSelector(state => state.user.currentUser, shallowEqual);
  const config = useConfiguration();
  const { cookieConsent } = config;
  const intl = useIntl();

  useEffect(() => {
    let hasConsent = false;

    if (currentUser && currentUser.attributes?.profile?.protectedData?.cookieConsent) {
      hasConsent = true;
    }
    else {
      const cookieConsent = Cookies.get(COOKIE_CONSENT_KEY);
      if (cookieConsent === 'accepted') {
        hasConsent = true;
      }
    }

    setShowConsent(!hasConsent);
  }, [currentUser]);

  const handleAccept = () => {
    const consentData = {
      accepted: true,
      timestamp: new Date().toISOString(),
    };

    Cookies.set(COOKIE_CONSENT_KEY, 'accepted', { expires: 365 });

    if (currentUser) {
      Cookies.set(USER_COOKIE_CONSENT_KEY, JSON.stringify(consentData), { expires: 365 });
      dispatch(saveCookieConsent(consentData));
    }

    setShowConsent(false);
  };

  if (!showConsent || !cookieConsent?.enabled) {
    return null;
  }

  return (
    <div className={css.cookieConsent}>
      <div className={css.container}>
        <div className={css.content}>
          <p className={css.text}>{<FormattedMessage id="CookieConsent.message" />}</p>
          <div className={css.links}>
            <NamedLink name="PrivacyPolicyPage" className={css.privacyLink}>
              {<FormattedMessage id="CookieConsent.privacyPolicyLink" />}
            </NamedLink>
          </div>
        </div>
        <div className={css.buttonWrapper}>
          <button className={css.acceptButton} onClick={handleAccept}>
            {<FormattedMessage id="CookieConsent.accept" />}
          </button>
        </div>
      </div>
    </div>
  );
};

export default CookieConsent;
