import React from 'react';
import css from './AmenitiesSelector.module.css';
import { IconCollection } from '../../../../components';

const amenities = [
  { icon: <IconCollection name="wifi" />, name: 'Wifi', id: 'wifi' },
  { icon: <IconCollection name="pool" />, name: 'Pool', id: 'pool' },
  { icon: <IconCollection name="gym" />, name: 'Gym', id: 'gym' },
  { icon: <IconCollection name="pet" />, name: 'Pet Friendly', id: 'petfriendly' },
  { icon: <IconCollection name="desk" />, name: 'Working desk', id: 'workingdesk' },
  { icon: <IconCollection name="parking" />, name: 'Car parking', id: 'carparking' },
  { icon: <IconCollection name="kitchen" />, name: 'Kitchen', id: 'kitchen' },
  { icon: <IconCollection name="aircondition" />, name: 'Airconditioning', id: 'airco' },
];

function AmenitiesSelector({ selectedAmenities = [], onAmenitiesChange, onReset }) {
  const handleAmenityToggle = amenityId => {
    const newSelectedAmenities = selectedAmenities.includes(amenityId)
      ? selectedAmenities.filter(id => id !== amenityId)
      : [...selectedAmenities, amenityId];

    onAmenitiesChange(newSelectedAmenities);
  };

  const handleReset = () => {
    onAmenitiesChange([]);
    onReset();
  };

  return (
    <div className={css.container}>
      <div className={css.header}>
        <h3 className={css.title}>Amenities</h3>
        <button onClick={handleReset} className={css.resetButton}>
          Reset
        </button>
      </div>

      <div className={css.amenitiesGrid}>
        {amenities.map(amenity => (
          <button
            key={amenity.id}
            className={`${css.amenityPill} ${
              selectedAmenities.includes(amenity.id) ? css.selected : ''
            }`}
            onClick={() => handleAmenityToggle(amenity.id)}
          >
            <span className={css.amenityIcon}>{amenity.icon}</span>
            <span className={css.amenityName}>{amenity.name}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

export default AmenitiesSelector;
