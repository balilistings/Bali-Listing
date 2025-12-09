/**
 *  TopbarMobileMenu prints the menu content for authenticated user or
 * shows login actions for those who are not authenticated.
 */
import React from 'react';
import classNames from 'classnames';

import { ACCOUNT_SETTINGS_PAGES } from '../../../../routing/routeConfiguration';
import { FormattedMessage } from '../../../../util/reactIntl';
import { ensureCurrentUser } from '../../../../util/data';
import { checkIsCustomer } from '../../../../util/userHelpers';

import {
  AvatarLarge,
  AvatarMedium,
  AvatarSmall,
  ExternalLink,
  InlineTextButton,
  NamedLink,
  NotificationBadge,
} from '../../../../components';

import css from './TopbarMobileMenu.module.css';

const CustomLinkComponent = ({ linkConfig, currentPage }) => {
  const { group, text, type, href, route } = linkConfig;
  const getCurrentPageClass = page => {
    const hasPageName = name => currentPage?.indexOf(name) === 0;
    const isCMSPage = pageId => hasPageName('CMSPage') && currentPage === `${page}:${pageId}`;
    const isInboxPage = tab => hasPageName('InboxPage') && currentPage === `${page}:${tab}`;
    const isCurrentPage = currentPage === page;

    return isCMSPage(route?.params?.pageId) || isInboxPage(route?.params?.tab) || isCurrentPage
      ? css.currentPage
      : null;
  };

  // Note: if the config contains 'route' keyword,
  // then in-app linking config has been resolved already.
  if (type === 'internal' && route) {
    // Internal link
    const { name, params, to } = route || {};
    const className = classNames(css.navigationLink, getCurrentPageClass(name));
    return (
      <NamedLink name={name} params={params} to={to} className={className}>
        <span className={css.menuItemBorder} />
        {text}
      </NamedLink>
    );
  }
  return (
    <ExternalLink href={href} className={css.navigationLink}>
      <span className={css.menuItemBorder} />
      {text}
    </ExternalLink>
  );
};

/**
 * Menu for mobile layout (opens through hamburger icon)
 *
 * @component
 * @param {Object} props
 * @param {boolean} props.isAuthenticated
 * @param {string?} props.currentPage
 * @param {boolean} props.currentUserHasListings
 * @param {Object?} props.currentUser API entity
 * @param {number} props.notificationCount
 * @param {Array<Object>} props.customLinks Contains object like { group, text, type, href, route }
 * @param {Function} props.onLogout
 * @returns {JSX.Element} search icon
 */
import LanguageCurrencyMobileMenu from './LanguageCurrencyMobileMenu';

const TopbarMobileMenu = props => {
  const {
    isAuthenticated,
    currentPage,
    inboxTab,
    currentUser,
    notificationCount = 0,
    customLinks,
    onLogout,
    showCreateListingsLink,
    config,
  } = props;

  const user = ensureCurrentUser(currentUser);

  const extraLinks = customLinks.map((linkConfig, index) => {
    return (
      <CustomLinkComponent
        key={`${linkConfig.text}_${index}`}
        linkConfig={linkConfig}
        currentPage={currentPage}
      />
    );
  });

  const currentPageClass = page => {
    const isAccountSettingsPage =
      page === 'AccountSettingsPage' && ACCOUNT_SETTINGS_PAGES.includes(currentPage);
    const isInboxPage = currentPage?.indexOf('InboxPage') === 0 && page?.indexOf('InboxPage') === 0;
    return currentPage === page || isAccountSettingsPage || isInboxPage ? css.currentPage : null;
  };

  if (!isAuthenticated) {
    const login = (
      <NamedLink name="LoginPage" className={css.loginLink}>
        <FormattedMessage id="TopbarMobileMenu.loginLink" />
      </NamedLink>
    );

    // const signupOrLogin = (
    //   <span className={css.authenticationLinks}>
    //     <FormattedMessage id="TopbarMobileMenu.signupOrLogin" values={{ signup, login }} />
    //   </span>
    // );
    return (
      <div className={css.root}>
        <div className={css.content}>
          {/* <div className={css.authenticationGreeting}>
            <FormattedMessage
              id="TopbarMobileMenu.unauthorizedGreeting"
              values={{ lineBreak: <br />, signupOrLogin }}
            />
          </div> */}

          <div className={css.accountLinksWrapper}>
            {/* <NamedLink
            className={classNames(css.inbox, currentPageClass(`InboxPage:${inboxTab}`))}
            name="InboxPage"
            params={{ tab: inboxTab }}
          >
            <span className={css.menuItemBorder} />
            <FormattedMessage id="TopbarMobileMenu.inboxLink" />
            {notificationCountBadge}
          </NamedLink> */}

            <NamedLink
              className={classNames(css.navigationLink, currentPageClass('LoginPage'))}
              name="LoginPage"
            >
              <FormattedMessage id="TopbarMobileMenu.loginLink" />
            </NamedLink>

            <NamedLink
              name="SignupPage"
              className={classNames(css.navigationLink, currentPageClass('SignupPage'))}
            >
              <FormattedMessage id="TopbarMobileMenu.signupLink" />
            </NamedLink>
            <LanguageCurrencyMobileMenu config={config} currentPage={currentPage} />
          </div>

          <div className={css.customLinksWrapper}>{extraLinks}</div>

          <div className={css.spacer} />
        </div>
      </div>
    );
  }

  // const notificationCountBadge =
  //   notificationCount > 0 ? (
  //     <NotificationBadge className={css.notificationBadge} count={notificationCount} />
  //   ) : null;

  const displayName = user.attributes.profile.firstName;

  const manageListingsLinkMaybe = showCreateListingsLink ? (
    <NamedLink
      className={classNames(css.navigationLink, currentPageClass('ManageListingsPage'))}
      name="ManageListingsPage"
    >
      <span className={css.menuItemBorder} />
      <FormattedMessage id="TopbarMobileMenu.yourListingsLink" />
    </NamedLink>
  ) : null;

  const useFavPage = process.env.REACT_APP_FAV_PAGE_ENABLED === 'true';
  const favoriteListingsLinkMaybe =
    checkIsCustomer(currentUser) && useFavPage ? (
      <NamedLink
        className={classNames(css.navigationLink, currentPageClass('FavoriteListingsPage'))}
        name="FavoriteListingsPage"
      >
        <span className={css.menuItemBorder} />
        <FormattedMessage id="TopbarMobileMenu.favoriteListingsPage" />
      </NamedLink>
    ) : null;

  return (
    <div className={css.root}>
      <AvatarMedium className={css.avatar} user={currentUser} />
      <div className={css.content}>
        <span className={css.greeting}>
          <FormattedMessage id="TopbarMobileMenu.greeting" values={{ displayName }} />
        </span>
        <InlineTextButton rootClassName={css.logoutButton} onClick={onLogout}>
          <FormattedMessage id="TopbarMobileMenu.logoutLink" />
        </InlineTextButton>

        <div className={css.accountLinksWrapper}>
          {manageListingsLinkMaybe}
          <NamedLink
            className={classNames(css.navigationLink, currentPageClass('ProfileSettingsPage'))}
            name="ProfileSettingsPage"
          >
            <span className={css.menuItemBorder} />
            <FormattedMessage id="TopbarMobileMenu.profileSettingsLink" />
          </NamedLink>
          <NamedLink
            className={classNames(css.navigationLink, currentPageClass('AccountSettingsPage'))}
            name="AccountSettingsPage"
          >
            <span className={css.menuItemBorder} />
            <FormattedMessage id="TopbarMobileMenu.accountSettingsLink" />
          </NamedLink>
          {favoriteListingsLinkMaybe}
          <LanguageCurrencyMobileMenu config={config} currentPage={currentPage} />
        </div>
        <div className={css.customLinksWrapper}>{extraLinks}</div>
        <div className={css.spacer} />
      </div>
    </div>
  );
};

export default TopbarMobileMenu;
