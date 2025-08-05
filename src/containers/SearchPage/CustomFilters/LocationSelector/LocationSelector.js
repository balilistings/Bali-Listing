import React, { useState } from 'react';
import css from './LocationSelector.module.css';
import { Form as FinalForm } from 'react-final-form';
import { Form } from '../../../../components';
import FilterLocation from '../../../PageBuilder/Primitives/SearchCTA/FilterLocation/FilterLocation';
import EventBus from '../../../../util/EventBus';
import { mapDetails } from './helper';

const locations = [
  {
    id: 'nearBy',
    name: 'Nearby me',
  },
  {
    id: 'canggu',
    name: 'Canggu',
    mapDetails: mapDetails['canggu'],
  },
  {
    id: 'seminyak',
    name: 'Seminyak',
    mapDetails: mapDetails['seminyak'],
  },
  {
    id: 'kuta',
    name: 'Kuta',
    mapDetails: mapDetails['kuta'],
  },
  {
    id: 'umalas',
    name: 'Umalas',
    mapDetails: mapDetails['umalas'],
  },
  {
    id: 'denpasar',
    name: 'Denpasar',
    mapDetails: mapDetails['denpasar'],
  },
  {
    id: 'pererean',
    name: 'Pererenan',
    mapDetails: mapDetails['pererean'],
  },
  {
    id: 'gianyar',
    name: 'Gianyar',
    mapDetails: mapDetails['gianyar'],
  },
  {
    id: 'ubud',
    name: 'Ubud',
    mapDetails: mapDetails['ubud'],
  },
];

function LocationSelector({ selectedLocation, onLocationChange, onReset }) {
  const [isActive, setIsActive] = useState();

  const handleLocationsClick = async location => {
    try {
      // console.log('called', location);
      setIsActive(location);
      if (location.id === 'nearBy') {
        EventBus.emit('selectPrediction', {
          id: 'current-location',
          predictionPlace: {},
        });
      } else {
        EventBus.emit('selectPrediction', mapDetails[location.id]);
      }
    } catch (error) {
      console.log('errorrrrrr', error);
    }
  };

  const handleReset = () => {
    setIsActive(null);
    EventBus.emit('resetLocation');
    onReset();
  };

  const handleLocationChange = location => {
    if (
      mapDetails[(isActive?.id)] &&
      location.selectedPlace.address === mapDetails[(isActive?.id)]['place_name_en-GB']
    ) {
      // console.log('location', location);
    } else {
      onLocationChange(location);
    }
  };

  return (
    <div className={css.container}>
      <div className={css.header}>
        <h3 className={css.title}>Location</h3>
        <button onClick={handleReset} className={css.resetButton}>
          Reset
        </button>
      </div>

      <FinalForm
        onSubmit={() => {}}
        render={({ fieldRenderProps, handleSubmit }) => {
          return (
            <Form
              role="search"
              onSubmit={handleSubmit}
              // className={classNames(css.gridContainer, getGridCount(fieldCountForGrid))}
            >
              <>
                <div className={css.filterField} key="locationSearch">
                  <FilterLocation
                    setSubmitDisabled={() => {}}
                    Searchicon={true}
                    onUpdateLocationSelector={handleLocationChange}
                  />
                </div>

                <div className={css.locationGrid}>
                  {locations.map(location => (
                    <button
                      type="button"
                      key={location.id}
                      className={`${css.locationPill} ${
                        isActive?.id === location.id ? css.selected : ''
                      }`}
                      onClick={() => handleLocationsClick(location)}
                    >
                      {location.name}
                    </button>
                  ))}
                </div>
              </>
            </Form>
          );
        }}
      />
    </div>
  );
}

export default LocationSelector;
