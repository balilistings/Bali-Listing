import React from 'react';
import CounterSelector from '../CounterSelector/CounterSelector';

function BedroomsSelector({ bedrooms, onBedroomsChange, onReset }) {
  return (
    <CounterSelector
      title="Bedrooms"
      subtitle="Bedrooms number"
      description="Select the number of bedrooms you need"
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
