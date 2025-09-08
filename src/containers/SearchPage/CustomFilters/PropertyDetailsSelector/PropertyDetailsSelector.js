import React from 'react';
import css from './PropertyDetailsSelector.module.css';

const propertyDetailsOptions = [
  { id: 'open-livingroom', name: 'Open livingroom' },
  { id: 'closed-livingroom', name: 'Closed livingroom' },
  { id: 'furnished', name: 'Furnished' },
  { id: 'semi-furnished', name: 'Semi Furnished' },
  { id: 'unfurnished', name: 'Unfurnished' },
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
        <h3 className={css.title}>Property details</h3>
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
            <span className={css.amenityName}>{property.name}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

export default PropertyDetailsSelector;
