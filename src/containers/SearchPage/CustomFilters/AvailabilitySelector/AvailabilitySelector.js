import React from 'react';
import PillSelector from '../PillSelector/PillSelector';
import { useIntl } from 'react-intl';


function AvailabilitySelector({ selectedAvailability, onAvailabilityChange, onReset }) {
  const intl = useIntl();

  const availabilityOptions = [
    { id: 'yes', label: intl.formatMessage({ id: 'CustomFilter.Availability.now' }) },
    { id: 'all', label: intl.formatMessage({ id: 'CustomFilter.Availability.all' }) },
  ];
  

  const handleAvailabilityChange = (optionId) => {
    onAvailabilityChange(optionId === 'all' ? null : optionId);
  };

  return (
    <PillSelector
      title={intl.formatMessage({ id: 'CustomFilter.Availability.title' })}
      options={availabilityOptions}
      selectedOption={selectedAvailability || 'all'}
      onOptionChange={handleAvailabilityChange}
      onReset={onReset}
    />
  );
}

export default AvailabilitySelector;
