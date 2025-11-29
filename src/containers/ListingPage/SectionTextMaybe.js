import React, { useState, useEffect } from 'react';
import { Heading } from '../../components';
import { richText } from '../../util/richText';
import ReactDOMServer from 'react-dom/server';

import css from './ListingPage.module.css';
import { FormattedMessage } from 'react-intl';

const MIN_LENGTH_FOR_LONG_WORDS = 20;
const MAX_VISIBLE_CHARS = 300; // Characters to show before "Read More"

const SectionTextMaybe = props => {
  const { text, heading, showAsIngress = false } = props;
  const [isExpanded, setIsExpanded] = useState(false);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

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
  let displayContent = '';
  if (needsReadMore && !isExpanded && isClient) {
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
    } else {
      displayContent = htmlString;
    }
  }

  const handleToggle = () => {
    setIsExpanded(!isExpanded);
  };

  return text ? (
    <section className={css.sectionText}>
      {heading ? (
        <Heading as="h2" rootClassName={css.sectionHeading}>
          {heading}
        </Heading>
      ) : null}
      <div className={textClass}>
        {needsReadMore && !isExpanded && isClient ? (
          <span dangerouslySetInnerHTML={{ __html: displayContent }} />
        ) : (
          <span>{fullContent}</span>
        )}
        {needsReadMore && (
          <button onClick={handleToggle} className={css.readMoreButton} type="button">
            <FormattedMessage
              id={isExpanded ? 'ListingPage.sectionText.readLess' : 'ListingPage.sectionText.readMore'}
            />
          </button>
        )}
      </div>
    </section>
  ) : null;
};

export default SectionTextMaybe;
