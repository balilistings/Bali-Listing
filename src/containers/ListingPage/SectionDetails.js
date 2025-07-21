import React from 'react';
import css from './ListingPage.module.css';

const SectionDetails = ({ title, data }) => {
  return (
    <div className={css.saleDetails}>
      {title && <div className={css.detailTitle}>{title}</div>}

      {data.map((item, index) => (
        <div
          key={index}
          className={`${css.rowWrapper} ${index % 2 == 0 ? css.grayBackground : ''}`}
        >
          <div className={css.leaseRow}>
            <span className={css.label}>{item.label}</span>
            <span className={css.value}>{item.value}</span>
          </div>
        </div>
      ))}
      <div className={css.customDivider}>
        <hr />
      </div>
    </div>
  );
};

export default SectionDetails;
