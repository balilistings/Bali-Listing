import React from 'react';
import DropdownSelector from '../DropdownSelector/DropdownSelector';
import { useIntl } from 'react-intl';

const landZoneOptions = [
  { id: 'Green' },
  { id: 'Yellow' },
  { id: 'Red' },
  { id: 'Pink' },
  { id: 'Orange' },
];

function LandZoneSelector({ selectedLandZones, onLandZonesChange, onReset }) {
  const intl = useIntl();

  const options = landZoneOptions.map(option => ({
    ...option,
    label: intl.formatMessage({ id: `CustomFilter.LandZone.${option.id}` }),
  }));

  return (
    <DropdownSelector
      title={intl.formatMessage({ id: 'CustomFilter.LandZone.title' })}
      description={intl.formatMessage({ id: 'CustomFilter.LandZone.description' })}
      options={options}
      selectedOptions={selectedLandZones}
      onSelectionChange={onLandZonesChange}
      onReset={onReset}
      placeholder={intl.formatMessage({ id: 'CustomFilter.LandZone.placeholder' })}
    />
  );
}

export default LandZoneSelector;
