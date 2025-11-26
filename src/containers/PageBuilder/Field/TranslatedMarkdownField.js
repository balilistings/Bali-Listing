import React from 'react';
import { useIntl } from 'react-intl';
import renderMarkdown from '../markdownProcessor';
import { Link } from '../Primitives/Link';
import { useSelector } from 'react-redux';

const TranslatedLink = linkProps => {
  const { children, ...rest } = linkProps;

  const intl = useIntl();

  const translationMap = {
    'About Us': 'TranslatedLink.aboutUs',
    'Search listings': 'TranslatedLink.searchListings',
    'Post a new listing': 'TranslatedLink.postNewListing',
    'Terms of service': 'TranslatedLink.termsOfService',
    'Terms of privacy': 'TranslatedLink.termsOfPrivacy',
    Blog: 'TranslatedLink.blog',
    'Contact us': 'TranslatedLink.contactUs',
    FAQ: 'TranslatedLink.faq',
  };

  // Check if the child is text that needs translation
  const translatedChildren = React.Children.map(children, child => {
    if (typeof child === 'string' && translationMap[child]) {
      return intl.formatMessage({ id: translationMap[child] });
    }
    return child;
  });

  return <Link {...rest}>{translatedChildren}</Link>;
};

/**
 * A custom markdown field component that translates link text and headers
 */
const TranslatedMarkdownField = props => {
  const { content, components } = props;
  const intl = useIntl();

  const isProvider = useSelector(
    state => state.user.currentUser?.attributes.profile.publicData.userType === 'provider'
  );
  const isLoggedIn = useSelector(state => state.user.currentUser?.id.uuid);

  const sanitizedContent =
    !isLoggedIn || isProvider ? content : content.replace('- [Post a new listing](/l/new)\n', '');

  // Define the mapping for headers and other content that needs translation
  const headerTranslationMap = {
    Pages: 'TranslatedLink.pages',
    Location: 'TranslatedLink.location',
  };

  // Function to translate markdown content
  const translateContent = content => {
    let translatedContent = content;

    // Translate headers and other text content based on headerTranslationMap
    Object.entries(headerTranslationMap).forEach(([original, translationId]) => {
      // Replace both the full header text and standalone occurrences
      const headerPattern = new RegExp(`(##\\s*)${original}`, 'g');
      translatedContent = translatedContent.replace(headerPattern, (match, headerPrefix) => {
        return headerPrefix + intl.formatMessage({ id: translationId });
      });
    });

    return translatedContent;
  };

  // Custom link component that translates the text

  // Use custom components for markdown processing, prioritizing the translated link
  const customComponents = {
    ...(components || {}),
    a: TranslatedLink,
  };

  // Translate the content before rendering
  const translatedContent = translateContent(sanitizedContent);

  return renderMarkdown(translatedContent, customComponents);
};

export default TranslatedMarkdownField;
