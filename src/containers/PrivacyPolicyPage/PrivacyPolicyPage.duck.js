import { fetchPageAssets } from '../../ducks/hostedAssets.duck';
import { constructLocalizedPageAssets } from '../../util/localeAssetUtils';

export const ASSET_NAME = 'privacy-policy';

export const loadData = (params, search, config, match) => dispatch => {
  const assetMap = {
    privacyPolicy: ASSET_NAME,
  };

  const pageAsset = constructLocalizedPageAssets(assetMap, match);
  return dispatch(fetchPageAssets(pageAsset, true));
};
