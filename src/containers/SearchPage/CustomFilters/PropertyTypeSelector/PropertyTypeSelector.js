import React from 'react';
import css from './PropertyTypeSelector.module.css';
import { FormattedMessage } from 'react-intl';

const propertyTypeOptions = [
  { id: 'villa', name: 'CustomFilter.PropertyType.villa' },
  { id: 'apartment', name: 'CustomFilter.PropertyType.apartment' },
  { id: 'house', name: 'CustomFilter.PropertyType.house' },
  { id: 'room', name: 'CustomFilter.PropertyType.room' },
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
        <h3 className={css.title}>
          <FormattedMessage id="CustomFilter.PropertyType.title" />
        </h3>
        <button onClick={handleReset} className={css.resetButton}>
          <FormattedMessage id="CustomFilters.reset" />
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
            <span className={css.amenityName}>
              <FormattedMessage id={property.name} />
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}

export default PropertyTypeSelector;
