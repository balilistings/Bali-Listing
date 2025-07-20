import React from 'react';
import DropdownSelector from '../DropdownSelector/DropdownSelector';

const landZoneOptions = [
  { id: 'green', label: 'Green' },
  { id: 'yellow', label: 'Yellow' },
  { id: 'red', label: 'Red' },
  { id: 'pink', label: 'Pink' },
  { id: 'orange', label: 'Orange' },
];

function LandZoneSelector({ selectedLandZones, onLandZonesChange, onReset }) {
  return (
    <DropdownSelector
      title="Land zone"
      description="Select the zoning category that fits your purpose"
      options={landZoneOptions}
      selectedOptions={selectedLandZones}
      onSelectionChange={onLandZonesChange}
      onReset={onReset}
      placeholder="drop down Land Zone"
    />
  );
}

export default LandZoneSelector;
