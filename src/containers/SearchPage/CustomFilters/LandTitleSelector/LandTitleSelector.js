import React from 'react';
import DropdownSelector from '../DropdownSelector/DropdownSelector';

const landTitleOptions = [
  { id: 'hak-milik', label: 'Right of ownership (Hak Milik)' },
  { id: 'hak-guna-bangunan', label: 'Right to Build (Hak Guna Bangunan)' },
  { id: 'hak-guna-usaha', label: 'Right to Cultivate (Hak Guna Usaha)' },
  { id: 'hak-pakai', label: 'Right to Use (Hak Pakai)' },
  {
    id: 'hak-milik-satuan',
    label: 'Right to Ownership over Stacked Units (Hak Milik Atas Satuan Rumah Susun)',
  },
  { id: 'hak-sewa', label: 'Lease (Hak Sewa)' },
];

function LandTitleSelector({ selectedLandTitles, onLandTitlesChange, onReset }) {
  return (
    <DropdownSelector
      title="Land title"
      description="Select the legal ownership type"
      options={landTitleOptions}
      selectedOptions={selectedLandTitles}
      onSelectionChange={onLandTitlesChange}
      onReset={onReset}
      placeholder="drop down Land Title"
    />
  );
}

export default LandTitleSelector;
