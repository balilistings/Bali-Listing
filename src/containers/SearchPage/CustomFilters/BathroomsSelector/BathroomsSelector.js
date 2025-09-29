import React from 'react';
import CounterSelector from '../CounterSelector/CounterSelector';
import { useIntl } from 'react-intl';

function BathroomsSelector({ bathrooms, onBathroomsChange, onReset }) {
  const intl = useIntl();

  return (
    <CounterSelector
      title={intl.formatMessage({ id: 'CustomFilter.Bathrooms.title' })}
      subtitle={intl.formatMessage({ id: 'CustomFilter.Bathrooms.label' })}
      description={intl.formatMessage({ id: 'CustomFilter.Bathrooms.description' })}
      value={bathrooms}
      onValueChange={onBathroomsChange}
      onReset={onReset}
      min={0}
      max={6}
    />
  );
}

export default BathroomsSelector;
