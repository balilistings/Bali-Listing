import { fetchPageAssets } from '../../ducks/hostedAssets.duck';
import { constructLocalizedPageAssets } from '../../util/localeAssetUtils';

export const ASSET_NAME = 'terms-of-service';

export const loadData = (params, search, config, match) => dispatch => {
  const assetMap = {
    termsOfService: ASSET_NAME,
  };

  const pageAsset = constructLocalizedPageAssets(assetMap, match);
  // throw new Error(JSON.stringify(pageAsset));
  
  return dispatch(fetchPageAssets(pageAsset, true));
};
