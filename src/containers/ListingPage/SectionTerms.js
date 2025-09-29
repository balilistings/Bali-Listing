import React from 'react';
import styles from './ListingPage.module.css';

const prepareTerms = publicData => {
  const t = [];

  if (publicData.minimum) {
    t.push({
      label: 'ListingPage.minimum',
      value: publicData.minimum,
      key: 'minimum',
    });
  }

  if (publicData.payment) {
    t.push({
      label: 'ListingPage.payment',
      value: publicData.payment,
      key: 'payment',
    });
  }

  if (publicData.Freehold !== 'freehold' && publicData.numberofyears) {
    t.push({
      label: 'ListingPage.numberofyears',
      value: publicData.numberofyears,
      key: 'numberofyears',
    });
  }

  return t;
};

const SectionTerms = ({ publicData, intl }) => {
  const terms = prepareTerms(publicData);

  return (
    <section className={styles.sectionTermsWrapper}>
      <h2 className={styles.sectionTitle}>
        {intl.formatMessage({ id: 'ListingPage.rentalTermsTitle' })}
      </h2>
      <div className={styles.termsList}>
        {terms.map(term => (
          <div className={styles.termRow} key={term.key}>
            <div className={styles.termLabel}>{intl.formatMessage({ id: term.label })}:</div>
            <div className={styles.termValue}>{term.value}</div>
          </div>
        ))}
      </div>
    </section>
  );
};

export default SectionTerms;
