import React from 'react';
import PillSelector from '../PillSelector/PillSelector';

const tenureOptions = [
  { id: 'freehold', label: 'Freehold' },
  { id: 'leasehold', label: 'Leasehold' },
];

function TenureSelector({ selectedTenure, onTenureChange, onReset }) {
  return (
    <PillSelector
      title="Freehold or leasehold"
      options={tenureOptions}
      selectedOption={selectedTenure}
      onOptionChange={onTenureChange}
      onReset={onReset}
    />
  );
}

export default TenureSelector;
