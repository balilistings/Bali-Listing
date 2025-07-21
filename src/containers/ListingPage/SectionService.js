import React from 'react';
import css from './ListingPage.module.css';

import CheckIcon from '../../assets/icons/Checklist.svg';
import CrossIcon from '../../assets/icons/Cross.svg';

import CleaningIcon from '../../assets/icons/Cleaning.svg';
import ElectricityIcon from '../../assets/icons/Electricity.svg';
import PoolIcon from '../../assets/icons/PoolMaintenance.svg';

const SectionService = props => {
  const { title, services } = props;

  return (
    <div className={css.servicesWrapper}>
      <div className={css.serviceHeading}>{title}</div>
      {services.map((service, index) => (
        <div
          key={index}
          className={`${css.serviceItem} ${service.included ? css.included : css.excluded}`}
        >
          <div className={css.serviceIcon}>
            <img src={service.icon} alt={`${service.label} icon`} />
          </div>
          <div className={css.serviceContent}>
            <span className={css.serviceLabel}>{service.label}:</span>
          </div>
          <div className={css.serviceStatus}>
            {service.included && service.description && (
              <span className={css.serviceDescription}>{service.description}</span>
            )}
            <img
              src={service.included ? CheckIcon : CrossIcon}
              alt={service.included ? 'Included' : 'Not included'}
            />
          </div>
        </div>
      ))}
    </div>
  );
};

export default SectionService;
