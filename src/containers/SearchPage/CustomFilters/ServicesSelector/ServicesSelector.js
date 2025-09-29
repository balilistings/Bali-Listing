import React from 'react';
import css from '../AmenitiesSelector/AmenitiesSelector.module.css';
import { FormattedMessage } from 'react-intl';

const servicesOptions = [
  { name: 'Cleaning', id: 'CustomFilter.Services.cleaning_weekly' },
  { name: 'Electricity', id: 'CustomFilter.Services.electricity' },
  { name: 'Pool maintenance', id: 'CustomFilter.Services.pool_maintenance' },
];

function ServicesSelector({ selectedServices = [], onServiceChange, onReset }) {
  const handleServiceToggle = serviceId => {
    const newSelectedServices = selectedServices.includes(serviceId)
      ? selectedServices.filter(id => id !== serviceId)
      : [...selectedServices, serviceId];

    onServiceChange(newSelectedServices);
  };

  const handleReset = () => {
    onServiceChange([]);
    onReset();
  };

  return (
    <div className={css.container}>
      <div className={css.header}>
        <h3 className={css.title}>
          <FormattedMessage id="CustomFilter.Services.title" />
        </h3>
        <button onClick={handleReset} className={css.resetButton}>
          Reset
        </button>
      </div>

      <div className={css.amenitiesGrid}>
        {servicesOptions.map(service => (
          <button
            key={service.id}
            className={`${css.amenityPill} ${
              selectedServices.includes(service.id) ? css.selected : ''
            }`}
            onClick={() => handleServiceToggle(service.id)}
          >
            <span className={css.amenityName}>
              <FormattedMessage id={service.name} />
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}

export default ServicesSelector;