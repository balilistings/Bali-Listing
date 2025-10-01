// src/containers/FavoriteListingsPage/FavoriteListingsPage.js
import React, { useState } from 'react';
import { compose } from 'redux';
import { connect } from 'react-redux';

import { FormattedMessage, injectIntl } from '../../util/reactIntl';
import { isScrollingDisabled } from '../../ducks/ui.duck';
import remove from "./img/remove.png";

import { unfavoriteListing, unfavoriteAllListings } from './FavoriteListingsPage.duck';

import {
  H3,
  Page,
  PaginationLinks,
  UserNav,
  LayoutSingleColumn,
  ListingCard,
} from '../../components';

import TopbarContainer from '../TopbarContainer/TopbarContainer';
import FooterContainer from '../../containers/FooterContainer/FooterContainer';

import css from './FavoriteListingsPage.module.css';
import { getListingsById } from '../../ducks/marketplaceData.duck';

export const FavoriteListingsPageComponent = props => {
  const {
    listings,
    pagination,
    queryInProgress,
    queryFavoritesError,
    queryParams,
    scrollingDisabled,
    intl,
    dispatch,
    currentUser,
  } = props;

  const [selectedIds, setSelectedIds] = useState([]);

  // DEBUG (safely inside component): uncomment if you want to see logs
  // console.log('DEBUG FavoriteListingsPage - listings prop:', listings);
  // console.log('DEBUG FavoriteListingsPage - currentUser favorites:', currentUser?.attributes?.profile?.privateData?.favorites);

  const hasListings = Array.isArray(listings) && listings.length > 0;
  const hasPaginationInfo = !!pagination && pagination.totalItems != null;
  const listingsAreLoaded = !queryInProgress && (hasListings || hasPaginationInfo);

  const loadingResults = (
    <div className={css.messagePanel}>
      <H3 as="h2" className={css.heading}>
        <FormattedMessage id="FavoriteListingsPage.loadingFavoriteListings" />
      </H3>
    </div>
  );

  const queryError = (
    <div className={css.messagePanel}>
      <H3 as="h2" className={css.heading}>
        <FormattedMessage id="FavoriteListingsPage.queryError" />
      </H3>
    </div>
  );

  const noResults =
    !queryInProgress && !hasListings ? (
      <H3 as="h1" className={css.heading}>
        <FormattedMessage id="FavoriteListingsPage.noResults" />
      </H3>
    ) : null;

  const handleUnfavoriteAll = async () => {
    if (!dispatch) return;

    const confirmed = window.confirm(
      'Remove ALL favorites from your profile? This cannot be undone.'
    );

    if (!confirmed) return;

    try {
      await dispatch(unfavoriteAllListings());
      setSelectedIds([]);
    } catch (e) {
      console.error('Unfavorite all failed', e);
    }
  };

  const heading =
    listingsAreLoaded && hasListings ? (
      <>
        <H3 as="h1" className={css.heading}>
          <FormattedMessage
            id="Favorite Listings"
            values={{ count: pagination?.totalItems || listings.length }}
          />
        </H3>
      </>
    ) : (
      noResults
    );

  const page = queryParams ? queryParams.page : 1;
  const paginationLinks =
    listingsAreLoaded && pagination && pagination.totalPages > 1 ? (
      <PaginationLinks
        className={css.pagination}
        pageName="FavoriteListingsPage"
        pageSearchParams={{ page }}
        pagination={pagination}
      />
    ) : null;

  const title = intl.formatMessage({ id: 'Favorite Listings' });

  const panelWidth = 62.5;
  const renderSizes = [
    `(max-width: 767px) 100vw`,
    `(max-width: 1920px) ${panelWidth / 2}vw`,
    `${panelWidth / 3}vw`,
  ].join(', ');

  const toggleSelect = id => {
    setSelectedIds(selectedIds =>
      selectedIds.includes(id)
        ? selectedIds.filter(i => i !== id)
        : [...selectedIds, id]
    );
  };

  const handleUnfavoriteSelected = async () => {
    if (dispatch && selectedIds.length > 0) {
      for (const id of selectedIds) {
        await dispatch(unfavoriteListing(id));
      }

      setSelectedIds([]);
    }
  };

  return (
    <Page title={title} scrollingDisabled={scrollingDisabled}>
      <LayoutSingleColumn
        topbar={
          <>
            <TopbarContainer currentPage="FavoriteListingsPage" />
            <UserNav currentPage="FavoriteListingsPage" />
          </>
        }
        footer={<FooterContainer />}
      >
        {queryInProgress ? loadingResults : null}
        {queryFavoritesError ? queryError : null}

        <div className={css.listingPanel}>
          {heading}

          {/* Toolbar */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', padding: '8px 0' }}>
            {selectedIds.length > 0 && (
              <button
                className={css.removeSelected}
                onClick={handleUnfavoriteSelected}
                title={`Unfavorite selected (${selectedIds.length})`}
                style={{ marginLeft: '8px' }}
              >
                <img src={remove} alt="unfavorite selected" />
              </button>
            )}
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', padding: '8px 0' }}>
            {selectedIds.length > 0 && (
            <button
              type="button"
              onClick={handleUnfavoriteAll}
              className={css.removeAll}
              title="Unfavorite all listings"
            >
              🗑️ Unfavorite All
            </button>
            )} 
          </div>

          <div className={css.listingCards}>
            {hasListings ? (
              listings.map(l => {
                const id = l?.id?.uuid || (l.id && l.id.uuid) || (typeof l.id === 'string' ? l.id : null);
                const isSelected = selectedIds.includes(id);

                return (
                  <div className={css.listingCard} key={id || Math.random()}>
                    <div
                      className={`${css.selectCircle} ${isSelected ? css.selected : ''}`}
                      onClick={() => id && toggleSelect(id)}
                      title={isSelected ? "Deselect" : "Select"}
                    />
                    <ListingCard
                      listing={l}
                      renderSizes={renderSizes}
                      showWishlistButton={false}
                      currentUser={currentUser}
                    />
                  </div>
                );
              })
            ) : (
              <div className={css.emptyPanel}>
                <FormattedMessage id="FavoriteListingsPage.noResults" />
              </div>
            )}
          </div>

          {paginationLinks}
        </div>
      </LayoutSingleColumn>
    </Page>
  );
};

const mapStateToProps = state => {
  const {
    currentPageResultIds,
    pagination,
    queryInProgress,
    queryFavoritesError,
    queryParams,
    listings: favoriteListingsFromDuck,
  } = state.FavoriteListingsPage || {};

  const currentUser = state.user?.currentUser || null;

  let listings = [];
  if (Array.isArray(favoriteListingsFromDuck) && favoriteListingsFromDuck.length > 0) {
    listings = favoriteListingsFromDuck;
  } else if (Array.isArray(currentPageResultIds) && currentPageResultIds.length > 0) {
    listings = getListingsById(state, currentPageResultIds) || [];
  } else {
    const favoritesFromProfile =
      currentUser?.attributes?.profile?.privateData?.favorites || [];
    if (Array.isArray(favoritesFromProfile) && favoritesFromProfile.length > 0) {
      listings =
        getListingsById(state, favoritesFromProfile) ||
        getListingsById(state, favoritesFromProfile.map(f => ({ uuid: f }))) ||
        [];
    }
  }

  return {
    currentPageResultIds,
    listings,
    pagination,
    queryInProgress,
    queryFavoritesError,
    queryParams,
    scrollingDisabled: isScrollingDisabled(state),
    currentUser,
  };
};

const FavoriteListingsPage = compose(connect(mapStateToProps), injectIntl)(
  FavoriteListingsPageComponent
);

export default FavoriteListingsPage;
