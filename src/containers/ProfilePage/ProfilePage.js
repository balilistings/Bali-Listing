import React, { useEffect, useState } from 'react';
import { shallowEqual, useSelector } from 'react-redux';
import classNames from 'classnames';
import { useLocation, useHistory } from 'react-router-dom';

import { useConfiguration } from '../../context/configurationContext';
import { useRouteConfiguration } from '../../context/routeConfigurationContext';
import { FormattedMessage, useIntl } from '../../util/reactIntl';
import {
  REVIEW_TYPE_OF_PROVIDER,
  REVIEW_TYPE_OF_CUSTOMER,
  SCHEMA_TYPE_MULTI_ENUM,
  SCHEMA_TYPE_TEXT,
  SCHEMA_TYPE_YOUTUBE,
  propTypes,
} from '../../util/types';
import {
  NO_ACCESS_PAGE_USER_PENDING_APPROVAL,
  NO_ACCESS_PAGE_VIEW_LISTINGS,
  PROFILE_PAGE_PENDING_APPROVAL_VARIANT,
} from '../../util/urlHelpers';
import {
  isErrorNoViewingPermission,
  isErrorUserPendingApproval,
  isForbiddenError,
  isNotFoundError,
} from '../../util/errors';
import { pickCustomFieldProps } from '../../util/fieldHelpers';
import {
  getCurrentUserTypeRoles,
  hasPermissionToViewData,
  isUserAuthorized,
} from '../../util/userHelpers';
import { richText } from '../../util/richText';

import { isScrollingDisabled } from '../../ducks/ui.duck';
import { getMarketplaceEntities } from '../../ducks/marketplaceData.duck';
import {
  Heading,
  H2,
  H4,
  Page,
  AvatarLarge,
  NamedLink,
  ButtonTabNavHorizontal,
  NamedRedirect,
} from '../../components';
import Reviews from '../../components/Reviews/Reviews';
import LayoutSideNavigation from '../../components/LayoutComposer/LayoutSideNavigation/LayoutSideNavigation';
import IconCollection from '../../components/IconCollection/IconCollection';
import { createResourceLocatorString } from '../../util/routes';

import TopbarContainer from '../../containers/TopbarContainer/TopbarContainer';
import FooterContainer from '../../containers/FooterContainer/FooterContainer';
import NotFoundPage from '../../containers/NotFoundPage/NotFoundPage';

import css from './ProfilePage.module.css';
import SectionDetailsMaybe from './SectionDetailsMaybe';
import SectionTextMaybe from './SectionTextMaybe';
import SectionMultiEnumMaybe from './SectionMultiEnumMaybe';
import SectionYoutubeVideoMaybe from './SectionYoutubeVideoMaybe';
import ProfileSearchFilter from './ProfileSearchFilter/ProfileSearchFilter';
import ListingCard from '../../components/ListingCard/ListingCard';
import PaginationLinks from '../../components/PaginationLinks/PaginationLinks';

const MAX_MOBILE_SCREEN_WIDTH = 768;
const MIN_LENGTH_FOR_LONG_WORDS = 20;

export const AsideContent = props => {
  const {
    user,
    displayName,
    showLinkToProfileSettingsPage,
    bio,
    publicData,
    userFieldConfig,
    intl,
    userTypeRoles,
    pagination,
  } = props;

  const isProvider = userTypeRoles.provider;
  const userTypeTranslation = isProvider
    ? intl.formatMessage({ id: 'FieldSelectUserType.providerLabel' })
    : intl.formatMessage({ id: 'FieldSelectUserType.customerLabel' });

  const bioWithLinks = richText(bio, {
    linkify: true,
    longWordMinLength: MIN_LENGTH_FOR_LONG_WORDS,
    longWordClass: css.longWord,
  });

  const listingsCount = pagination?.totalItems || 0;

  return (
    <div className={css.asideContent}>
      <div className={css.asideHeader} />
      <div className={css.asideMain}>
        <div className={css.avatarContainer}>
          <AvatarLarge className={css.avatar} user={user} disableProfileLink />
          <div className={css.badge}>
            <IconCollection name="icon_profile_badge" />
          </div>
        </div>

        <div className={css.userInfo}>
          <p className={css.helloText}>
            <FormattedMessage id="ProfilePage.hello" />
          </p>
          <H2 as="h1" className={css.displayName}>
            {displayName}
          </H2>
          <p className={css.userType}>{userTypeTranslation}</p>
        </div>

        {bio ? (
          <div className={css.section}>
            <h3 className={css.sectionTitle}>
              <FormattedMessage id="ProfilePage.aboutUser" />
            </h3>
            <p className={css.bioText}>{bioWithLinks}</p>
          </div>
        ) : null}

        {publicData?.companyname ? (
          <div className={css.section}>
            <h3 className={css.sectionTitle}>
              <FormattedMessage id="ProfilePage.companyName" />
            </h3>
            <p className={css.sectionValue}>{publicData.companyname}</p>
          </div>
        ) : null}

        {publicData?.role ? (
          <div className={css.section}>
            <h3 className={css.sectionTitle}>
              <FormattedMessage id="ProfilePage.role" />
            </h3>
            <p className={css.sectionValue}>
              {publicData.role === 'company' ? (
                <FormattedMessage id="SignupForm.role.company" />
              ) : (
                publicData.role
              )}
            </p>
          </div>
        ) : null}

        <div className={css.listingsCard}>
          <div className={css.listingsIconContainer}>
            <IconCollection name="typeIcon" />
          </div>
          <span className={css.listingsCount}>{listingsCount}</span>
          <span className={css.listingsLabel}>
            <FormattedMessage id="ProfilePage.listings" />
          </span>
        </div>

        {showLinkToProfileSettingsPage ? (
          <>
            <NamedLink className={css.editLinkMobile} name="ProfileSettingsPage">
              <FormattedMessage id="ProfilePage.editProfileLinkMobile" />
            </NamedLink>
            <NamedLink className={css.editLinkDesktop} name="ProfileSettingsPage">
              <FormattedMessage id="ProfilePage.editProfileLinkDesktop" />
            </NamedLink>
          </>
        ) : null}
      </div>
    </div>
  );
};

export const ReviewsErrorMaybe = props => {
  const { queryReviewsError } = props;
  return queryReviewsError ? (
    <p className={css.error}>
      <FormattedMessage id="ProfilePage.loadingReviewsFailed" />
    </p>
  ) : null;
};

export const MobileReviews = props => {
  const { reviews, queryReviewsError } = props;
  const reviewsOfProvider = reviews.filter(r => r.attributes.type === REVIEW_TYPE_OF_PROVIDER);
  const reviewsOfCustomer = reviews.filter(r => r.attributes.type === REVIEW_TYPE_OF_CUSTOMER);
  return (
    <div className={css.mobileReviews}>
      <H4 as="h2" className={css.mobileReviewsTitle}>
        <FormattedMessage
          id="ProfilePage.reviewsFromMyCustomersTitle"
          values={{ count: reviewsOfProvider.length }}
        />
      </H4>
      <ReviewsErrorMaybe queryReviewsError={queryReviewsError} />
      <Reviews reviews={reviewsOfProvider} />
      <H4 as="h2" className={css.mobileReviewsTitle}>
        <FormattedMessage
          id="ProfilePage.reviewsAsACustomerTitle"
          values={{ count: reviewsOfCustomer.length }}
        />
      </H4>
      <ReviewsErrorMaybe queryReviewsError={queryReviewsError} />
      <Reviews reviews={reviewsOfCustomer} />
    </div>
  );
};

export const DesktopReviews = props => {
  const { reviews, queryReviewsError, userTypeRoles } = props;
  const { customer: isCustomerUserType, provider: isProviderUserType } = userTypeRoles;

  const initialReviewState = !isProviderUserType
    ? REVIEW_TYPE_OF_CUSTOMER
    : REVIEW_TYPE_OF_PROVIDER;
  const [showReviewsType, setShowReviewsType] = useState(initialReviewState);

  const reviewsOfProvider = reviews.filter(r => r.attributes.type === REVIEW_TYPE_OF_PROVIDER);
  const reviewsOfCustomer = reviews.filter(r => r.attributes.type === REVIEW_TYPE_OF_CUSTOMER);
  const isReviewTypeProviderSelected = showReviewsType === REVIEW_TYPE_OF_PROVIDER;
  const isReviewTypeCustomerSelected = showReviewsType === REVIEW_TYPE_OF_CUSTOMER;
  const providerReviewsMaybe = isProviderUserType
    ? [
        {
          text: (
            <Heading as="h3" rootClassName={css.desktopReviewsTitle}>
              <FormattedMessage
                id="ProfilePage.reviewsFromMyCustomersTitle"
                values={{ count: reviewsOfProvider.length }}
              />
            </Heading>
          ),
          selected: isReviewTypeProviderSelected,
          onClick: () => setShowReviewsType(REVIEW_TYPE_OF_PROVIDER),
        },
      ]
    : [];

  const customerReviewsMaybe = isCustomerUserType
    ? [
        {
          text: (
            <Heading as="h3" rootClassName={css.desktopReviewsTitle}>
              <FormattedMessage
                id="ProfilePage.reviewsAsACustomerTitle"
                values={{ count: reviewsOfCustomer.length }}
              />
            </Heading>
          ),
          selected: isReviewTypeCustomerSelected,
          onClick: () => setShowReviewsType(REVIEW_TYPE_OF_CUSTOMER),
        },
      ]
    : [];
  const desktopReviewTabs = [...providerReviewsMaybe, ...customerReviewsMaybe];

  return (
    <div className={css.desktopReviews}>
      <div className={css.desktopReviewsWrapper}>
        <ButtonTabNavHorizontal className={css.desktopReviewsTabNav} tabs={desktopReviewTabs} />

        <ReviewsErrorMaybe queryReviewsError={queryReviewsError} />

        {isReviewTypeProviderSelected ? (
          <Reviews reviews={reviewsOfProvider} />
        ) : (
          <Reviews reviews={reviewsOfCustomer} />
        )}
      </div>
    </div>
  );
};

export const CustomUserFields = props => {
  const { publicData, metadata, userFieldConfig } = props;

  const shouldPickUserField = fieldConfig => fieldConfig?.showConfig?.displayInProfile !== false;
  const propsForCustomFields =
    pickCustomFieldProps(publicData, metadata, userFieldConfig, 'userType', shouldPickUserField) ||
    [];

  return (
    <>
      <SectionDetailsMaybe {...props} />
      {propsForCustomFields.map(customFieldProps => {
        const { schemaType, key, ...fieldProps } = customFieldProps;
        return schemaType === SCHEMA_TYPE_MULTI_ENUM ? (
          <SectionMultiEnumMaybe key={key} {...fieldProps} />
        ) : schemaType === SCHEMA_TYPE_TEXT ? (
          <SectionTextMaybe key={key} {...fieldProps} />
        ) : schemaType === SCHEMA_TYPE_YOUTUBE ? (
          <SectionYoutubeVideoMaybe key={key} {...fieldProps} />
        ) : null;
      })}
    </>
  );
};

export const MainContent = props => {
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  const {
    userShowError,
    displayName,
    listings,
    pagination,
    queryListingsError,
    reviews = [],
    queryReviewsError,
    intl,
    hideReviews,
    userTypeRoles,
    params,
    routes,
  } = props;

  const history = useHistory();
  const location = useLocation();

  const handleFilterChange = newQueryParams => {
    history.push(createResourceLocatorString('ProfilePage', routes, params, newQueryParams));
  };

  const hasListings = listings.length > 0;
  const hasMatchMedia = typeof window !== 'undefined' && window?.matchMedia;
  const isMobileLayout =
    mounted && hasMatchMedia
      ? window.matchMedia(`(max-width: ${MAX_MOBILE_SCREEN_WIDTH}px)`)?.matches
      : true;

  const paginationLinks =
    pagination && pagination.totalPages > 1 ? (
      <PaginationLinks
        className={css.pagination}
        pageName="ProfilePage"
        pagePathParams={params}
        pageSearchParams={location.search}
        pagination={pagination}
      />
    ) : null;

  if (userShowError || queryListingsError) {
    return (
      <p className={css.error}>
        <FormattedMessage id="ProfilePage.loadingDataFailed" />
      </p>
    );
  }
  return (
    <div>
      <ProfileSearchFilter onFilterChange={handleFilterChange} />

      {hasListings ? (
        <div className={css.listingsContainer}>
          <H4 as="h2" className={css.listingsTitle}>
            <FormattedMessage id="ProfilePage.listingsTitle" values={{ count: listings.length }} />
          </H4>
          <ul className={css.listings}>
            {listings.map(l => (
              <li className={css.listing} key={l.id.uuid}>
                <ListingCard listing={l} showAuthorInfo={false} />
              </li>
            ))}
          </ul>
          {paginationLinks}
        </div>
      ) : null}
      {hideReviews ? null : isMobileLayout ? (
        <MobileReviews
          reviews={reviews}
          queryReviewsError={queryReviewsError}
          userTypeRoles={userTypeRoles}
        />
      ) : (
        <DesktopReviews
          reviews={reviews}
          queryReviewsError={queryReviewsError}
          userTypeRoles={userTypeRoles}
        />
      )}
    </div>
  );
};

/**
 * ProfilePage
 *
 * @component
 * @param {Object} props
 * @returns {JSX.Element} ProfilePage
 */
const ProfilePage = props => {
  const config = useConfiguration();
  const intl = useIntl();
  const [mounted, setMounted] = useState(false);
  const routes = useRouteConfiguration();

  useEffect(() => {
    setMounted(true);
  }, []);

  const { params: pathParams, staticContext, location } = props;

  const scrollingDisabled = useSelector(isScrollingDisabled);
  const currentUser = useSelector(state => state.user.currentUser, shallowEqual);
  const userId = useSelector(state => state.ProfilePage.userId);
  const userShowError = useSelector(state => state.ProfilePage.userShowError);
  const queryListingsError = useSelector(state => state.ProfilePage.queryListingsError);
  const userListingRefs = useSelector(state => state.ProfilePage.userListingRefs, shallowEqual);
  const pagination = useSelector(state => state.ProfilePage.pagination, shallowEqual);
  const reviews = useSelector(state => state.ProfilePage.reviews, shallowEqual);
  const queryReviewsError = useSelector(state => state.ProfilePage.queryReviewsError);

  const user = useSelector(state => {
    const userMatches = getMarketplaceEntities(state, [{ type: 'user', id: userId }]);
    return userMatches.length === 1 ? userMatches[0] : null;
  });

  const listings = useSelector(
    state => getMarketplaceEntities(state, userListingRefs),
    shallowEqual
  );

  // Show currentUser's data if it's not approved yet
  const isCurrentUser = userId?.uuid === currentUser?.id?.uuid;
  const useCurrentUser =
    isCurrentUser && !(isUserAuthorized(currentUser) && hasPermissionToViewData(currentUser));

  const isVariant = pathParams.variant?.length > 0;
  const isPreview = isVariant && pathParams.variant === PROFILE_PAGE_PENDING_APPROVAL_VARIANT;

  // Stripe's onboarding needs a business URL for each seller, but the profile page can be
  // too empty for the provider at the time they are creating their first listing.
  // To remedy the situation, we redirect Stripe's crawler to the landing page of the marketplace.
  // TODO: When there's more content on the profile page, we should consider by-passing this redirection.
  const searchParams = location?.search;
  const isStorefront = searchParams
    ? new URLSearchParams(searchParams)?.get('mode') === 'storefront'
    : false;
  if (isStorefront) {
    return <NamedRedirect name="LandingPage" />;
  }

  const isCurrentUserProfile = currentUser?.id && currentUser?.id?.uuid === pathParams.id;
  const profileUser = useCurrentUser ? currentUser : user;
  const { bio, displayName, publicData, metadata } = profileUser?.attributes?.profile || {};
  const { userFields } = config.user;
  const isPrivateMarketplace = config.accessControl.marketplace.private === true;
  const isUnauthorizedUser = currentUser && !isUserAuthorized(currentUser);
  const isUnauthorizedOnPrivateMarketplace = isPrivateMarketplace && isUnauthorizedUser;
  const hasUserPendingApprovalError = isErrorUserPendingApproval(userShowError);
  const hasNoViewingRightsUser = currentUser && !hasPermissionToViewData(currentUser);
  const hasNoViewingRightsOnPrivateMarketplace = isPrivateMarketplace && hasNoViewingRightsUser;

  const userTypeRoles = getCurrentUserTypeRoles(config, profileUser);

  const isDataLoaded = isPreview
    ? currentUser != null || userShowError != null
    : hasNoViewingRightsOnPrivateMarketplace
    ? currentUser != null || userShowError != null
    : user != null || userShowError != null;

  const schemaTitleVars = { name: displayName, marketplaceName: config.marketplaceName };
  const schemaTitle = intl.formatMessage({ id: 'ProfilePage.schemaTitle' }, schemaTitleVars);

  if (!isDataLoaded) {
    return null;
  } else if (!isPreview && isNotFoundError(userShowError)) {
    return <NotFoundPage staticContext={staticContext} />;
  } else if (!isPreview && (isUnauthorizedOnPrivateMarketplace || hasUserPendingApprovalError)) {
    return (
      <NamedRedirect
        name="NoAccessPage"
        params={{ missingAccessRight: NO_ACCESS_PAGE_USER_PENDING_APPROVAL }}
      />
    );
  } else if (
    (!isPreview && hasNoViewingRightsOnPrivateMarketplace && !isCurrentUserProfile) ||
    isErrorNoViewingPermission(userShowError)
  ) {
    // Someone without viewing rights on a private marketplace is trying to
    // view a profile page that is not their own – redirect to NoAccessPage
    return (
      <NamedRedirect
        name="NoAccessPage"
        params={{ missingAccessRight: NO_ACCESS_PAGE_VIEW_LISTINGS }}
      />
    );
  } else if (!isPreview && isForbiddenError(userShowError)) {
    // This can happen if private marketplace mode is active, but it's not reflected through asset yet.
    return (
      <NamedRedirect
        name="SignupPage"
        state={{ from: `${location.pathname}${location.search}${location.hash}` }}
      />
    );
  } else if (isPreview && mounted && !isCurrentUserProfile) {
    // Someone is manipulating the URL, redirect to current user's profile page.
    return isCurrentUserProfile === false ? (
      <NamedRedirect name="ProfilePage" params={{ id: currentUser?.id?.uuid }} />
    ) : null;
  } else if ((isPreview || isPrivateMarketplace) && !mounted) {
    // This preview of the profile page is not rendered on server-side
    // and the first pass on client-side should render the same UI.
    return null;
  }
  // This is rendering normal profile page (not preview for pending-approval)
  return (
    <Page
      scrollingDisabled={scrollingDisabled}
      title={schemaTitle}
      schema={{
        '@context': 'http://schema.org',
        '@type': 'ProfilePage',
        name: schemaTitle,
      }}
    >
      <LayoutSideNavigation
        containerClassName={css.container}
        sideNavClassName={css.aside}
        mainColumnClassName={css.mainColumn}
        topbar={<TopbarContainer />}
        sideNav={
          <AsideContent
            user={profileUser}
            showLinkToProfileSettingsPage={mounted && isCurrentUserProfile}
            displayName={displayName}
            bio={bio}
            publicData={publicData}
            userFieldConfig={userFields}
            intl={intl}
            userTypeRoles={userTypeRoles}
            pagination={pagination}
          />
        }
        footer={<FooterContainer />}
      >
        <MainContent
          displayName={displayName}
          userShowError={userShowError}
          hideReviews={hasNoViewingRightsOnPrivateMarketplace}
          intl={intl}
          userTypeRoles={userTypeRoles}
          params={pathParams}
          routes={routes}
          listings={listings}
          pagination={pagination}
          reviews={reviews}
          queryReviewsError={queryReviewsError}
          queryListingsError={queryListingsError}
        />
      </LayoutSideNavigation>
    </Page>
  );
};

export default ProfilePage;
