import { getSupportedLocales } from './translation';

/**
 * Helper function to construct asset names with locale support
 * @param {string} baseAssetName - The base asset name (e.g., 'terms-of-service', 'privacy-policy')
 * @param {Object} match - React Router match object containing URL params
 * @returns {string} - Asset name with locale appended if available
 */
export const constructLocalizedAssetName = (baseAssetName, match) => {
  const urlLocale = match?.params?.locale;

  // If there's a locale in the URL, use it directly
  if (urlLocale) {
    return `${baseAssetName}-${urlLocale}`;
  }

  // If no locale in URL, check if we need to redirect based on saved locale
  const savedLocale = typeof window !== 'undefined' ? localStorage.getItem('locale') : null;
  const useDefaultLocale =
    typeof window !== 'undefined' ? localStorage.getItem('useDefaultLocale') === 'true' : false;

  // Get supported locales dynamically
  const SUPPORTED_LOCALES = getSupportedLocales();
  const DEFAULT_LOCALE = 'en';

  // Check if we would redirect to a locale-prefixed URL
  if (
    savedLocale &&
    SUPPORTED_LOCALES.includes(savedLocale) &&
    savedLocale !== DEFAULT_LOCALE &&
    !useDefaultLocale
  ) {
    return `${baseAssetName}-${savedLocale}`;
  }

  // Default behavior - no locale in asset name
  return baseAssetName;
};

/**
 * Helper function to construct page assets with locale support
 * @param {Object} assetMap - Map of asset keys to base asset names (e.g., { termsOfService: 'terms-of-service' })
 * @param {Object} match - React Router match object containing URL params
 * @returns {Object} - Map of asset keys to localized asset paths
 */
export const constructLocalizedPageAssets = (assetMap, match) => {
  const pageAsset = {};

  Object.keys(assetMap).forEach(key => {
    const localizedAssetName = constructLocalizedAssetName(assetMap[key], match);
    pageAsset[key] = `content/pages/${localizedAssetName}.json`;
  });

  return pageAsset;
};