import React from 'react';
import PillSelector from '../PillSelector/PillSelector';
import { useIntl } from 'react-intl';



function HostTypeSelector({ selectedHostType, onHostTypeChange, onReset }) {
  const intl = useIntl();

  const hostTypeOptions = [
    { id: 'agent', label: intl.formatMessage({ id: 'UserCard.Agent' }) },
    { id: 'owner', label: intl.formatMessage({ id: 'UserCard.Owner' }) },
  ];

  return (
    <PillSelector
      title={intl.formatMessage({ id: 'CustomFilter.HostType.title' })}
      options={hostTypeOptions}
      selectedOption={selectedHostType}
      onOptionChange={onHostTypeChange}
      onReset={onReset}
    />
  );
}

export default HostTypeSelector;
