import React from 'react';
import styles from './ListingPage.module.css';

const terms = [
  {
    label: 'Minimum rental period:',
    value: '3 months Minimum stay',
  },
  {
    label: 'Payment terms:',
    value: '3 months upfront + 1 month deposit',
  },
  {
    label: 'Cancellation policy:',
    value: '1-month notice required',
  },
];

const SectionTerms = () => (
  <section className={styles.sectionTermsWrapper}>
    <h2 className={styles.sectionTitle}>Rental Terms</h2>
    <div className={styles.termsList}>
      {terms.map(term => (
        <div className={styles.termRow} key={term.label}>
          <div className={styles.termLabel}>{term.label}</div>
          <div className={styles.termValue}>{term.value}</div>
        </div>
      ))}
    </div>
  </section>
);

export default SectionTerms;
