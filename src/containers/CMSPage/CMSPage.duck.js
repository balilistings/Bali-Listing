import { fetchPageAssets } from '../../ducks/hostedAssets.duck';
import { constructLocalizedPageAssets } from '../../util/localeAssetUtils';
import { isServicesPage } from '../../util/services';

export const ASSET_NAME = 'cms';

export const loadData = (params, search, config, match, currentLocale) => dispatch => {
  const pageId = params.pageId;
  if (isServicesPage(pageId)) {
    const explicitLocale = pageId.match(/-(id|ru)$/)?.[1];
    const locale = explicitLocale || currentLocale || match?.params?.locale || 'en';
    const suffix = locale === 'en' ? '' : `-${locale}`;
    const asset = { [pageId]: `content/pages/services${suffix}.json` };
    return dispatch(fetchPageAssets(asset, true)).then(result => {
      const content = result?.[pageId]?.data;
      return suffix && (!content || !Object.keys(content).length)
        ? dispatch(fetchPageAssets({ [pageId]: 'content/pages/services.json' }, true))
        : result;
    });
  }
  const assetMap = { [pageId]: pageId };

  const pageAsset = constructLocalizedPageAssets(assetMap, match, currentLocale);

  return dispatch(fetchPageAssets(pageAsset, true));
};
