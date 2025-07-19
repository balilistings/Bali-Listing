import React from 'react';
import css from './AmenitiesSelector.module.css';

const amenities = [
  {
    id: 'wifi',
    name: 'Wifi',
    icon: '📶',
  },
  {
    id: 'pool',
    name: 'Pool',
    icon: '🏊',
  },
  {
    id: 'gym',
    name: 'Gym',
    icon: '🏋️',
  },
  {
    id: 'pet-friendly',
    name: 'Pet Friendly',
    icon: '🐕',
  },
  {
    id: 'working-desk',
    name: 'Working desk',
    icon: '💻',
  },
  {
    id: 'car-parking',
    name: 'Car parking',
    icon: '🚗',
  },
  {
    id: 'kitchen',
    name: 'Kitchen',
    icon: '🍳',
  },
  {
    id: 'airconditioning',
    name: 'Airconditioning',
    icon: '❄️',
  },
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
      {/* Header */}
      <div className={css.header}>
        <h3 className={css.title}>Amenities</h3>
        <button onClick={handleReset} className={css.resetButton}>
          Reset
        </button>
      </div>

      {/* Amenities Grid */}
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
