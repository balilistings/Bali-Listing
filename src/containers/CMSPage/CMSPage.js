import React from 'react';
import loadable from '@loadable/component';

import { bool, object } from 'prop-types';
import { compose } from 'redux';
import { connect } from 'react-redux';
import { withRouter } from 'react-router-dom';

import NotFoundPage from '../../containers/NotFoundPage/NotFoundPage';
import AboutUsPage from '../AboutUsPage/AboutUsPage';
import BlogListPage from '../BlogListPage/BlogListPage';
import FAQPage from '../FAQPage/FAQPage';

const PageBuilder = loadable(() =>
  import(/* webpackChunkName: "PageBuilder" */ '../PageBuilder/PageBuilder')
);

const componentMap = {
  about: AboutUsPage,
  blog: BlogListPage,
  faq: FAQPage,
};

export const CMSPageComponent = props => {
  const { params, pageAssetsData, inProgress, error } = props;
  const pageId = params.pageId || props.pageId;

  const useNewPages = process.env.REACT_APP_USE_NEW_PAGES === 'true';
  const PageComponent = useNewPages ? componentMap[pageId] : null;

  if (PageComponent) {
    return <PageComponent {...props} />;
  }

  if (!inProgress && error?.status === 404) {
    return <NotFoundPage staticContext={props.staticContext} />;
  }

  console.log(JSON.stringify(pageAssetsData?.[pageId]?.data));

  return (
    <PageBuilder
      pageAssetsData={pageAssetsData?.[pageId]?.data}
      inProgress={inProgress}
      schemaType="Article"
    />
  );
};

CMSPageComponent.propTypes = {
  pageAssetsData: object,
  inProgress: bool,
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
const CMSPage = compose(
  withRouter,
  connect(mapStateToProps)
)(CMSPageComponent);

export default CMSPage;
