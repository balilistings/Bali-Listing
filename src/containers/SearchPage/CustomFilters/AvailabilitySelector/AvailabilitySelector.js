import React from 'react';
import PillSelector from '../PillSelector/PillSelector';

const availabilityOptions = [
  { id: 'yes', label: 'Available now' },
  { id: 'no', label: 'All availability' },
];

function AvailabilitySelector({ selectedAvailability, onAvailabilityChange, onReset }) {
  return (
    <PillSelector
      title="Availability"
      options={availabilityOptions}
      selectedOption={selectedAvailability}
      onOptionChange={onAvailabilityChange}
      onReset={onReset}
    />
  );
}

export default AvailabilitySelector;
