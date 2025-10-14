import React from 'react';
import css from './PropertyDetailsSelector.module.css';
import { FormattedMessage } from 'react-intl';

const propertyDetailsOptions = [
  { id: 'open-livingroom', name: 'CustomFilter.PropertyDetails.open-livingroom' },
  { id: 'closed-livingroom', name: 'CustomFilter.PropertyDetails.closed-livingroom' },
  { id: 'furnished', name: 'CustomFilter.PropertyDetails.furnished' },
  { id: 'semi-furnished', name: 'CustomFilter.PropertyDetails.semi-furnished' },
  { id: 'unfurnished', name: 'CustomFilter.PropertyDetails.unfurnished' },
];

function PropertyDetailsSelector({ selectedPropertyDetail, onPropertyDetailChange, onReset }) {
  const handleAmenityToggle = amenityId => {
    const newSelectedAmenities = selectedPropertyDetail.includes(amenityId)
      ? selectedPropertyDetail.filter(id => id !== amenityId)
      : [...selectedPropertyDetail, amenityId];

    onPropertyDetailChange(newSelectedAmenities);
  };

  return (
    <div className={css.container}>
      <div className={css.header}>
        <h3 className={css.title}>
          <FormattedMessage id="CustomFilter.PropertyDetails.title" />
        </h3>
        <button onClick={onReset} className={css.resetButton}>
          Reset
        </button>
      </div>

      <div className={css.amenitiesGrid}>
        {propertyDetailsOptions.map(property => (
          <button
            key={property.id}
            className={`${css.amenityPill} ${
              selectedPropertyDetail.includes(property.id) ? css.selected : ''
            }`}
            onClick={() => handleAmenityToggle(property.id)}
          >
            <span className={css.amenityName}>
              <FormattedMessage id={property.name} />
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}

export default PropertyDetailsSelector;
