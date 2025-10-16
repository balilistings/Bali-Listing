import { fetchPageAssets } from '../../ducks/hostedAssets.duck';
import { constructLocalizedPageAssets } from '../../util/localeAssetUtils';

export const loadData = (params, search, config, match) => dispatch => {
  const pageId = params.blogId;
  const assetMap = { [pageId]: pageId, 'blogList': 'blog' }; // Load both the blog detail and the blog list

  const pageAsset = constructLocalizedPageAssets(assetMap, match);

  const hasFallbackContent = false;
  return dispatch(fetchPageAssets(pageAsset, hasFallbackContent));
};