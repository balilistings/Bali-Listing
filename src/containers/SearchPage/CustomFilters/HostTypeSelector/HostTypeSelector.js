import React from 'react';
import PillSelector from '../PillSelector/PillSelector';

const hostTypeOptions = [
  { id: 'agent', label: 'Agent' },
  { id: 'direct-owner', label: 'Direct owner' },
];

function HostTypeSelector({ selectedHostType, onHostTypeChange, onReset }) {
  return (
    <PillSelector
      title="Communication for negotiation"
      options={hostTypeOptions}
      selectedOption={selectedHostType}
      onOptionChange={onHostTypeChange}
      onReset={onReset}
    />
  );
}

export default HostTypeSelector;
