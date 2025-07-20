import React, { useState } from 'react';
import css from './CustomFilters.module.css';
import CategorySelector from './CategorySelector/CategorySelector';
import LocationSelector from './LocationSelector/LocationSelector';
import PriceSelector from './PriceSelector/PriceSelector';
import SimplePriceSelector from './SimplePriceSelector/SimplePriceSelector';
import BedroomsSelector from './BedroomsSelector/BedroomsSelector';
import BathroomsSelector from './BathroomsSelector/BathroomsSelector';
import AmenitiesSelector from './AmenitiesSelector/AmenitiesSelector';
import PropertyTypeSelector from './PropertyTypeSelector/PropertyTypeSelector';
import AvailabilitySelector from './AvailabilitySelector/AvailabilitySelector';
import ServicesSelector from './ServicesSelector/ServicesSelector';
import PropertyDetailsSelector from './PropertyDetailsSelector/PropertyDetailsSelector';
import HostTypeSelector from './HostTypeSelector/HostTypeSelector';
import TenureSelector from './TenureSelector/TenureSelector';
import LandTitleSelector from './LandTitleSelector/LandTitleSelector';
import LandZoneSelector from './LandZoneSelector/LandZoneSelector';
import { useHistory } from 'react-router-dom';
import { IconCollection } from '../../../components';

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
    'hostType',
  ],
  landforsale: ['tenure', 'simplePrice', 'landSize', 'hostType', 'landTitle', 'landZone'],
};

function CustomFilters({
  onClose,
  onReset = () => { },
  onShowListings = () => { },
  listingCount = 574,
}) {
  const [selectedCategory, setSelectedCategory] = useState('rentalvillas');
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [selectedPeriod, setSelectedPeriod] = useState('weekly');
  const [priceRange, setPriceRange] = useState([0, 50]);
  const [simplePriceRange, setSimplePriceRange] = useState([0, 1000]);
  const [landSizeRange, setLandSizeRange] = useState([100, 1000]);
  const [bedrooms, setBedrooms] = useState(0);
  const [bathrooms, setBathrooms] = useState(0);
  const [selectedAmenities, setSelectedAmenities] = useState([]);
  const [selectedPropertyType, setSelectedPropertyType] = useState(null);
  const [selectedAvailability, setSelectedAvailability] = useState(null);
  const [selectedService, setSelectedService] = useState(null);
  const [selectedPropertyDetail, setSelectedPropertyDetail] = useState(null);
  const [selectedHostType, setSelectedHostType] = useState(null);
  const [selectedTenure, setSelectedTenure] = useState(null);
  const [selectedLandTitles, setSelectedLandTitles] = useState([]);
  const [selectedLandZones, setSelectedLandZones] = useState([]);
  const history = useHistory();

  // Get available filters for current category
  const availableFilters = categoryFilterConfig[selectedCategory] || [];

  const handleCategoryChange = categoryId => {
    setSelectedCategory(categoryId);
    // Reset filters that are not available in the new category
    const newAvailableFilters = categoryFilterConfig[categoryId] || [];

    if (
      !newAvailableFilters.includes('price') &&
      !newAvailableFilters.includes('simplePrice') &&
      !newAvailableFilters.includes('landSize')
    ) {
      setSelectedPeriod('weekly');
      setPriceRange([0, 50]);
      setSimplePriceRange([0, 1000]);
      setLandSizeRange([100, 1000]);
    }
    if (!newAvailableFilters.includes('bedrooms')) {
      setBedrooms(0);
    }
    if (!newAvailableFilters.includes('bathrooms')) {
      setBathrooms(0);
    }
    if (!newAvailableFilters.includes('amenities')) {
      setSelectedAmenities([]);
    }
    if (!newAvailableFilters.includes('propertyType')) {
      setSelectedPropertyType(null);
    }
    if (!newAvailableFilters.includes('availability')) {
      setSelectedAvailability(null);
    }
    if (!newAvailableFilters.includes('services')) {
      setSelectedService(null);
    }
    if (!newAvailableFilters.includes('propertyDetails')) {
      setSelectedPropertyDetail(null);
    }
    if (!newAvailableFilters.includes('hostType')) {
      setSelectedHostType(null);
    }
    if (!newAvailableFilters.includes('tenure')) {
      setSelectedTenure(null);
    }
    if (!newAvailableFilters.includes('landTitle')) {
      setSelectedLandTitles([]);
    }
    if (!newAvailableFilters.includes('landZone')) {
      setSelectedLandZones([]);
    }
  };

  const handleLocationChange = location => {
    setSelectedLocation(location);
  };

  const handleLocationReset = () => {
    setSelectedLocation(null);
  };

  const handlePeriodChange = period => {
    setSelectedPeriod(period);
  };

  const handlePriceRangeChange = range => {
    setPriceRange(range);
  };

  const handleSimplePriceRangeChange = range => {
    setSimplePriceRange(range);
  };

  const handleLandSizeRangeChange = range => {
    setLandSizeRange(range);
  };

  const handleBedroomsChange = value => {
    setBedrooms(value);
  };

  const handleBathroomsChange = value => {
    setBathrooms(value);
  };

  const handleBedroomsReset = () => {
    setBedrooms(0);
  };

  const handleBathroomsReset = () => {
    setBathrooms(0);
  };

  const handleAmenitiesChange = amenities => {
    setSelectedAmenities(amenities);
  };

  const handleAmenitiesReset = () => {
    setSelectedAmenities([]);
  };

  const handlePropertyTypeChange = propertyType => {
    setSelectedPropertyType(propertyType);
  };

  const handlePropertyTypeReset = () => {
    setSelectedPropertyType(null);
  };

  const handleAvailabilityChange = availability => {
    setSelectedAvailability(availability);
  };

  const handleAvailabilityReset = () => {
    setSelectedAvailability(null);
  };

  const handleServiceChange = service => {
    setSelectedService(service);
  };

  const handleServiceReset = () => {
    setSelectedService(null);
  };

  const handlePropertyDetailChange = propertyDetail => {
    setSelectedPropertyDetail(propertyDetail);
  };

  const handlePropertyDetailReset = () => {
    setSelectedPropertyDetail(null);
  };

  const handleHostTypeChange = hostType => {
    setSelectedHostType(hostType);
  };

  const handleHostTypeReset = () => {
    setSelectedHostType(null);
  };

  const handleTenureChange = tenure => {
    setSelectedTenure(tenure);
  };

  const handleTenureReset = () => {
    setSelectedTenure(null);
  };

  const handleLandTitlesChange = landTitles => {
    setSelectedLandTitles(landTitles);
  };

  const handleLandTitlesReset = () => {
    setSelectedLandTitles([]);
  };

  const handleLandZonesChange = landZones => {
    setSelectedLandZones(landZones);
  };

  const handleLandZonesReset = () => {
    setSelectedLandZones([]);
  };

  const handleReset = () => {
    setSelectedCategory('rentalvillas');
    setSelectedLocation(null);
    setSelectedPeriod('weekly');
    setPriceRange([0, 50]);
    setSimplePriceRange([0, 1000]);
    setLandSizeRange([100, 1000]);
    setBedrooms(0);
    setBathrooms(0);
    setSelectedAmenities([]);
    setSelectedPropertyType(null);
    setSelectedAvailability(null);
    setSelectedService(null);
    setSelectedPropertyDetail(null);
    setSelectedHostType(null);
    setSelectedTenure(null);
    setSelectedLandTitles([]);
    setSelectedLandZones([]);
    onReset();
  };

  return (
    <div className={css.container}>
      <div className={css.contentWrapper}>
        <div className={css.header}>
          <div className={css.spacer}></div>
          <h2 className={css.title}>
           <span className={css.filterIcon}>
           <IconCollection name="filter_icon" />
           </span>
            Filter</h2>
          <button onClick={onClose} className={css.closeButton}>
              <IconCollection name="close_icon" />

          </button>
        </div>

        <div className={css.content}>
          {/* Always visible filters */}
          <CategorySelector
            selectedCategory={selectedCategory}
            onCategoryChange={handleCategoryChange}
            history={history}
          />
          <LocationSelector
            selectedLocation={selectedLocation}
            onLocationChange={handleLocationChange}
            onReset={handleLocationReset}
          />

          {/* Dynamic filters based on category configuration */}
          {availableFilters.includes('price') && (
            <PriceSelector
              selectedPeriod={selectedPeriod}
              onPeriodChange={handlePeriodChange}
              priceRange={priceRange}
              onPriceRangeChange={handlePriceRangeChange}
            />
          )}

          {availableFilters.includes('tenure') && (
            <TenureSelector
              selectedTenure={selectedTenure}
              onTenureChange={handleTenureChange}
              onReset={handleTenureReset}
            />
          )}

          {availableFilters.includes('landSize') && (
            <SimplePriceSelector
              priceRange={landSizeRange}
              onPriceRangeChange={handleLandSizeRangeChange}
              onReset={() => setLandSizeRange([100, 1000])}
              title="Land size"
              description="Choose your preferred range in square meters"
              formatValue={value => `${value} m²`}
              min={50}
              max={5000}
              step={50}
            />
          )}

          {availableFilters.includes('simplePrice') && (
            <SimplePriceSelector
              priceRange={simplePriceRange}
              onPriceRangeChange={handleSimplePriceRangeChange}
              onReset={() => setSimplePriceRange([0, 1000])}
            />
          )}

          {availableFilters.includes('bedrooms') && (
            <BedroomsSelector
              bedrooms={bedrooms}
              onBedroomsChange={handleBedroomsChange}
              onReset={handleBedroomsReset}
            />
          )}

          {availableFilters.includes('bathrooms') && (
            <BathroomsSelector
              bathrooms={bathrooms}
              onBathroomsChange={handleBathroomsChange}
              onReset={handleBathroomsReset}
            />
          )}

          {availableFilters.includes('amenities') && (
            <AmenitiesSelector
              selectedAmenities={selectedAmenities}
              onAmenitiesChange={handleAmenitiesChange}
              onReset={handleAmenitiesReset}
            />
          )}

          {availableFilters.includes('propertyType') && (
            <PropertyTypeSelector
              selectedPropertyType={selectedPropertyType}
              onPropertyTypeChange={handlePropertyTypeChange}
              onReset={handlePropertyTypeReset}
            />
          )}

          {availableFilters.includes('availability') && (
            <AvailabilitySelector
              selectedAvailability={selectedAvailability}
              onAvailabilityChange={handleAvailabilityChange}
              onReset={handleAvailabilityReset}
            />
          )}

          {availableFilters.includes('services') && (
            <ServicesSelector
              selectedService={selectedService}
              onServiceChange={handleServiceChange}
              onReset={handleServiceReset}
            />
          )}

          {availableFilters.includes('propertyDetails') && (
            <PropertyDetailsSelector
              selectedPropertyDetail={selectedPropertyDetail}
              onPropertyDetailChange={handlePropertyDetailChange}
              onReset={handlePropertyDetailReset}
            />
          )}

          {availableFilters.includes('landTitle') && (
            <LandTitleSelector
              selectedLandTitles={selectedLandTitles}
              onLandTitlesChange={handleLandTitlesChange}
              onReset={handleLandTitlesReset}
            />
          )}

          {availableFilters.includes('landZone') && (
            <LandZoneSelector
              selectedLandZones={selectedLandZones}
              onLandZonesChange={handleLandZonesChange}
              onReset={handleLandZonesReset}
            />
          )}

          {availableFilters.includes('hostType') && (
            <HostTypeSelector
              selectedHostType={selectedHostType}
              onHostTypeChange={handleHostTypeChange}
              onReset={handleHostTypeReset}
            />
          )}
        </div>

        <div className={css.footer}>
          <button onClick={handleReset} className={css.resetButton}>
            Reset All
          </button>
          <button onClick={onShowListings} className={css.showListingsButton}>
            Show {listingCount} listings
          </button>
        </div>
      </div>
    </div>
  );
}

export default CustomFilters;
