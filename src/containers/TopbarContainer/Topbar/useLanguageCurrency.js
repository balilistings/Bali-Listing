import { useSelector, useDispatch } from 'react-redux';
import { useLocation, useHistory } from 'react-router-dom';
import { saveCurrency } from '../../../ducks/currency.js';
import { useLocale, useUpdateLocale } from '../../../context/localeContext.js';
import { setMessages } from '../../../ducks/locale.duck.js';
import { useCallback } from 'react';
import { nativeMarketplace } from '../../../util/nativeMarketplace';

const currencies = [
  { code: 'IDR', name: 'Indonesian Rupiah', symbol: 'RP' },
  { code: 'USD', name: 'United States Dollar', symbol: '$' },
];

export const useLanguageCurrency = (config, currentPage) => {
  const { locale, SUPPORTED_LOCALES, DEFAULT_LOCALE, languageNames } = useLocale();
  const updateLocale = useUpdateLocale();
  const location = useLocation();
  const history = useHistory();
  const dispatch = useDispatch();
  const selectedCurrency = useSelector(state => state.currency.selectedCurrency);

  const handleCurrencyChange = currency => {
    dispatch(saveCurrency(currency));
  };

  const onLanguageChange = useCallback(async (newLocale) => {
    if (newLocale === locale) {
      return ;
    }

    if (nativeMarketplace) {
      const { pathname, search, hash } = window.location;
      const routeParts = pathname.split('/').filter(Boolean);
      if (SUPPORTED_LOCALES.includes(routeParts[0])) routeParts.shift();
      if (newLocale !== DEFAULT_LOCALE) routeParts.unshift(newLocale);
      localStorage.setItem('locale', newLocale);
      localStorage.setItem('useDefaultLocale', String(newLocale === DEFAULT_LOCALE));
      window.location.assign('/' + routeParts.join('/') + search + hash);
      return;
    }

    return import(`../../../translations/${newLocale}.json`)
      .then(newMessages => {
        dispatch(setMessages(newMessages.default));
        updateLocale(newLocale);

        if (newLocale === DEFAULT_LOCALE) {
          localStorage.setItem('useDefaultLocale', 'true');
        } else {
          localStorage.setItem('useDefaultLocale', 'false');
        }

        const pathParts = location.pathname.split('/').filter(part => part !== '');

        let newPath = location.pathname;
        if (pathParts.length > 0 && SUPPORTED_LOCALES.includes(pathParts[0])) {
          if (newLocale === DEFAULT_LOCALE) {
            newPath = '/' + pathParts.slice(1).join('/') + location.search + location.hash;
          } else {
            pathParts[0] = newLocale;
            newPath = '/' + pathParts.join('/') + location.search + location.hash;
          }
        } else if (newLocale !== DEFAULT_LOCALE) {
          const cleanPath = location.pathname.startsWith('/')
            ? location.pathname.substring(1)
            : location.pathname;
          newPath = `/${newLocale}/${cleanPath}${location.search}${location.hash}`;
        }

        history.push(newPath);
      })
      .catch(error => {
        console.error('Failed to load translation', error);
      });
  }, [DEFAULT_LOCALE, SUPPORTED_LOCALES, dispatch, history, location, locale, updateLocale]);

  const showCurrencyToggler =
    config.multiCurrencyEnabled && ['LandingPage', 'search', 'ListingPage'].includes(currentPage);
  const showLanguageToggler = SUPPORTED_LOCALES.length > 1 && currentPage !== 'EditListingPage';

  return {
    locale,
    SUPPORTED_LOCALES,
    languageNames,
    selectedCurrency,
    currencies,
    onLanguageChange,
    handleCurrencyChange,
    showLanguageToggler,
    showCurrencyToggler,
  };
};
