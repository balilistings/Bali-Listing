import React from 'react';
import styles from './ListingPage.module.css';

const prepareTerms = publicData => {
  const t = [];

  if (publicData.minimum) {
    t.push({
      label: 'Minimum rental period:',
      value: publicData.minimum,
      key: 'minimum',
    });
  }

  if (publicData.payment) {
    t.push({
      label: 'Payment terms:',
      value: publicData.payment,
      key: 'payment',
    });
  }

  if (publicData.Freehold !== 'freehold' && publicData.numberofyears) {
    t.push({
      label: 'Lease duration:',
      value: publicData.numberofyears,
      key: 'numberofyears',
    });
  }

  return t;
};

const SectionTerms = ({ publicData }) => {
  const terms = prepareTerms(publicData);

  return (
    <section className={styles.sectionTermsWrapper}>
      <h2 className={styles.sectionTitle}>Rental Terms</h2>
      <div className={styles.termsList}>
        {terms.map(term => (
          <div className={styles.termRow} key={term.key}>
            <div className={styles.termLabel}>{term.label}</div>
            <div className={styles.termValue}>{term.value}</div>
          </div>
        ))}
      </div>
    </section>
  );
};

export default SectionTerms;
