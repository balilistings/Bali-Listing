import { fetchPageAssets } from '../../ducks/hostedAssets.duck';

export const loadData = (params, locale) => dispatch => {
  const pageId = 'about-new';
  const pageAsset = { [pageId]: `content/pages/${pageId}${locale==='en' ? '' : `-${locale}`}.json` };
  const hasFallbackContent = false;
  return dispatch(fetchPageAssets(pageAsset, hasFallbackContent));
};
