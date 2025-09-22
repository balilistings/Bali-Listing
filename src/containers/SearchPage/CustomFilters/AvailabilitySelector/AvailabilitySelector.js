import React from 'react';
import PillSelector from '../PillSelector/PillSelector';

const availabilityOptions = [
  { id: 'yes', label: 'CustomFilter.Availability.now' },
  { id: 'all', label: 'CustomFilter.Availability.all' },
];

function AvailabilitySelector({ selectedAvailability, onAvailabilityChange, onReset }) {
  const handleAvailabilityChange = (optionId) => {
    onAvailabilityChange(optionId === 'all' ? null : optionId);
  };

  return (
    <PillSelector
      title="CustomFilter.Availability.title"
      options={availabilityOptions}
      selectedOption={selectedAvailability || 'all'}
      onOptionChange={handleAvailabilityChange}
      onReset={onReset}
    />
  );
}

export default AvailabilitySelector;
