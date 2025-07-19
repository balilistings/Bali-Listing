import React from 'react';
import PillSelector from '../PillSelector/PillSelector';

const servicesOptions = [
  { id: 'cleaning', label: 'Cleaning' },
  { id: 'electricity', label: 'Electricity' },
  { id: 'pool-maintenance', label: 'Pool maintenance' },
];

function ServicesSelector({ selectedService, onServiceChange, onReset }) {
  return (
    <PillSelector
      title="Services included"
      options={servicesOptions}
      selectedOption={selectedService}
      onOptionChange={onServiceChange}
      onReset={onReset}
    />
  );
}

export default ServicesSelector;
