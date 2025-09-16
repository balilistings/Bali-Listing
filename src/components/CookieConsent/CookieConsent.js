import React, { useState, useEffect } from 'react';
import classNames from 'classnames';
import { useDispatch, useSelector } from 'react-redux';
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
  const currentUser = useSelector(state => state.user.currentUser);
  const config = useConfiguration();
  const { cookieConsent } = config;
  const intl = useIntl();

  useEffect(() => {
    // Check if user has already accepted cookies
    let hasConsent = false;
    
    // First check user protected data if user is logged in
    if (currentUser && currentUser.attributes?.profile?.protectedData?.cookieConsent) {
      hasConsent = true;
    } 
    // Then check browser cookies for anonymous users
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
    
    // Store in browser cookie for anonymous users
    Cookies.set(COOKIE_CONSENT_KEY, 'accepted', { expires: 365 });
    
    // If user is logged in, also store in protected data
    if (currentUser) {
      Cookies.set(USER_COOKIE_CONSENT_KEY, JSON.stringify(consentData), { expires: 365 });
      // Dispatch action to update user protected data
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
          <p className={css.text}>
            {cookieConsent.message || <FormattedMessage id="CookieConsent.message" />}
          </p>
          <div className={css.links}>
            <NamedLink name="PrivacyPolicyPage" className={css.privacyLink}>
              {cookieConsent.privacyPolicyLinkText || <FormattedMessage id="CookieConsent.privacyPolicyLink" />}
            </NamedLink>
          </div>
        </div>
        <div className={css.buttonWrapper}>
          <button className={css.acceptButton} onClick={handleAccept}>
            {cookieConsent.acceptButtonText || <FormattedMessage id="CookieConsent.accept" />}
          </button>
        </div>
      </div>
    </div>
  );
};

export default CookieConsent;