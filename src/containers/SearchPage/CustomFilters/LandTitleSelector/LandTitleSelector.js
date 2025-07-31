import React from 'react';
import DropdownSelector from '../DropdownSelector/DropdownSelector';

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
  return (
    <DropdownSelector
      title="Land title"
      description="Select the legal ownership type"
      options={landTitleOptions}
      selectedOptions={selectedLandTitles}
      onSelectionChange={onLandTitlesChange}
      onReset={onReset}
      placeholder="Select Land Title"
    />
  );
}

export default LandTitleSelector;
