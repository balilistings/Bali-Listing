import React from 'react';
import css from './LocationSelector.module.css';
import { Form as FinalForm } from 'react-final-form';
import { Form } from '../../../../components';
import FilterLocation from '../../../PageBuilder/Primitives/SearchCTA/FilterLocation/FilterLocation';

const locations = [
  'Nearby me',
  'Canggu',
  'Seminyak',
  'Kuta',
  'Umalas',
  'Denpasar',
  'Pererenan',
  'Gianyar',
  'Ubud',
];

function LocationSelector({ selectedLocation, onLocationChange, onReset }) {
  return (
    <div className={css.container}>
      <div className={css.header}>
        <h3 className={css.title}>Location</h3>
        <button onClick={onReset} className={css.resetButton}>
          Reset
        </button>
      </div>

      <FinalForm
        onSubmit={() => {}}
        // {...props}
        render={({ fieldRenderProps, handleSubmit }) => {
          return (
            <Form
              role="search"
              onSubmit={handleSubmit}
              // className={classNames(css.gridContainer, getGridCount(fieldCountForGrid))}
            >
              <div className={css.filterField} key="locationSearch">
                <FilterLocation setSubmitDisabled={() => {}} Searchicon={true}/>
              </div>
            </Form>
          );
        }}
      />

      <div className={css.locationGrid}>
        {locations.map(location => (
          <button
            key={location}
            className={`${css.locationPill} ${selectedLocation === location ? css.selected : ''}`}
            onClick={() => onLocationChange(location)}
          >
            {location}
          </button>
        ))}
      </div>
    </div>
  );
}

export default LocationSelector;
