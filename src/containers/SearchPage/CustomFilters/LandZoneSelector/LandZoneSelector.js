import React from 'react';
import DropdownSelector from '../DropdownSelector/DropdownSelector';

const landZoneOptions = [
  { id: 'Green', label: 'Green' },
  { id: 'Yellow', label: 'Yellow' },
  { id: 'Red', label: 'Red' },
  { id: 'Pink', label: 'Pink' },
  { id: 'Orange', label: 'Orange' },
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
