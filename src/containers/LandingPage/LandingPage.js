import { shallowEqual, useSelector } from 'react-redux';

import { camelize } from '../../util/string';

import FallbackPage from './FallbackPage';
import { ASSET_NAME } from './LandingPage.duck';
import PageBuilder from '../PageBuilder/PageBuilder';

export const LandingPage = () => {
  const { pageAssetsData, inProgress, error } = useSelector(
    state => state.hostedAssets || {},
    shallowEqual
  );
  const useNewPages = process.env.REACT_APP_USE_NEW_PAGES === 'true';
  const data = pageAssetsData?.[camelize(ASSET_NAME)]?.data;

  if (!useNewPages && data) {
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

export default LandingPage;
