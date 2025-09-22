import React from 'react';
import CounterSelector from '../CounterSelector/CounterSelector';
import { useIntl } from 'react-intl';

function BedroomsSelector({ bedrooms, onBedroomsChange, onReset }) {
  const intl = useIntl();

  return (
    <CounterSelector
      title={intl.formatMessage({ id: "PageBuilder.SearchCTA.BedroomFilter.mainLabel" })}
      subtitle={intl.formatMessage({ id: 'CustomFilter.Bedroom.label' })}
      description={intl.formatMessage({ id: 'CustomFilter.Bedroom.description' })}
      value={bedrooms}
      onValueChange={onBedroomsChange}
      onReset={onReset}
      min={0}
      max={6}
      showPlus={true}
    />
  );
}

export default BedroomsSelector;
