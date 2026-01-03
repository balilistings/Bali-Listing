import React, { useState } from 'react';
import css from './LocationSelector.module.css';
import { Form as FinalForm } from 'react-final-form';
import { Form } from '../../../../components';
import FilterLocation from '../../../PageBuilder/Primitives/SearchCTA/FilterLocation/FilterLocation';
import EventBus from '../../../../util/EventBus';
import { mapDetails } from './helper';
import { FormattedMessage } from 'react-intl';

const locations = [
  {
    id: 'nearBy',
    name: 'LocationFilter.nearby',
  },
  {
    id: 'canggu',
    name: 'Canggu',
    mapNameToUse: 'canggu, badung regency',
    mapDetails: mapDetails['canggu'],
  },
  {
    id: 'seminyak',
    name: 'Seminyak',
    mapNameToUse: 'Seminyak Beach, Bali, Indonesia',
    mapDetails: mapDetails['seminyak'],
  },
  {
    id: 'kuta',
    name: 'Kuta',
    mapNameToUse: 'Kuta Beach, Kuta, Badung Regency, Bali, Indonesia',
    mapDetails: mapDetails['kuta'],
  },
  {
    id: 'umalas',
    name: 'Umalas',
    mapNameToUse: 'Kerobokan Kelod, Kec. Kuta Utara, Kabupaten Badung, Bali, Indonesia',
    mapDetails: mapDetails['umalas'],
  },
  {
    id: 'denpasar',
    name: 'Denpasar',
    mapNameToUse: 'Denpasar, Denpasar City, Bali, Indonesia',
    mapDetails: mapDetails['denpasar'],
  },
  {
    id: 'pererean',
    name: 'Pererenan',
    mapNameToUse: 'Pererenan, Mengwi, Badung Regency, Bali, Indonesia',
    mapDetails: mapDetails['pererean'],
  },
  {
    id: 'gianyar',
    name: 'Gianyar',
    mapNameToUse: 'Gianyar, Gianyar Regency, Bali, Indonesia',
    mapDetails: mapDetails['gianyar'],
  },
  {
    id: 'ubud',
    name: 'Ubud',
    mapNameToUse: 'Ubud, Gianyar Regency, Bali, Indonesia',
    mapDetails: mapDetails['ubud'],
  },
];

function LocationSelector({ selectedLocation, onLocationChange, onReset }) {
  const [isActive, setIsActive] = useState();

  const handleLocationsClick = async location => {
    try {
      setIsActive(location);
      if (location.id === 'nearBy') {
        EventBus.emit('selectPrediction', {
          id: 'current-location',
          predictionPlace: {},
        });
      } else {
        EventBus.emit('selectPrediction', location.mapNameToUse);
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
      mapDetails[isActive?.id] &&
      location.selectedPlace.address === mapDetails[isActive?.id]['place_name_en-GB']
    ) {
    } else {
      onLocationChange(location);
    }
  };

  return (
    <div className={css.container}>
      <div className={css.header}>
        <h3 className={css.title}>
          <FormattedMessage id="PageBuilder.SearchCTA.location" />
        </h3>
        <button onClick={handleReset} className={css.resetButton}>
          <FormattedMessage id="CustomFilters.reset" />
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
                      {location.id === 'nearBy' ? (
                        <FormattedMessage id={location.name} />
                      ) : (
                        location.name
                      )}
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
