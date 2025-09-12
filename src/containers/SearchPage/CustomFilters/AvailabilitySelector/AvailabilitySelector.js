import React from 'react';
import PillSelector from '../PillSelector/PillSelector';

const availabilityOptions = [
  { id: 'yes', label: 'Available now' },
  { id: 'all', label: 'All availability' },
];

function AvailabilitySelector({ selectedAvailability, onAvailabilityChange, onReset }) {
  const handleAvailabilityChange = (optionId) => {
    onAvailabilityChange(optionId === 'all' ? null : optionId);
  };

  return (
    <PillSelector
      title="Availability"
      options={availabilityOptions}
      selectedOption={selectedAvailability || 'all'}
      onOptionChange={handleAvailabilityChange}
      onReset={onReset}
    />
  );
}

export default AvailabilitySelector;
