import React from 'react';
import DropdownSelector from '../DropdownSelector/DropdownSelector';
import { useIntl } from 'react-intl';

const landTitleOptions = [
  { id: 'hakmilik' },
  { id: 'HGB' },
  { id: 'HGU' },
  { id: 'hakpakai' },
  { id: 'hakmilikatas' },
  { id: 'haksewa' },
];

function LandTitleSelector({ selectedLandTitles, onLandTitlesChange, onReset }) {
  const intl = useIntl();

  const options = landTitleOptions.map(option => ({
    ...option,
    label: intl.formatMessage({ id: `CustomFilter.LandTitle.${option.id}` }),
  }));

  return (
    <DropdownSelector
      title={intl.formatMessage({ id: 'CustomFilter.LandTitle.title' })}
      description={intl.formatMessage({ id: 'CustomFilter.LandTitle.description' })}
      options={options}
      selectedOptions={selectedLandTitles}
      onSelectionChange={onLandTitlesChange}
      onReset={onReset}
      placeholder={intl.formatMessage({ id: 'CustomFilter.LandTitle.placeholder' })}
    />
  );
}

export default LandTitleSelector;
