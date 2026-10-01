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
  const data = pageAssetsData?.[camelize(ASSET_NAME)]?.data;
  const sections = (data?.sections || []).filter(
    section => section.sectionId !== 'services-promotion' && section.sectionId !== 'our_services'
  );
  const featuredIndex = sections.findIndex(
    section => section.sectionId === 'select_your_properties'
  );
  if (featuredIndex !== -1)
    sections.splice(featuredIndex + 1, 0, {
      sectionType: 'servicesPromotion',
      sectionId: 'services-promotion',
    });
  const pageData = data ? { ...data, sections } : data;

  return (
    <PageBuilder
      pageAssetsData={pageData}
      inProgress={inProgress}
      error={error}
      fallbackPage={<FallbackPage error={error} />}
    />
  );
};

export default LandingPage;
