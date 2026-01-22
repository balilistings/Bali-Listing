import React, { useState } from 'react';
import { useHistory } from 'react-router-dom';
import { FormattedMessage } from 'react-intl';

import IconCollection from '../../../components/IconCollection/IconCollection';
import { radiusToBounds } from '../../../util/radiusUtils';

import CategorySelector from './ProfileCategorySelector';
import LocationSelector from '../../SearchPage/CustomFilters/LocationSelector/LocationSelector';
import RadiusSelector from '../../SearchPage/CustomFilters/RadiusSelector/RadiusSelector';
import PriceSelector from '../../SearchPage/CustomFilters/PriceSelector/PriceSelector';
import SimplePriceSelector from '../../SearchPage/CustomFilters/SimplePriceSelector/SimplePriceSelector';
import BedroomsSelector from '../../SearchPage/CustomFilters/BedroomsSelector/BedroomsSelector';
import BathroomsSelector from '../../SearchPage/CustomFilters/BathroomsSelector/BathroomsSelector';
import AmenitiesSelector from '../../SearchPage/CustomFilters/AmenitiesSelector/AmenitiesSelector';
import PropertyTypeSelector from '../../SearchPage/CustomFilters/PropertyTypeSelector/PropertyTypeSelector';
import AvailabilitySelector from '../../SearchPage/CustomFilters/AvailabilitySelector/AvailabilitySelector';
import ServicesSelector from '../../SearchPage/CustomFilters/ServicesSelector/ServicesSelector';
import PropertyDetailsSelector from '../../SearchPage/CustomFilters/PropertyDetailsSelector/PropertyDetailsSelector';
import HostTypeSelector from '../../SearchPage/CustomFilters/HostTypeSelector/HostTypeSelector';
import TenureSelector from '../../SearchPage/CustomFilters/TenureSelector/TenureSelector';
import LandTitleSelector from '../../SearchPage/CustomFilters/LandTitleSelector/LandTitleSelector';
import LandZoneSelector from '../../SearchPage/CustomFilters/LandZoneSelector/LandZoneSelector';

import css from './ProfileCustomFilters.module.css';

// Configuration for which filters each category needs
const categoryFilterConfig = {
  rentalvillas: [
    'price',
    'bedrooms',
    'bathrooms',
    'amenities',
    'propertyType',
    'availability',
    'services',
    'propertyDetails',
    'hostType',
  ],
  villaforsale: [
    'simplePrice',
    'tenure',
    'bedrooms',
    'bathrooms',
    'amenities',
    'propertyType',
    'propertyDetails',
    'landTitle',
    'landZone',
    'hostType',
  ],
  landforsale: ['tenure', 'simplePrice', 'landSize', 'hostType', 'landTitle', 'landZone'],
};

const allPubAmentiesKeys = [
  'pub_pool',
  'pub_wifi',
  'pub_gym',
  'pub_workingdesk',
  'pub_carparking',
  'pub_airco',
  'pub_kitchen',
  'pub_petfriendly',
];

const allPubServicesKeys = ['pub_cleaning_weekly', 'pub_electricity', 'pub_pool_maintenance'];

const initialiseCategory = () => {
  if (typeof window !== 'undefined') {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get('pub_categoryLevel1') || 'rentalvillas';
  }
  return 'rentalvillas';
};

const initialiseBedrooms = () => {
  if (typeof window !== 'undefined') {
    const urlParams = new URLSearchParams(window.location.search);
    return Number(urlParams.get('pub_bedrooms')) || 0;
  }
  return 0;
};

const initialiseBathrooms = () => {
  if (typeof window !== 'undefined') {
    const urlParams = new URLSearchParams(window.location.search);
    return Number(urlParams.get('pub_bathrooms')) || 0;
  }
  return 0;
};

const initialisePropertyType = () => {
  if (typeof window !== 'undefined') {
    const urlParams = new URLSearchParams(window.location.search);
    const propertyType = urlParams.get('pub_propertytype') || null;
    return propertyType ? propertyType.split(',') : [];
  }
  return [];
};

const initialiseHostType = () => {
  if (typeof window !== 'undefined') {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get('pub_agentorowner') || null;
  }
  return null;
};

const initialiseTenure = () => {
  if (typeof window !== 'undefined') {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get('pub_Freehold') || null;
  }
  return null;
};

const initialiseAvailability = () => {
  if (typeof window !== 'undefined') {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get('pub_availableper') || null;
  }
  return null;
};

const initialisePropertyDetail = () => {
  if (typeof window !== 'undefined') {
    const urlParams = new URLSearchParams(window.location.search);
    const living = urlParams.get('pub_living') || null;
    const furnished = urlParams.get('pub_furnished') || null;
    const result = [];
    if (living) {
      const livingTypes = living.split(',');
      result.push(
        ...livingTypes.map(type => (type === 'open' ? 'open-livingroom' : 'closed-livingroom'))
      );
    }

    if (furnished) {
      const furnishedTypes = furnished.split(',');
      result.push(...furnishedTypes.map(type => (type === 'yes' ? 'furnished' : 'unfurnished')));
    }

    return result;
  }
  return [];
};

const initialiseAmenities = () => {
  if (typeof window !== 'undefined') {
    const urlParams = new URLSearchParams(window.location.search);
    const amenities = [];
    allPubAmentiesKeys.forEach(elm => {
      if (urlParams.get(elm)) {
        amenities.push(elm.replace('pub_', ''));
      }
    });
    return amenities;
  }
  return [];
};

const initialiseServices = () => {
  if (typeof window !== 'undefined') {
    const urlParams = new URLSearchParams(window.location.search);
    const services = [];
    allPubServicesKeys.forEach(key => {
      const value = urlParams.get(key);
      if (value) {
        services.push(key.replace('pub_', ''));
      }
    });
    return services;
  }
  return [];
};

const initialiseLandSize = () => {
  if (typeof window !== 'undefined') {
    const urlParams = new URLSearchParams(window.location.search);
    const landSize = urlParams.get('pub_landsize') || null;
    const splitLandSize = landSize ? landSize.split(',') : null;
    return splitLandSize ? [Number(splitLandSize[0]), Number(splitLandSize[1])] : [100, 50000];
  }
  return [100, 50000];
};

const initialisePrice = () => {
  if (typeof window !== 'undefined') {
    const urlParams = new URLSearchParams(window.location.search);
    const price = urlParams.get('price') || null;
    const splitPrice = price ? price.split(',') : null;
    return splitPrice ? [Number(splitPrice[0]), Number(splitPrice[1])] : [1000000, 999000000000];
  }
  return [1000000, 999000000000];
};

const initialiseMainPrice = () => {
  if (typeof window !== 'undefined') {
    const urlParams = new URLSearchParams(window.location.search);
    const weekprice = urlParams.get('pub_weekprice') || null;
    const monthprice = urlParams.get('pub_monthprice') || null;
    const yearprice = urlParams.get('pub_yearprice') || null;

    if (weekprice) {
      const splitWeekprice = weekprice.split(',');
      return [Number(splitWeekprice[0]), Number(splitWeekprice[1])];
    } else if (monthprice) {
      const splitMonthprice = monthprice.split(',');
      return [Number(splitMonthprice[0]), Number(splitMonthprice[1])];
    } else if (yearprice) {
      const splitYearprice = yearprice.split(',');
      return [Number(splitYearprice[0]), Number(splitYearprice[1])];
    }
  }
  return [1000000, 500000000];
};

const initialisePricePeriod = () => {
  if (typeof window !== 'undefined') {
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('pub_weekprice')) return 'weekly';
    if (urlParams.get('pub_monthprice')) return 'monthly';
    if (urlParams.get('pub_yearprice')) return 'yearly';
  }
  return 'monthly';
};

const initialiseLandTitles = () => {
  if (typeof window !== 'undefined') {
    const urlParams = new URLSearchParams(window.location.search);
    const data = urlParams.get('pub_landtitle') || null;
    return data ? data.split(',') : [];
  }
  return [];
};

const initialiseLandZones = () => {
  if (typeof window !== 'undefined') {
    const urlParams = new URLSearchParams(window.location.search);
    const data = urlParams.get('pub_landzone') || null;
    return data ? data.split(',') : [];
  }
  return [];
};

function ProfileCustomFilters({
  onClose,
  onReset = () => {},
  resultsCount,
  onUpdateCurrentQueryParams,
  currentQueryParams,
  onlyUpdateCurrentQueryParams,
}) {
  const [selectedCategory, setSelectedCategory] = useState(initialiseCategory);
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [selectedRadius, setSelectedRadius] = useState(null);
  const [selectedPeriod, setSelectedPeriod] = useState(initialisePricePeriod);
  const [priceRange, setPriceRange] = useState(initialiseMainPrice);
  const [simplePriceRange, setSimplePriceRange] = useState(initialisePrice);
  const [landSizeRange, setLandSizeRange] = useState(initialiseLandSize);
  const [bedrooms, setBedrooms] = useState(initialiseBedrooms);
  const [bathrooms, setBathrooms] = useState(initialiseBathrooms);
  const [selectedAmenities, setSelectedAmenities] = useState(initialiseAmenities);
  const [selectedPropertyType, setSelectedPropertyType] = useState(initialisePropertyType);
  const [selectedAvailability, setSelectedAvailability] = useState(initialiseAvailability);
  const [selectedServices, setSelectedServices] = useState(initialiseServices);
  const [selectedPropertyDetail, setSelectedPropertyDetail] = useState(initialisePropertyDetail);
  const [selectedHostType, setSelectedHostType] = useState(initialiseHostType);
  const [selectedTenure, setSelectedTenure] = useState(initialiseTenure);
  const [selectedLandTitles, setSelectedLandTitles] = useState(initialiseLandTitles);
  const [selectedLandZones, setSelectedLandZones] = useState(initialiseLandZones);

  const availableFilters = categoryFilterConfig[selectedCategory] || [];

  const handleCategoryChange = categoryId => {
    setSelectedCategory(categoryId);

    // Get available filters for current category
    const newAvailableFilters = categoryFilterConfig[categoryId] || [];

    const resetParams = {};

    if (
      !newAvailableFilters.includes('price') &&
      !newAvailableFilters.includes('simplePrice') &&
      !newAvailableFilters.includes('landSize')
    ) {
      resetParams.pub_weekprice = null;
      resetParams.pub_monthprice = null;
      resetParams.pub_yearprice = null;
      resetParams.price = null;
      resetParams.pub_landsize = null;

      setSelectedPeriod('monthly');
      setPriceRange([1000000, 500000000]);
      setSimplePriceRange([1000000, 999000000000]);
      setLandSizeRange([100, 50000]);
    }
    if (!newAvailableFilters.includes('bedrooms')) {
      resetParams.pub_bedrooms = null;
      setBedrooms(0);
    }
    if (!newAvailableFilters.includes('bathrooms')) {
      resetParams.pub_bathrooms = null;
      setBathrooms(0);
    }
    if (!newAvailableFilters.includes('amenities')) {
      allPubAmentiesKeys.forEach(elm => {
        resetParams[elm] = null;
      });
      setSelectedAmenities([]);
    }
    if (!newAvailableFilters.includes('propertyType')) {
      resetParams.pub_propertytype = null;
      setSelectedPropertyType([]);
    }
    if (!newAvailableFilters.includes('availability')) {
      resetParams.pub_availableper = null;
      setSelectedAvailability(null);
    }
    if (!newAvailableFilters.includes('services')) {
      allPubServicesKeys.forEach(key => {
        resetParams[key] = null;
      });
      setSelectedServices([]);
    }
    if (!newAvailableFilters.includes('propertyDetails')) {
      resetParams.pub_living = null;
      resetParams.pub_furnished = null;
      setSelectedPropertyDetail([]);
    }
    if (!newAvailableFilters.includes('hostType')) {
      resetParams.pub_agentorowner = null;
      setSelectedHostType(null);
    }
    if (!newAvailableFilters.includes('tenure')) {
      resetParams.pub_Freehold = null;
      setSelectedTenure(null);
    }
    if (!newAvailableFilters.includes('landTitle')) {
      resetParams.pub_landtitle = null;
      setSelectedLandTitles([]);
    }
    if (!newAvailableFilters.includes('landZone')) {
      resetParams.pub_landzone = null;
      setSelectedLandZones([]);
    }

    onUpdateCurrentQueryParams({
      pub_categoryLevel1: categoryId,
      ...resetParams,
    });
  };

  const handleLocationChange = location => {
    const { selectedPlace } = location;
    if (selectedPlace) {
      if (selectedRadius) {
        let lat, lng;
        if (selectedPlace.origin) {
          lat = selectedPlace.origin.lat;
          lng = selectedPlace.origin.lng;
        } else if (selectedPlace.center) {
          [lng, lat] = selectedPlace.center;
        }
        if (lat !== undefined && lng !== undefined) {
          const bounds = radiusToBounds(lat, lng, selectedRadius);
          setSelectedLocation(selectedPlace);
          onUpdateCurrentQueryParams({
            address: selectedPlace.address,
            bounds: bounds.join(','),
          });
          return;
        }
      }
      setSelectedLocation(selectedPlace);
      onUpdateCurrentQueryParams({
        address: selectedPlace.address,
        bounds: selectedPlace.bounds,
      });
    }
  };

  const handleLocationReset = () => {
    setSelectedLocation(null);
    setSelectedRadius(null);
    onUpdateCurrentQueryParams({ address: null, bounds: null });
  };

  const handleRadiusChange = radius => {
    setSelectedRadius(radius);
    if (selectedLocation) {
      let lat, lng;
      if (selectedLocation.origin) {
        lat = selectedLocation.origin.lat;
        lng = selectedLocation.origin.lng;
      } else if (selectedLocation.center) {
        [lng, lat] = selectedLocation.center;
      }
      if (lat !== undefined && lng !== undefined) {
        const newBounds = radiusToBounds(lat, lng, radius);
        onUpdateCurrentQueryParams({ bounds: newBounds.join(',') });
      }
    }
  };

  const handleRadiusReset = () => {
    setSelectedRadius(null);
    if (selectedLocation) {
      onUpdateCurrentQueryParams({ bounds: selectedLocation.bounds });
    }
  };

  const handlePriceRangeChange = (range, period) => {
    const paramsToUpdate = {
      pub_weekprice: period === 'weekly' ? range.toString() : null,
      pub_monthprice: period === 'monthly' ? range.toString() : null,
      pub_yearprice: period === 'yearly' ? range.toString() : null,
    };
    onUpdateCurrentQueryParams(paramsToUpdate);
  };

  const handleSimplePriceRangeChange = range => {
    onUpdateCurrentQueryParams({ price: range.toString() });
  };

  const handleLandSizeRangeChange = range => {
    onUpdateCurrentQueryParams({ pub_landsize: range.toString() });
  };

  const handleBedroomsChange = value => {
    onUpdateCurrentQueryParams({ pub_bedrooms: value === 0 ? null : value });
    setBedrooms(value);
  };

  const handleBathroomsChange = value => {
    onUpdateCurrentQueryParams({ pub_bathrooms: value === 0 ? null : value });
    setBathrooms(value);
  };

  const handleAmenitiesChange = amenities => {
    const params = {};
    allPubAmentiesKeys.forEach(elm => {
      const key = elm.replace('pub_', '');
      params[elm] = amenities.includes(key) ? 'yes' : null;
    });
    onUpdateCurrentQueryParams(params);
    setSelectedAmenities(amenities);
  };

  const handlePropertyTypeChange = propertyType => {
    onUpdateCurrentQueryParams({
      pub_propertytype: propertyType?.length > 0 ? propertyType.toString() : null,
    });
    setSelectedPropertyType(propertyType);
  };

  const handleAvailabilityChange = availability => {
    onUpdateCurrentQueryParams({ pub_availableper: availability });
    setSelectedAvailability(availability);
  };

  const handleServiceChange = services => {
    const params = {};
    allPubServicesKeys.forEach(key => {
      const name = key.replace('pub_', '');
      if (services.includes(name)) {
        params[key] = key === 'pub_cleaning_weekly' ? '1,2,3,4,5,6,7' : 'yes';
      } else {
        params[key] = null;
      }
    });
    onUpdateCurrentQueryParams(params);
    setSelectedServices(services);
  };

  const handlePropertyDetailChange = propertyDetail => {
    const livingTypes = propertyDetail
      .filter(d => d.includes('livingroom'))
      .map(d => d.split('-')[0]);
    const furnishedTypes = propertyDetail
      .filter(d => ['furnished', 'semi-furnished', 'unfurnished'].includes(d))
      .map(d => {
        if (d === 'furnished') return 'yes';
        if (d === 'semi-furnished') return 'Semi';
        return 'no';
      });
    onUpdateCurrentQueryParams({
      pub_living: livingTypes.length > 0 ? livingTypes.join(',') : null,
      pub_furnished: furnishedTypes.length > 0 ? furnishedTypes.join(',') : null,
    });
    setSelectedPropertyDetail(propertyDetail);
  };

  const handleHostTypeChange = hostType => {
    onUpdateCurrentQueryParams({ pub_agentorowner: hostType });
    setSelectedHostType(hostType);
  };

  const handleTenureChange = tenure => {
    onUpdateCurrentQueryParams({ pub_Freehold: tenure });
    setSelectedTenure(tenure);
  };

  const handleLandTitlesChange = landTitles => {
    onUpdateCurrentQueryParams({
      pub_landtitle: landTitles?.length > 0 ? landTitles.toString() : null,
    });
    setSelectedLandTitles(landTitles);
  };

  const handleLandZonesChange = landZones => {
    onUpdateCurrentQueryParams({
      pub_landzone: landZones?.length > 0 ? landZones.toString() : null,
    });
    setSelectedLandZones(landZones);
  };

  const handleReset = () => {
    setSelectedCategory('rentalvillas');
    setSelectedLocation(null);
    setSelectedRadius(null);
    setSelectedPeriod('monthly');
    setPriceRange([1000000, 500000000]);
    setSimplePriceRange([1000000, 999000000000]);
    setLandSizeRange([100, 50000]);
    setBedrooms(0);
    setBathrooms(0);
    setSelectedAmenities([]);
    setSelectedPropertyType([]);
    setSelectedAvailability(null);
    setSelectedServices([]);
    setSelectedPropertyDetail([]);
    setSelectedHostType(null);
    setSelectedTenure(null);
    setSelectedLandTitles([]);
    setSelectedLandZones([]);

    const resetParams = {
      pub_categoryLevel1: null,
      address: null,
      bounds: null,
      pub_weekprice: null,
      pub_monthprice: null,
      pub_yearprice: null,
      price: null,
      pub_landsize: null,
      pub_bedrooms: null,
      pub_bathrooms: null,
      pub_propertytype: null,
      pub_availableper: null,
      pub_living: null,
      pub_furnished: null,
      pub_agentorowner: null,
      pub_Freehold: null,
      pub_landtitle: null,
      pub_landzone: null,
    };

    allPubAmentiesKeys.forEach(elm => {
      resetParams[elm] = null;
    });

    allPubServicesKeys.forEach(key => {
      resetParams[key] = null;
    });

    onUpdateCurrentQueryParams(resetParams);
    onClose();
  };

  return (
    <div className={css.container}>
      <div className={css.counterModalOverlay} onClick={onClose} />
      <div className={css.contentWrapper}>
        <div className={css.header}>
          <div className={css.spacer}></div>
          <h2 className={css.title}>
            <span className={css.filterIcon}>
              <IconCollection name="filter_icon" />
            </span>
            <FormattedMessage id="CustomFilters.title" defaultMessage="Filter" />
          </h2>
          <button onClick={onClose} className={css.closeButton}>
            <IconCollection name="close_icon" />
          </button>
        </div>

        <div className={css.content}>
          <CategorySelector
            selectedCategory={selectedCategory}
            onCategoryChange={handleCategoryChange}
          />
          <LocationSelector
            selectedLocation={selectedLocation}
            onLocationChange={handleLocationChange}
            onReset={handleLocationReset}
          />
          {selectedLocation && process.env.REACT_APP_DISPLAY_FILTER_RADIUS === 'true' && (
            <RadiusSelector
              selectedRadius={selectedRadius}
              onRadiusChange={handleRadiusChange}
              onReset={handleRadiusReset}
            />
          )}

          {availableFilters.includes('price') && (
            <PriceSelector
              selectedPeriod={selectedPeriod}
              onPeriodChange={setSelectedPeriod}
              priceRange={priceRange}
              onPriceRangeChange={handlePriceRangeChange}
            />
          )}

          {availableFilters.includes('tenure') && (
            <TenureSelector
              selectedTenure={selectedTenure}
              onTenureChange={handleTenureChange}
              onReset={() => handleTenureChange(null)}
            />
          )}

          {availableFilters.includes('landSize') && (
            <SimplePriceSelector
              priceRange={landSizeRange}
              onPriceRangeChange={handleLandSizeRangeChange}
              title="CustomFilter.LandSize.title"
              description="PriceFilter.landDescription"
              formatValue={value => `${value} m²`}
              min={100}
              max={50000}
              step={100}
              isSize={true}
            />
          )}

          {availableFilters.includes('simplePrice') && (
            <SimplePriceSelector
              priceRange={simplePriceRange}
              description="PriceFilter.simplePriceDescription"
              onPriceRangeChange={handleSimplePriceRangeChange}
              min={1000000}
              max={999000000000}
              step={5000000}
            />
          )}

          {availableFilters.includes('bedrooms') && (
            <BedroomsSelector
              bedrooms={bedrooms}
              onBedroomsChange={handleBedroomsChange}
              onReset={() => handleBedroomsChange(0)}
            />
          )}

          {availableFilters.includes('bathrooms') && (
            <BathroomsSelector
              bathrooms={bathrooms}
              onBathroomsChange={handleBathroomsChange}
              onReset={() => handleBathroomsChange(0)}
            />
          )}

          {availableFilters.includes('amenities') && (
            <AmenitiesSelector
              selectedAmenities={selectedAmenities}
              onAmenitiesChange={handleAmenitiesChange}
              onReset={() => handleAmenitiesChange([])}
              category={selectedCategory}
            />
          )}

          {availableFilters.includes('propertyType') && (
            <PropertyTypeSelector
              selectedPropertyType={selectedPropertyType}
              onPropertyTypeChange={handlePropertyTypeChange}
              onReset={() => handlePropertyTypeChange([])}
            />
          )}

          {availableFilters.includes('availability') && (
            <AvailabilitySelector
              selectedAvailability={selectedAvailability}
              onAvailabilityChange={handleAvailabilityChange}
              onReset={() => handleAvailabilityChange(null)}
            />
          )}

          {availableFilters.includes('services') &&
            process.env.REACT_APP_DISPLAY_FILTER_SERVICES === 'true' && (
              <ServicesSelector
                selectedServices={selectedServices}
                onServiceChange={handleServiceChange}
                onReset={() => handleServiceChange([])}
              />
            )}

          {availableFilters.includes('propertyDetails') && (
            <PropertyDetailsSelector
              selectedPropertyDetail={selectedPropertyDetail}
              onPropertyDetailChange={handlePropertyDetailChange}
              onReset={() => handlePropertyDetailChange([])}
            />
          )}

          {availableFilters.includes('landTitle') && (
            <LandTitleSelector
              selectedLandTitles={selectedLandTitles}
              onLandTitlesChange={handleLandTitlesChange}
              onReset={() => handleLandTitlesChange([])}
            />
          )}

          {availableFilters.includes('landZone') && (
            <LandZoneSelector
              selectedLandZones={selectedLandZones}
              onLandZonesChange={handleLandZonesChange}
              onReset={() => handleLandZonesChange([])}
            />
          )}

          {availableFilters.includes('hostType') && (
            <HostTypeSelector
              selectedHostType={selectedHostType}
              onHostTypeChange={handleHostTypeChange}
              onReset={() => handleHostTypeChange(null)}
            />
          )}
        </div>

        <div className={css.footer}>
          <button onClick={handleReset} className={css.resetButton}>
            <FormattedMessage id="CustomFilters.resetAll" />
          </button>
          <button onClick={onClose} className={css.showListingsButton}>
            <FormattedMessage id="CustomFilters.showListingsButton" values={{ resultsCount }} />
          </button>
        </div>
      </div>
    </div>
  );
}

export default ProfileCustomFilters;
