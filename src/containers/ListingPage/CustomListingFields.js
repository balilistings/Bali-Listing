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

const prepareAmenities = publicData => {
  if (!publicData) return [];

  // Only process the specific keys we want to display
  return amenitiesConfig.filter(amenity => {
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
    // Add more transformations as needed
  };

  if (!publicData) return [];
  const listingType = publicData.categoryLevel1;
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

const services = [
  {
    icon: <IconCollection name="cleaning" />,
    label: 'Cleaning',
    value: '2x Weekly cleaning',
    status: 'check', // custom = has value, check = included, x = not included
  },
  {
    icon: <IconCollection name="elictricity" />,
    label: 'Electricity',
    value: '',
    status: 'check',
  },
  {
    icon: <IconCollection name="pool" />,
    label: 'Pool maintenance',
    value: '',
    status: 'x',
  },
];

const CustomListingFields = props => {
  const { publicData, isLandforsale } = props;

  const availableAmenities = prepareAmenities(publicData);
  const availablePropertyDetails = preparePropertyDetails(publicData);

  return (
    <>
      {!isLandforsale && (
        <div className={css.amenitiesContainer} id="amenities">
          <h2 className={css.amenitiesTitle}>Amenities</h2>
          <div className={css.amenitiesGrid}>
            {availableAmenities.map(a => (
              <div key={a.label} className={css.amenityItem}>
                <span className={css.amenityIcon}>{a.icon}</span>
                <span className={css.amenityLabel}>{a.label}</span>
              </div>
            ))}
          </div>

          <div className={css.propertyDetailsContainer}>
            <h2 className={css.propertyDetailsTitle}>Property Details</h2>
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
        </div>
      )}

      {/* Uncomment this when we have services */}
      {publicData.categoryLevel1 === 'rentalvillas' && (
        <div className={css.servicesContainerWrapper}>
          <h2 className={css.servicesTitle}>Services included</h2>
          <div className={css.servicesContainer}>
            {services.map(s => (
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
      {/* 
      <div className={css.propertyDetailsContainer} id="propertyDetails">
        <h2 className={css.propertyDetailsTitle}>Property Details</h2>
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
      </div> */}
    </>
  );
};

export default CustomListingFields;
