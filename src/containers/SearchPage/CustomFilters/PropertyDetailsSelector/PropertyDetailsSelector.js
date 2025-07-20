import React from 'react';
import PillSelector from '../PillSelector/PillSelector';

const propertyDetailsOptions = [
  { id: 'open-livingroom', label: 'Open livingroom' },
  { id: 'closed-livingroom', label: 'Closed livingroom' },
  { id: 'furnished', label: 'Furnished' },
  { id: 'unfurnished', label: 'Unfurnished' },
];

function PropertyDetailsSelector({ selectedPropertyDetail, onPropertyDetailChange, onReset }) {
  return (
    <PillSelector
      title="Property details"
      options={propertyDetailsOptions}
      selectedOption={selectedPropertyDetail}
      onOptionChange={onPropertyDetailChange}
      onReset={onReset}
    />
  );
}

export default PropertyDetailsSelector;
