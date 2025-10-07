import React from 'react';
import { FormattedMessage } from '../../util/reactIntl';
import classNames from 'classnames';
import { connect } from 'react-redux';
import { ACCOUNT_SETTINGS_PAGES } from '../../routing/routeConfiguration';
import { LinkTabNavHorizontal } from '../../components';
import { selectCurrentUser } from '../../ducks/user.duck';

import css from './UserNav.module.css';
const checkIsProvider = (currentUser) => {
  if (!currentUser) return false;
  
  const publicData = currentUser?.attributes?.profile?.publicData || {};
  return (
    publicData.userType === 'provider' ||
    publicData.isProvider === true ||
    (Array.isArray(publicData.roles) && publicData.roles.includes('provider')) ||
    currentUser?.attributes?.role === 'provider'
  );
};

/**
 * @param {Object} props
 * @param {string} [props.className]
 * @param {string} [props.rootClassName]
 * @param {string} props.currentPage
 * @param {boolean} [props.showManageListingsLink]
 * @param {boolean} [props.showFavoriteListingPage]
 */
const UserNav = props => {
  const {
    className,
    rootClassName,
    currentPage,
    showManageListingsLink = false,
    showFavoriteListingPage = true,
    currentUser,
  } = props;

  const isProvider = checkIsProvider(currentUser);

  const classes = classNames(rootClassName || css.root, className);

  const manageListingsTabMaybe = showManageListingsLink
    ? [
        {
          text: <FormattedMessage id="UserNav.yourListings" />,
          selected: currentPage === 'ManageListingsPage',
          linkProps: {
            name: 'ManageListingsPage',
          },
        },
      ]
    : [];

  const favoriteTabMaybe = showFavoriteListingPage && !isProvider
    ? [
        {
          text: <FormattedMessage id="Favorite Listings" />,
          selected: currentPage === 'FavoriteListingsPage',
          disabled: false,
          linkProps: {
            name: 'FavoriteListingsPage',
          },
        },
      ]
    : [];

  const tabs = [
    ...manageListingsTabMaybe,
    ...favoriteTabMaybe,
    {
      text: <FormattedMessage id="UserNav.profileSettings" />,
      selected: currentPage === 'ProfileSettingsPage',
      disabled: false,
      linkProps: {
        name: 'ProfileSettingsPage',
      },
    },
    {
      text: <FormattedMessage id="UserNav.accountSettings" />,
      selected: ACCOUNT_SETTINGS_PAGES.includes(currentPage),
      disabled: false,
      linkProps: {
        name: 'ContactDetailsPage',
      },
    },
  ];

  return (
    <LinkTabNavHorizontal
      className={classes}
      tabRootClassName={css.tab}
      tabs={tabs}
      skin="dark"
    />
  );
};
  
const mapStateToProps = state => ({
  currentUser: selectCurrentUser(state),
});

export default connect(mapStateToProps)(UserNav);