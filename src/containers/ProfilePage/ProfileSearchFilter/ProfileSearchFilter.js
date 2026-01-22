import React, { useState, useEffect } from 'react';
import classNames from 'classnames';
import { Form as FinalForm } from 'react-final-form';
import { useLocation } from 'react-router-dom';

// Contexts
import { useConfiguration } from '../../../context/configurationContext';

// Utility
import { FormattedMessage } from '../../../util/reactIntl';
import { isOriginInUse } from '../../../util/search';
import { stringifyDateToISO8601 } from '../../../util/dates';
import { parse } from '../../../util/urlHelpers';

// Shared components
import { Form } from '../../../components';

import FilterCategories from '../../PageBuilder/Primitives/SearchCTA/FilterCategories/FilterCategories';
import FilterDateRange from '../../PageBuilder/Primitives/SearchCTA/FilterDateRange/FilterDateRange';
import FilterLocation from '../../PageBuilder/Primitives/SearchCTA/FilterLocation/FilterLocation';
import FilterKeyword from '../../PageBuilder/Primitives/SearchCTA/FilterKeyword/FilterKeyword';

import css from './ProfileSearchFilter.module.css';
import FilterBedrooms from '../../PageBuilder/Primitives/SearchCTA/FilterBedrooms';
import FilterPrice from '../../PageBuilder/Primitives/SearchCTA/FilterPrice';
import FilterLandSize from '../../PageBuilder/Primitives/SearchCTA/FilterLandSize';
import IconCollection from '../../../components/IconCollection/IconCollection';

const GRID_CONFIG = [
  { gridCss: css.gridCol1 },
  { gridCss: css.gridCol2 },
  { gridCss: css.gridCol3 },
  { gridCss: css.gridCol4 },
];

const tabs = [
  { label: 'PageBuilder.SearchCTA.rentals', key: 'rentalvillas' },
  { label: 'PageBuilder.SearchCTA.forSale', key: 'villaforsale' },
  { label: 'PageBuilder.SearchCTA.land', key: 'landforsale' },
];

const getGridCount = numberOfFields => {
  const gridConfig = GRID_CONFIG[numberOfFields - 1];
  return gridConfig ? gridConfig.gridCss : GRID_CONFIG[0].gridCss;
};

const isEmpty = value => {
  if (value == null) return true;
  return value.hasOwnProperty('length') && value.length === 0;
};

const formatDateValue = (dateRange, queryParamName) => {
  const hasDates = dateRange;
  const { startDate, endDate } = hasDates ? dateRange : {};
  const start = startDate ? stringifyDateToISO8601(startDate) : null;
  const end = endDate ? stringifyDateToISO8601(endDate) : null;
  const value = start && end ? `${start},${end}` : null;
  return { [queryParamName]: value };
};

export const ProfileSearchFilter = React.forwardRef((props, ref) => {
  const location = useLocation();
  const config = useConfiguration();

  // Parse initial values from URL
  const queryParams = parse(location.search, {
    latlng: ['origin'],
    latlngBounds: ['bounds'],
  });

  const initialCategory = queryParams.pub_categoryLevel1 || tabs[0].key;
  const initialTabIndex = tabs.findIndex(tab => tab.key === initialCategory);

  const [activeTab, setActiveTab] = useState(initialTabIndex !== -1 ? initialTabIndex : 0);
  const [isOpenBedrooms, setIsOpenBedrooms] = useState(false);
  const [isOpenPrice, setIsOpenPrice] = useState(false);
  const [isOpenLandSize, setIsOpenLandSize] = useState(false);
  const [isFormReady, setIsFormReady] = useState(false);

  // Parse initial values for the form
  const getInitialValues = (params, tabKey) => {
    const values = {};
    if (params.pub_bedrooms) values.pub_bedrooms = parseInt(params.pub_bedrooms, 10);
    if (params.pub_keyword) values.pub_keyword = params.pub_keyword;

    // Price reconstruction
    if (tabKey === 'rentalvillas') {
      if (params.pub_weekprice) {
        const [min, max] = params.pub_weekprice.split(',');
        values.pub_price = {
          period: 'weekly',
          minPrice: parseInt(min, 10),
          maxPrice: parseInt(max, 10),
        };
      } else if (params.pub_monthprice) {
        const [min, max] = params.pub_monthprice.split(',');
        values.pub_price = {
          period: 'monthly',
          minPrice: parseInt(min, 10),
          maxPrice: parseInt(max, 10),
        };
      } else if (params.pub_yearprice) {
        const [min, max] = params.pub_yearprice.split(',');
        values.pub_price = {
          period: 'yearly',
          minPrice: parseInt(min, 10),
          maxPrice: parseInt(max, 10),
        };
      }
    } else if (params.price) {
      const [min, max] = params.price.split(',');
      values.pub_price = {
        period: 'monthly',
        minPrice: parseInt(min, 10),
        maxPrice: parseInt(max, 10),
      };
    }

    if (params.pub_landsize) {
      const [min, max] = params.pub_landsize.split(',');
      values.pub_landSize = { minSize: parseInt(min, 10), maxSize: parseInt(max, 10) };
    }

    if (params.address && params.bounds) {
      values.location = {
        search: params.address,
        selectedPlace: {
          address: params.address,
          bounds: params.bounds,
          origin: params.origin
            ? {
                lat: parseFloat(params.origin.split(',')[0]),
                lng: parseFloat(params.origin.split(',')[1]),
              }
            : null,
        },
      };
    }

    return values;
  };

  const initialValues = getInitialValues(queryParams, tabs[activeTab].key);

  // For the profile page, we might want to show all relevant filters by default
  const {
    categories = false,
    dateRange = false,
    keywordSearch = false,
    locationSearch = true,
    price = true,
  } = props.searchFields || {};

  const bedrooms = tabs[activeTab].key !== 'landforsale';
  const landSize = tabs[activeTab].key === 'landforsale';

  const [submitDisabled, setSubmitDisabled] = useState(false);

  useEffect(() => {
    setIsFormReady(true);
  }, []);

  // Update active tab if URL changes
  useEffect(() => {
    const currentCategory = queryParams.pub_categoryLevel1 || tabs[0].key;
    const currentTabIndex = tabs.findIndex(tab => tab.key === currentCategory);
    if (currentTabIndex !== -1 && currentTabIndex !== activeTab) {
      setActiveTab(currentTabIndex);
    }
  }, [queryParams.pub_categoryLevel1]);

  const categoryConfig = config.categoryConfiguration;
  const isMobile = typeof window !== 'undefined' && window.innerWidth <= 768;

  const filters = {
    categories: {
      enabled: categories,
      isValid: () => categoryConfig.categories.length > 0,
      render: alignLeft => (
        <div className={css.filterField} key="categories">
          <FilterCategories categories={categoryConfig.categories} alignLeft={alignLeft} />
        </div>
      ),
    },
    keywordSearch: {
      enabled: keywordSearch,
      isValid: () => keywordSearch,
      render: alignLeft => (
        <div className={css.filterField} key="keywordSearch">
          <FilterKeyword />
        </div>
      ),
    },
    locationSearch: {
      enabled: locationSearch,
      isValid: () => locationSearch,
      render: alignLeft => (
        <div className={css.filterField} key="locationSearch">
          <FilterLocation
            setSubmitDisabled={setSubmitDisabled}
            alignLeft={alignLeft}
            setIsOpenBedrooms={setIsOpenBedrooms}
            setIsOpenLandSize={setIsOpenLandSize}
            landSize={landSize}
            isMobile={isMobile}
          />
        </div>
      ),
    },
    dateRange: {
      enabled: dateRange,
      isValid: () => dateRange,
      render: alignLeft => (
        <div className={css.filterField} key="dateRange">
          <FilterDateRange config={config} alignLeft={alignLeft} />
        </div>
      ),
    },
    bedrooms: {
      enabled: bedrooms,
      isValid: () => bedrooms,
      render: alignLeft => (
        <div className={css.filterField} key="bedrooms">
          <FilterBedrooms
            isOpen={isOpenBedrooms}
            setIsOpen={setIsOpenBedrooms}
            setIsOpenPrice={setIsOpenPrice}
          />
        </div>
      ),
    },
    price: {
      enabled: price,
      isValid: () => price,
      render: alignLeft => (
        <div className={css.filterField} key="price">
          <FilterPrice
            activeTabKey={tabs[activeTab].key}
            isOpen={isOpenPrice}
            setIsOpen={setIsOpenPrice}
          />
        </div>
      ),
    },
    landSize: {
      enabled: landSize,
      isValid: () => landSize,
      render: alignLeft => (
        <div className={css.filterField} key="landSize">
          <FilterLandSize
            isOpen={isOpenLandSize}
            setIsOpen={setIsOpenLandSize}
            setIsOpenPrice={setIsOpenPrice}
          />
        </div>
      ),
    },
  };

  const addFilters = filterOrder => {
    const enabledFilters = filterOrder.filter(
      key => filters[key]?.enabled && filters[key]?.isValid()
    );

    const totalEnabled = enabledFilters.length;

    return enabledFilters.map((key, index) => {
      const filter = filters[key];
      const isLast = index === totalEnabled - 1;
      const alignLeft = totalEnabled === 1 || !isLast;

      return filter.enabled && filter.isValid() ? filter.render(alignLeft) : null;
    });
  };

  // Count the number search fields that are enabled
  const fieldCountForGrid = Object.values(filters).filter(field => field.enabled && field.isValid())
    .length;

  //  If no search fields are enabled, we return null (Console won't allow you to enable 0 search fields)
  if (!fieldCountForGrid) {
    return null;
  }

  const onSubmit = values => {
    // Convert form values to query parameters
    const activeTabKey = tabs[activeTab].key;
    let newQueryParams = {
      pub_categoryLevel1: activeTabKey,
    };

    const isLand = activeTabKey === 'landforsale';

    Object.entries(values).forEach(([key, value]) => {
      if (!isEmpty(value)) {
        if (key === 'dateRange') {
          const { dates } = formatDateValue(value, 'dates');
          newQueryParams.dates = dates;
        } else if (key === 'location') {
          if (value.selectedPlace) {
            const {
              search,
              selectedPlace: { origin, bounds },
            } = value;
            newQueryParams.bounds = bounds;
            newQueryParams.address = search;

            if (isOriginInUse(config) && origin) {
              newQueryParams.origin = `${origin.lat},${origin.lng}`;
            }
          }
        } else if (key === 'pub_bedrooms') {
          if (value === 0 || isLand) {
            return;
          }
          newQueryParams[key] = value;
        } else if (key === 'pub_price') {
          let priceKey = '';
          if (activeTabKey !== 'rentalvillas') {
            priceKey = 'price';
          } else if (value.period === 'monthly') {
            priceKey = 'pub_monthprice';
          } else if (value.period === 'yearly') {
            priceKey = 'pub_yearprice';
          } else {
            priceKey = 'pub_weekprice';
          }
          newQueryParams[priceKey] = `${value.minPrice},${value.maxPrice}`;
        } else if (key === 'pub_landSize') {
          if (!isLand) {
            return;
          }
          newQueryParams['pub_landsize'] = `${value.minSize},${value.maxSize}`;
        } else {
          newQueryParams[key] = value;
        }
      }
    });

    if (props.onFilterChange) {
      props.onFilterChange(newQueryParams);
    }
  };

  const handleTabChange = idx => {
    setActiveTab(idx);
  };

  return (
    <div className={css.filterContainer}>
      <div className={css.tabsWrapper}>
        <div className={css.heroTabs}>
          {tabs.map((tab, idx) => (
            <button
              key={tab.label}
              className={idx === activeTab ? `${css.heroTab} ${css.active}` : css.heroTab}
              onClick={() => handleTabChange(idx)}
              type="button"
            >
              <FormattedMessage id={tab.label} />
            </button>
          ))}
        </div>
      </div>
      <div className={classNames(css.searchBarContainer, getGridCount(fieldCountForGrid))}>
        <FinalForm
          onSubmit={onSubmit}
          initialValues={initialValues}
          {...props}
          render={({ fieldRenderProps, handleSubmit, form }) => {
            return (
              <Form
                role="search"
                onSubmit={handleSubmit}
                className={classNames(css.gridContainer, getGridCount(fieldCountForGrid))}
              >
                {addFilters([
                  'locationSearch',
                  'bedrooms',
                  'landSize',
                  'price',
                  'categories',
                  'keywordSearch',
                  'dateRange',
                ])}

                <button
                  disabled={!isFormReady || submitDisabled}
                  className={css.submitButton}
                  type="submit"
                >
                  <span className={css.searchIcon}>
                    <IconCollection name="search_icon" />
                  </span>
                  {/* <FormattedMessage id="PageBuilder.SearchCTA.buttonLabel" /> */}
                </button>
              </Form>
            );
          }}
        />
      </div>
    </div>
  );
});

ProfileSearchFilter.displayName = 'ProfileSearchFilter';

export default ProfileSearchFilter;