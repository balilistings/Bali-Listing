import React from 'react';
import css from './Amenities.module.css';

const Amenities = props => {
  const { title, amenitiesData } = props;

  return (
    <div className={css.amenitiesContainer}>
      <h2 className={css.amenitiesTitle}>{title}</h2>
      <div className={css.amenitiesGridFixed}>
        {amenitiesData.map(amenity => (
          <div key={amenity.id} className={css.amenityItem}>
            <div className={css.amenityIcon}>
              <img src={amenity.icon} alt={amenity.label} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Amenities;
