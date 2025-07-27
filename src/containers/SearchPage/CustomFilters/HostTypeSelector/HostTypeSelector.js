import React from 'react';
import PillSelector from '../PillSelector/PillSelector';

const hostTypeOptions = [
  { id: 'agent', label: 'Agent' },
  { id: 'owner', label: 'Owner' },
];

function HostTypeSelector({ selectedHostType, onHostTypeChange, onReset }) {
  return (
    <PillSelector
      title="Host type"
      options={hostTypeOptions}
      selectedOption={selectedHostType}
      onOptionChange={onHostTypeChange}
      onReset={onReset}
    />
  );
}

export default HostTypeSelector;
