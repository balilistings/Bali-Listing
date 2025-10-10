import React from 'react';
import { FormattedMessage } from 'react-intl';
import Button from '../Button/Button';
import css from './CTABlock.module.css';
import sofaSrc from './cta-sofa.webp';

const CTA = () => {
  return (
    <div className={css.root}>
      <div className={css.circleLineLeft} />
      <div className={css.circleLineRight} />
      <img src={sofaSrc} className={css.sofa} alt="cta-sofa" />

      <div className={css.content}>
        <div className={css.textContent}>
          <h1 className={css.title}>
            <FormattedMessage
              id="CTA.title"
              defaultMessage="Ready to list your villa or find your next home"
            />
          </h1>
          <p className={css.subtitle}>
            <FormattedMessage
              id="CTA.subtitle"
              defaultMessage="We're building the future of real estate in Bali"
            />
          </p>
          <p className={css.tagline}>
            <FormattedMessage id="CTA.tagline" defaultMessage="Smarter. Safer. Built for people." />
          </p>
          <Button className={css.button}>
            <FormattedMessage id="CTA.startButton" defaultMessage="Start now" />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default CTA;
