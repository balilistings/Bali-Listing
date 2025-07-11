import React from 'react';
import { Heading } from '../../components';
import img from '../../assets/Button WhatsApp.svg';
import { richText } from '../../util/richText';

import css from './ListingPage.module.css';

const MIN_LENGTH_FOR_LONG_WORDS = 20;
import { useHistory } from 'react-router-dom';

const SectionTextMaybe = props => {
  const { text, heading, showAsIngress = false, currentUser } = props;
  const history = useHistory();
  const textClass = showAsIngress ? css.ingress : css.text;

  const content = richText(text, {
    linkify: true,
    longWordMinLength: MIN_LENGTH_FOR_LONG_WORDS,
    longWordClass: css.longWord,
    breakChars: '/',
  });

  let urlWA = '';
  if (heading === 'Phone number') {
    const rawNumber = String(content[1]);
    const numberWA =
      rawNumber.charAt(0) === '0'
        ? '62' + rawNumber.slice(1)
        : rawNumber.charAt(0) === '+'
        ? rawNumber.slice(1)
        : rawNumber;

    urlWA = `https://wa.me/${numberWA}`;
  }

  const handleClick = () => {
    if (currentUser) {
      window.open(urlWA, '_blank');
    } else {
      const confirm = window.confirm(
        'Please sign up or log in to contact this property owner on WhatsApp.'
      );
      if (confirm) {
        history.push('/signup');
      }
    }
  };

  if (!text || heading === 'Link to Facebook post') {
    return null;
  }

  return (
    <section className={css.sectionText}>
      {heading ? (
        <Heading as="h2" rootClassName={css.sectionHeading}>
          {heading}
        </Heading>
      ) : null}

      {heading === 'Phone number' ? (
        <img
          src={img}
          alt="Contact via WhatsApp"
          style={{ cursor: 'pointer' }}
          onClick={handleClick}
        />
      ) : (
        <span>{content}</span>
      )}
    </section>
  );
};

export default SectionTextMaybe;
