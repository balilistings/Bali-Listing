import React from 'react';
import classNames from 'classnames';
import img from '../../assets/bali-listing-logo.svg';

import { ExternalLink, NamedLink } from '../../components';
import { useConfiguration } from '../../context/configurationContext';

import logoCss from '../Logo/Logo.module.css';
import css from './LinkedLogo.module.css';

// Height constants matching Logo component
const HEIGHT_24 = 24;
const HEIGHT_36 = 36;
const HEIGHT_48 = 48;
const HEIGHT_OPTIONS = [HEIGHT_24, HEIGHT_36, HEIGHT_48];

// Function to get height class name, matching Logo component logic
const getHeightClassName = height => {
  return height === HEIGHT_48
    ? logoCss.logo48
    : height === HEIGHT_36
    ? logoCss.logo36
    : logoCss.logo24;
};

/**
 * This component returns a clickable logo.
 *
 * @component
 * @param {Object} props
 * @param {string?} props.className add more style rules in addition to components own css.root
 * @param {string?} props.rootClassName overwrite components own css.root
 * @param {string?} props.logoClassName andd more style rules in addtion to css.logo
 * @param {string?} props.logoImageClassName overwrite components own css.root
 * @param {('desktop' | 'mobile')} props.layout
 * @param {Object} props.linkToExternalSite
 * @param {string} props.linkToExternalSite.href
 * @param {string?} props.alt alt text for logo image
 * @returns {JSX.Element} linked logo component
 */
const LinkedLogo = props => {
  const {
    className,
    rootClassName,
    logoClassName,
    logoImageClassName,
    layout = 'desktop',
    linkToExternalSite,
    alt,
    ...rest
  } = props;

  // Get the height of the logo based on the configuration
  const config = useConfiguration();
  const { logoSettings } = config.branding;
  const hasValidLogoSettings =
    logoSettings?.format === 'image' && HEIGHT_OPTIONS.includes(logoSettings?.height);
  const logoHeight = hasValidLogoSettings ? logoSettings.height : HEIGHT_24;
  const heightClassName = getHeightClassName(logoHeight);

  const logoImageClasses = classNames(logoCss.logo, heightClassName, logoImageClassName);

  const classes = classNames(rootClassName || css.root, className);
  // Note: href might come as an empty string (falsy), in which case we default to 'LandingPage'.
  return linkToExternalSite?.href ? (
    <ExternalLink className={classes} href={linkToExternalSite.href} target="_self" {...rest}>
      <div className={logoClassName}>
        <img className={logoImageClasses} src={img} alt={alt || config.marketplaceName} />
      </div>
    </ExternalLink>
  ) : (
    <NamedLink className={classes} name="LandingPage" {...rest}>
      <div className={logoCss.root}>
        <img className={logoImageClasses} src={img} alt={alt || config.marketplaceName} />
      </div>
    </NamedLink>
  );
};

export default LinkedLogo;
