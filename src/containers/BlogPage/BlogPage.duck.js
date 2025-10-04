import { fetchPageAssets } from '../../ducks/hostedAssets.duck';

export const loadData = (params, search) => dispatch => {
  const pageId = 'blog';
  const pageAsset = { [pageId]: `content/pages/${pageId}.json` };
  const hasFallbackContent = false;
  return dispatch(fetchPageAssets(pageAsset, hasFallbackContent));
};
