import React from 'react';
import css from './ListingPage.module.css';

const PropertyDetails = props => {
  const { title, details } = props;
  return (
    <div className={css.propertyDetailsContainer}>
      <div className={css.propertyTitle}>{title}</div>
      {details.map((item, index) => (
        <div className={css.propertyDetailCard} key={index}>
          <div className={css.propertyLeft}>
            <img src={item.icon} alt={item.label} className={css.propertyIcon} />
            <span>{item.label}</span>
          </div>
          <div className={css.propertyRight}>{item.value}</div>
        </div>
      ))}
      <div className={css.customDivider}>
        <hr />
      </div>
    </div>
  );
};

export default PropertyDetails;
