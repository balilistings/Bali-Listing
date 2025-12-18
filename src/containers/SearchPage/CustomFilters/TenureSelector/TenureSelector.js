import React from 'react';
import PillSelector from '../PillSelector/PillSelector';
import { useIntl } from 'react-intl';

const tenureOptions = [
  { id: 'freehold', label: 'CustomFilter.Tenure.freehold' },
  { id: 'leasehold', label: 'CustomFilter.Tenure.leasehold' },
];

function TenureSelector({ selectedTenure, onTenureChange, onReset }) {
  const intl = useIntl();
  return (
    <PillSelector
      title={intl.formatMessage({ id: 'CustomFilter.Tenure.title' })}
      options={tenureOptions}
      selectedOption={selectedTenure}
      onOptionChange={onTenureChange}
      onReset={onReset}
    />
  );
}

export default TenureSelector;
