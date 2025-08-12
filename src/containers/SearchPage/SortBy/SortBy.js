import React from 'react';
import { useLocation } from 'react-router-dom';

import { useConfiguration } from '../../../context/configurationContext';
import { useIntl } from '../../../util/reactIntl';
import { isMainSearchTypeKeywords } from '../../../util/search';

import SortByPlain from './SortByPlain';
import SortByPopup from './SortByPopup';

import css from './SortBy.module.css';

/**
 * SortBy component
 *
 * @component
 * @param {Object} props
 * @param {string} [props.sort] - The sort
 * @param {boolean} [props.showAsPopup] - Whether to show as popup
 * @param {boolean} props.isConflictingFilterActive - Whether the conflicting filter is active
 * @param {boolean} [props.hasConflictingFilters] - Whether there are filters that could conflict
 * @param {'mobile' | 'desktop'} [props.mode] - The mode
 * @returns {JSX.Element}
 */
const SortBy = props => {
  const config = useConfiguration();
  const intl = useIntl();
  const location = useLocation();
  const {
    sort,
    showAsPopup = false,
    selectedFilters,
    isConflictingFilterActive,
    hasConflictingFilters,
    mode = 'desktop',
    ...rest
  } = props;

  const { relevanceKey, relevanceFilter, queryParamName } = config.search.sortConfig;

  const mobileClassesMaybe =
    mode === 'mobile'
      ? {
        rootClassName: css.sortBy,
        menuLabelRootClassName: css.sortByMenuLabel,
      }
      : {
        className: css.sortByDesktop,
        menuLabelRootClassName: css.sortByMenuLabel,
      };

  // Ensure that keywords is included to activeFilter list when needed
  const isMainSearchKeywords = isMainSearchTypeKeywords(config);
  const hasKeyworsFilter = config.search.defaultFilters.find(df => df.key === relevanceFilter);
  const isKeywordsFilterEnabled = isMainSearchKeywords || hasKeyworsFilter;

  const activeOptions = isKeywordsFilterEnabled
    ? Object.keys({ keywords: '', ...selectedFilters })
    : Object.keys(selectedFilters);

  const isRelevanceOptionActive = activeOptions.includes(relevanceFilter);

  const urlParams = new URLSearchParams(location.search);
  const category = urlParams.get('pub_categoryLevel1');

  const options = config.search.sortConfig.options.reduce((selected, option) => {
    let optionKey = option.key;
    if (category === 'rentalvillas' && optionKey.includes('price')) {
      const isAscending = optionKey.startsWith('-');
      let priceKey;

      if (urlParams.has('pub_weekprice')) {
        priceKey = 'pub_weekprice';
      } else if (urlParams.has('pub_monthprice')) {
        priceKey = 'pub_monthprice';
      } else if (urlParams.has('pub_yearprice')) {
        priceKey = 'pub_yearprice';
      } else {
        priceKey = 'pub_monthprice'; // Default if no period is in URL
      }

      optionKey = isAscending ? `-${priceKey}` : priceKey;
    }

    const isRelevance = optionKey === relevanceKey;
    const isConflictingFilterSetAndActive = hasConflictingFilters && !isConflictingFilterActive;

    // Some default options might be mapped with translation files
    const translationKeyLongMaybe = option?.labelTranslationKeyLong
      ? { longLabel: intl.formatMessage({ id: option?.labelTranslationKeyLong }) }
      : {};
    const translatedOption = option?.labelTranslationKey
      ? {
        key: optionKey,
        label: intl.formatMessage({ id: option.labelTranslationKey }),
        ...translationKeyLongMaybe,
      }
      : {...option, key: optionKey};
    // Omit relevance option if mainSearchType is not 'keywords'
    // Note: We might change this in the future, if multiple transaction types are allowed
    return isRelevance && !isKeywordsFilterEnabled
      ? selected
      : [
        ...selected,
        {
          ...translatedOption,
          disabled:
            (isRelevance && (!isRelevanceOptionActive || isConflictingFilterSetAndActive)) ||
            (!isRelevance && isConflictingFilterActive),
        },
      ];
  }, []);
  const defaultValue = 'createdAt';
  const isRelevanceSortActive = isRelevanceOptionActive && !sort;
  const relevanceValue =
    isRelevanceSortActive && selectedFilters[relevanceFilter]?.length > 0 ? relevanceKey : null;
  const initialValue =
    hasConflictingFilters && !isConflictingFilterActive
      ? relevanceKey
      : sort || relevanceValue || defaultValue;
  const componentProps = {
    urlParam: queryParamName,
    label: intl.formatMessage({ id: 'SortBy.heading' }),
    options,
    initialValue,
    ...mobileClassesMaybe,
    ...rest,
  };
  return showAsPopup ? <SortByPopup {...componentProps} mode={mode} /> : <SortByPlain {...componentProps} />;
};

export default SortBy;
