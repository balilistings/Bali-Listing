import React from 'react';
import DropdownSelector from '../DropdownSelector/DropdownSelector';
import { useIntl } from 'react-intl';

const landZoneOptions = [
  { id: 'Green', label: 'Green' },
  { id: 'Yellow', label: 'Yellow' },
  { id: 'Red', label: 'Red' },
  { id: 'Pink', label: 'Pink' },
  { id: 'Orange', label: 'Orange' },
];

function LandZoneSelector({ selectedLandZones, onLandZonesChange, onReset }) {
  const intl = useIntl();

  return (
    <DropdownSelector
      title={intl.formatMessage({ id: 'CustomFilter.LandZone.title' })}
      description={intl.formatMessage({ id: 'CustomFilter.LandZone.description' })}
      options={landZoneOptions}
      selectedOptions={selectedLandZones}
      onSelectionChange={onLandZonesChange}
      onReset={onReset}
      placeholder={intl.formatMessage({ id: 'CustomFilter.LandZone.placeholder' })}
    />
  );
}

export default LandZoneSelector;
