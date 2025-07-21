import React from 'react';
import CounterSelector from '../CounterSelector/CounterSelector';

function BathroomsSelector({ bathrooms, onBathroomsChange, onReset }) {
  return (
    <CounterSelector
      title="Bathrooms"
      subtitle="Bathrooms number"
      description="Select the number of bathrooms you need"
      value={bathrooms}
      onValueChange={onBathroomsChange}
      onReset={onReset}
      min={0}
      max={6}
    />
  );
}

export default BathroomsSelector;
