import React from 'react';
import PillSelector from '../PillSelector/PillSelector';

const propertyTypeOptions = [
  { id: 'villa', label: 'Villa' },
  { id: 'apartment', label: 'Apartment' },
  { id: 'house', label: 'House' },
  { id: 'room', label: 'Room' },
];

function PropertyTypeSelector({ selectedPropertyType, onPropertyTypeChange, onReset }) {
  return (
    <PillSelector
      title="Property type"
      options={propertyTypeOptions}
      selectedOption={selectedPropertyType}
      onOptionChange={onPropertyTypeChange}
      onReset={onReset}
    />
  );
}

export default PropertyTypeSelector;
