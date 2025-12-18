import React from 'react';
import DropdownSelector from '../DropdownSelector/DropdownSelector';
import { useIntl } from 'react-intl';

const landTitleOptions = [
  { id: 'hakmilik', label: 'Right of ownership (Hak Milik)' },
  { id: 'HGB', label: 'Right to Build (Hak Guna Bangunan)' },
  { id: 'HGU', label: 'Right to Cultivate (Hak Guna Usaha)' },
  { id: 'hakpakai', label: 'Right to Use (Hak Pakai)' },
  {
    id: 'hakmilikatas',
    label: 'Right to Ownership over Stacked Units (Hak Milik Atas Satuan Rumah Susun)',
  },
  { id: 'haksewa', label: 'Lease (Hak Sewa)' },
];

function LandTitleSelector({ selectedLandTitles, onLandTitlesChange, onReset }) {
  const intl = useIntl();

  return (
    <DropdownSelector
      title={intl.formatMessage({ id: 'CustomFilter.LandTitle.title' })}
      description={intl.formatMessage({ id: 'CustomFilter.LandTitle.description' })}
      options={landTitleOptions}
      selectedOptions={selectedLandTitles}
      onSelectionChange={onLandTitlesChange}
      onReset={onReset}
      placeholder={intl.formatMessage({ id: 'CustomFilter.LandTitle.placeholder' })}
    />
  );
}

export default LandTitleSelector;
