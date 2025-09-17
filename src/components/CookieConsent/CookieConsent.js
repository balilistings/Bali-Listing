import React, { useState, useEffect } from 'react';
import { shallowEqual, useDispatch, useSelector } from 'react-redux';
import { FormattedMessage } from '../../util/reactIntl';
import { NamedLink } from '../../components';
import { useConfiguration } from '../../context/configurationContext';
import Cookies from 'js-cookie';

import { saveCookieConsent } from '../../ducks/cookieConsent.duck';

import css from './CookieConsent.module.css';

const COOKIE_CONSENT_KEY = 'cookieConsent';

const CookieConsent = () => {
  const [showConsent, setShowConsent] = useState(false);
  const dispatch = useDispatch();
  const currentUser = useSelector(state => state.user.currentUser, shallowEqual);
  const config = useConfiguration();
  const { cookieConsent } = config;

  useEffect(() => {
    if (currentUser && currentUser.attributes?.profile?.protectedData?.cookieConsent) {
      setShowConsent(false);
      return;
    }

    const cookieConsentValue = Cookies.get(COOKIE_CONSENT_KEY);
    const hasConsent = cookieConsentValue === 'accepted' || cookieConsentValue === 'rejected';

    setShowConsent(!hasConsent);
  }, [currentUser]);

  const handleAccept = () => {
    const consentData = {
      accepted: true,
      timestamp: new Date().toISOString(),
    };

    if (currentUser) {
      dispatch(saveCookieConsent(consentData));
    } else {
      Cookies.set(COOKIE_CONSENT_KEY, 'accepted', { expires: 365 });
    }

    setShowConsent(false);
  };

  const handleReject = () => {
    const consentData = {
      accepted: false,
      timestamp: new Date().toISOString(),
    };

    if (currentUser) {
      dispatch(saveCookieConsent(consentData));
    } else {
      Cookies.set(COOKIE_CONSENT_KEY, 'rejected', { expires: 365 });
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
          <button className={css.rejectButton} onClick={handleReject}>
            {<FormattedMessage id="CookieConsent.reject" />}
          </button>
          <button className={css.acceptButton} onClick={handleAccept}>
            {<FormattedMessage id="CookieConsent.accept" />}
          </button>
        </div>
      </div>
    </div>
  );
};

export default CookieConsent;
