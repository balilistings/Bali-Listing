import React from 'react';
import css from './ListingPage.module.css';
import { IconCollection } from '../../components/index.js';

// Static array of amenities to display
const amenitiesConfig = [
  { icon: <IconCollection name="wifi" />, label: 'Wifi', key: 'wifi' },
  { icon: <IconCollection name="pool" />, label: 'Pool', key: 'pool' },
  { icon: <IconCollection name="gym" />, label: 'Gym', key: 'Gym' },
  { icon: <IconCollection name="pet" />, label: 'Pet Friendly', key: 'petfriendly' },
  { icon: <IconCollection name="desk" />, label: 'Working desk', key: 'workingdesk' },
  { icon: <IconCollection name="parking" />, label: 'Car parking', key: 'carparking' },
  { icon: <IconCollection name="kitchen" />, label: 'Kitchen', key: 'kitchen' },
  { icon: <IconCollection name="aircondition" />, label: 'Airconditioning', key: 'airco' },
];

const amenitiesConfig2 = [
  { icon: <IconCollection name="pool" />, label: 'Pool', key: 'pool' },
  { icon: <IconCollection name="gym" />, label: 'Gym', key: 'Gym' },
];

const prepareAmenities = publicData => {
  if (!publicData) return [];

  const isSale = publicData.categoryLevel1 === 'villaforsale';
  const config = isSale ? amenitiesConfig2 : amenitiesConfig;

  // Only process the specific keys we want to display
  return config.filter(amenity => {
    const value = publicData[amenity.key];
    return value === 'yes' || value === 'gymyes'; // Handle special case for gym
  });
};

const propertyDetailsConfig = [
  { icon: <IconCollection name="living" />, label: 'Living', key: 'living' },
  { icon: <IconCollection name="furnished" />, label: 'Furnished', key: 'furnished' },
  { icon: <IconCollection name="land_size" />, label: 'Land Size', key: 'landsize' },
  { icon: <IconCollection name="building_size" />, label: 'Building Size', key: 'buildingsize' },
];

const preparePropertyDetails = publicData => {
  // Value transformations for display
  const valueTransformations = {
    yes: 'Yes',
    no: 'No',
    open: 'Open',
    closed: 'Closed',
    semi: 'Semi',
    // Add more transformations as needed
  };

  if (!publicData) return [];

  // Only process the specific keys we want to display
  return propertyDetailsConfig
    .filter(detail => publicData[detail.key]) // Only include if the key exists and has a value
    .map(detail => {
      const rawValue = `${publicData[detail.key]}`;
      const displayValue = valueTransformations[rawValue.toLowerCase()];

      const finalValue =
        detail.key === 'landsize' || detail.key === 'buildingsize'
          ? `${rawValue} m2`
          : displayValue;

      return {
        ...detail,
        value: finalValue,
      };
    });
};

const servicesConfig = [
  {
    icon: <IconCollection name="cleaning" />,
    label: 'Cleaning',
    key: 'cleaning_weekly',
    valuePrefix: 'x Weekly cleaning',
  },
  {
    icon: <IconCollection name="elictricity" />,
    label: 'Electricity',
    key: 'electricity',
  },
  {
    icon: <IconCollection name="pool" />,
    label: 'Pool maintenance',
    key: 'pool_maintenance',
  },
];

/**
 * Process services data from public data
 * @param {Object} publicData - The public data object containing service information
 * @returns {Array} - Array of service objects with status and value
 */
const prepareServices = publicData => {
  if (!publicData) return [];

  return servicesConfig.map(service => {
    const rawValue = publicData[service.key];

    // Determine status based on value
    let status = 'x';
    let displayValue = '';

    if (rawValue === 'yes' || (!isNaN(rawValue) && Number(rawValue) > 0)) {
      status = 'check';

      // Special handling for cleaning service
      if (service.key === 'cleaning_weekly') {
        displayValue = `${rawValue}x Weekly cleaning`;
      } else if (service.valuePrefix) {
        displayValue = service.valuePrefix;
      }
    } else if (rawValue === 'no') {
      status = 'x';
    }

    return {
      ...service,
      value: displayValue,
      status,
    };
  });
};

const hasActiveServices = publicData => {
  if (!publicData) return false;

  return servicesConfig.some(service => {
    const rawValue = publicData[service.key];
    return rawValue === 'yes';
  });
};

/**
 * Custom listing fields component that displays amenities, services, and property details
 * @param {Object} props - Component props
 * @param {Object} props.publicData - Public data from the listing
 * @param {Object} props.intl - Intl object for translations
 */
const CustomListingFields = props => {
  const { publicData, intl } = props;

  const { categoryLevel1 } = publicData;
  const isLandforsale = categoryLevel1 === 'landforsale';
  const isRentals = categoryLevel1 === 'rentalvillas';

  const availableAmenities = prepareAmenities(publicData);
  const availablePropertyDetails = preparePropertyDetails(publicData);
  const availableServices = prepareServices(publicData);

  return (
    <>
      {!isLandforsale && (
        <div className={css.amenitiesContainer} id="amenities">
          <h2 className={css.amenitiesTitle}>{intl.formatMessage({ id: 'ListingPage.amenitiesTitle' })}</h2>
          <div className={css.amenitiesGrid}>
            {availableAmenities.map(a => (
              <div key={a.label} className={css.amenityItem}>
                <span className={css.amenityIcon}>{a.icon}</span>
                <span className={css.amenityLabel}>{a.label}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {isRentals && hasActiveServices(publicData) && (
        <div className={css.amenitiesContainer}>
          <h2 className={css.servicesTitle}>{intl.formatMessage({ id: 'ListingPage.servicesTitle' })}</h2>
          <div className={css.servicesContainer}>
            {availableServices.map(s => (
              <div
                key={s.label}
                className={
                  s.status === 'check' ? `${css.serviceItem} ${css.active}` : css.serviceItem
                }
              >
                <div>
                  <span className={css.serviceIcon}>{s.icon}</span>
                  <span className={css.serviceLabel}>{s.label}:</span>
                </div>

                <div className={css.serviceValueContainer}>
                  {s.value && <span className={css.serviceValue}>{s.value}</span>}
                  {s.status === 'check' ? (
                    <span className={css.serviceCheck}>
                      <IconCollection name="check" />
                    </span>
                  ) : (
                    <span className={css.serviceX}>
                      <IconCollection name="x" />
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className={css.propertyDetailsContainer} id="propertyDetails">
        <h2 className={css.propertyDetailsTitle}>{intl.formatMessage({ id: 'ListingPage.propertyDetailsTitle' })}</h2>
        <div className={css.propertyDetailList}>
          {availablePropertyDetails.map(d => (
            <div key={d.label} className={css.propertyDetailItem}>
              <span className={css.propertyDetailLabelWrapper}>
                <span className={css.propertyDetailIcon}>{d.icon}</span>
                <span className={css.propertyDetailLabel}>{d.label}</span>
              </span>
              <span className={css.propertyDetailValue}>{d.value}</span>
            </div>
          ))}
        </div>
      </div>
    </>
  );
};

export default CustomListingFields;
