import React, { useState } from 'react';
import { Heading, MessageBox } from '../../components';
import { richText } from '../../util/richText';
import ReactDOMServer from 'react-dom/server';

import css from './ListingPage.module.css';

const MIN_LENGTH_FOR_LONG_WORDS = 20;
const MAX_VISIBLE_CHARS = 300; // Characters to show before "Read More"

const SectionTextMaybe = props => {
  const [showMessageBox, setShowMessageBox] = useState(false);
  const { text, heading, showAsIngress = false, currentUser } = props;
  const history = useHistory();
  const [isExpanded, setIsExpanded] = useState(false);

  const textClass = showAsIngress ? css.ingress : css.text;

  // Check if text is long enough to need "Read More"
  const needsReadMore = text && text.length > MAX_VISIBLE_CHARS;

  // Process the full text with richText
  const fullContent = richText(text, {
    linkify: true,
    longWordMinLength: MIN_LENGTH_FOR_LONG_WORDS,
    longWordClass: css.longWord,
    breakChars: '/',
  });

  // Get the display content
  let displayContent = fullContent;
  if (needsReadMore && !isExpanded) {
    // Convert React elements to HTML string
    const htmlString = ReactDOMServer.renderToString(<span>{fullContent}</span>);

    // Remove HTML tags for character counting
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = htmlString;
    const plainText = tempDiv.textContent || tempDiv.innerText || '';

    if (plainText.length > MAX_VISIBLE_CHARS) {
      // Find the last space before the character limit
      const truncated = plainText.substring(0, MAX_VISIBLE_CHARS);
      const lastSpaceIndex = truncated.lastIndexOf(' ');

      let truncatedText;
      if (lastSpaceIndex > 0) {
        truncatedText = truncated.substring(0, lastSpaceIndex) + '...';
      } else {
        truncatedText = truncated + '...';
      }

      // Create simple HTML with the truncated text
      displayContent = `<span>${truncatedText}</span>`;
    }
  }

  const handleToggle = () => {
    setIsExpanded(!isExpanded);
  };

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

  const handleConfirm = () => {
    setShowMessageBox(false);
    history.push('/signup');
  };

  const handleCancel = () => {
    setShowMessageBox(false);
  };

  const handleClick = () => {
    if (currentUser) {
      window.open(urlWA, '_blank');
    } else {
      setShowMessageBox(true);
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
      <div className={textClass}>
        {needsReadMore && !isExpanded ? (
          <span dangerouslySetInnerHTML={{ __html: displayContent }} />
        ) : (
          <span>{fullContent}</span>
        )}
        {needsReadMore && (
          <button onClick={handleToggle} className={css.readMoreButton} type="button">
            {isExpanded ? 'Read Less' : 'Read More'}
          </button>
        )}
      </div>
    </section>
  );
};

export default SectionTextMaybe;
