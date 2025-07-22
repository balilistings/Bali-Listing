import React from 'react';
import css from './PropertyTypeSelector.module.css';

const propertyTypeOptions = [
  { id: 'villa', name: 'Villa' },
  { id: 'apartment', name: 'Apartment' },
  { id: 'house', name: 'House' },
  { id: 'room', name: 'Room' },
];

function PropertyTypeSelector({ selectedPropertyType, onPropertyTypeChange, onReset }) {
  const handleAmenityToggle = amenityId => {
    const newSelectedAmenities = selectedPropertyType.includes(amenityId)
      ? selectedPropertyType.filter(id => id !== amenityId)
      : [...selectedPropertyType, amenityId];

    onPropertyTypeChange(newSelectedAmenities);
  };

  const handleReset = () => {
    onPropertyTypeChange([]);
    onReset();
  };

  return (
    <div className={css.container}>
      <div className={css.header}>
        <h3 className={css.title}>Property Type</h3>
        <button onClick={handleReset} className={css.resetButton}>
          Reset
        </button>
      </div>

      <div className={css.amenitiesGrid}>
        {propertyTypeOptions.map(property => (
          <button
            key={property.id}
            className={`${css.amenityPill} ${
              selectedPropertyType.includes(property.id) ? css.selected : ''
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

export default PropertyTypeSelector;
