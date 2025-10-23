import React, { useEffect } from 'react';
import loadable from '@loadable/component';

import { bool, object } from 'prop-types';
import { compose } from 'redux';
import { connect } from 'react-redux';

import { camelize } from '../../util/string';
import { propTypes } from '../../util/types';

import FallbackPage from './FallbackPage';
import { ASSET_NAME } from './LandingPage.duck';
import PageBuilder from '../PageBuilder/PageBuilder';

export const LandingPageComponent = props => {
  const { pageAssetsData, inProgress, error } = props;
  const useNewPages = process.env.REACT_APP_USE_NEW_PAGES === 'true';
  const data = pageAssetsData?.[camelize(ASSET_NAME)]?.data

  if (!useNewPages) {
    data.sections = data.sections.filter(section => section.sectionId !== 'our_services');
  }

  return (
    <PageBuilder
      pageAssetsData={data}
      inProgress={inProgress}
      error={error}
      fallbackPage={<FallbackPage error={error} />}
    />
  );
};

LandingPageComponent.propTypes = {
  pageAssetsData: object,
  inProgress: bool,
  error: propTypes.error,
};

const mapStateToProps = state => {
  const { pageAssetsData, inProgress, error } = state.hostedAssets || {};
  return { pageAssetsData, inProgress, error };
};

// Note: it is important that the withRouter HOC is **outside** the
// connect HOC, otherwise React Router won't rerender any Route
// components since connect implements a shouldComponentUpdate
// lifecycle hook.
//
// See: https://github.com/ReactTraining/react-router/issues/4671
const LandingPage = compose(connect(mapStateToProps))(LandingPageComponent);

export default LandingPage;
