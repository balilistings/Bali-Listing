import React from 'react';
import classNames from 'classnames';

import { useConfiguration } from '../../context/configurationContext';

import { FormattedMessage, useIntl } from '../../util/reactIntl';
import { displayPrice, isPriceVariationsEnabled } from '../../util/configHelpers';
import { lazyLoadWithDimensions } from '../../util/uiHelpers';
import { formatMoney } from '../../util/currency';
import { ensureListing, ensureUser } from '../../util/data';
import { richText } from '../../util/richText';
import { createSlug } from '../../util/urlHelpers';
import { isBookingProcessAlias } from '../../transactions/transaction';

import { AspectRatioWrapper, IconCollection, NamedLink, ResponsiveImage } from '../../components';

import css from './ListingCard.module.css';
import { Icon } from '../../containers/PageBuilder/SectionBuilder/SectionArticle/PropertyCards';

const MIN_LENGTH_FOR_LONG_WORDS = 10;

const priceData = (price, currency, intl) => {
  if (price && price.currency === currency) {
    const formattedPrice = formatMoney(intl, price);
    return { formattedPrice, priceTitle: formattedPrice };
  } else if (price) {
    return {
      formattedPrice: intl.formatMessage(
        { id: 'ListingCard.unsupportedPrice' },
        { currency: price.currency }
      ),
      priceTitle: intl.formatMessage(
        { id: 'ListingCard.unsupportedPriceTitle' },
        { currency: price.currency }
      ),
    };
  }
  return {};
};

const LazyImage = lazyLoadWithDimensions(ResponsiveImage, { loadAfterInitialRendering: 3000 });

const PriceMaybe = props => {
  const { price, publicData, config, intl } = props;
  const { listingType } = publicData || {};
  const validListingTypes = config.listing.listingTypes;
  const foundListingTypeConfig = validListingTypes.find(conf => conf.listingType === listingType);
  const showPrice = displayPrice(foundListingTypeConfig);
  if (!showPrice && price) {
    return null;
  }

  // Format price in millions if appropriate
  const formatPriceInMillions = priceAmount => {
    if (!priceAmount) return null;

    // First divide by 100 to get the actual price (prices are stored in subunits)
    const actualPrice = priceAmount / 100;

    // Check if the price is in millions (1,000,000 or more)
    if (actualPrice >= 1000000) {
      const millions = actualPrice / 1000000;
      // If it's a whole number, show without decimal
      if (millions % 1 === 0) {
        return `${millions}M`;
      } else {
        // Show with one decimal place for partial millions
        return `${millions.toFixed(1)}M`;
      }
    }

    // For smaller amounts, show the actual price
    return `${actualPrice.toLocaleString()}`;
  };

  const formattedPrice = price ? formatPriceInMillions(price.amount) : null;

  return (
    <div className={css.price}>
      <span className={css.priceValue}>
        {formattedPrice} IDR<span>/night</span>
      </span>
    </div>
  );
};

const capitaliseFirstLetter = str => {
  if (!str) return '';
  return str.charAt(0).toUpperCase() + str.slice(1);
};

const sortTags = (tags = []) => {
  const sortArr = ['weekly', 'monthly', 'yearly'];

  const sortedTags = tags.sort((a, b) => {
    const aIndex = sortArr.indexOf(a);
    const bIndex = sortArr.indexOf(b);
    return aIndex - bIndex;
  });

  const capitalizedTags = sortedTags.map(capitaliseFirstLetter);

  return capitalizedTags;
};

/**
 * ListingCard
 *
 * @component
 * @param {Object} props
 * @param {string?} props.className add more style rules in addition to component's own css.root
 * @param {string?} props.rootClassName overwrite components own css.root
 * @param {Object} props.listing API entity: listing or ownListing
 * @param {string?} props.renderSizes for img/srcset
 * @param {Function?} props.setActiveListing
 * @param {boolean?} props.showAuthorInfo
 * @returns {JSX.Element} listing card to be used in search result panel etc.
 */
export const ListingCard = props => {
  const config = useConfiguration();
  const intl = props.intl || useIntl();
  const {
    className,
    rootClassName,
    listing,
    renderSizes,
    setActiveListing,
    showAuthorInfo = true,
  } = props;
  const classes = classNames(rootClassName || css.root, className);
  const currentListing = ensureListing(listing);
  const id = currentListing.id.uuid;
  const { title = '', price, publicData } = currentListing.attributes;
  const slug = createSlug(title);
  const author = ensureUser(listing.author);
  const authorName = author.attributes.profile.displayName;
  const { pricee, location, propertytype, bedrooms, bathrooms, kitchen, pool } = publicData;
  const tags = sortTags(pricee);
  const firstImage =
    currentListing.images && currentListing.images.length > 0 ? currentListing.images[0] : null;

  const {
    aspectWidth = 1,
    aspectHeight = 1,
    variantPrefix = 'listing-card',
  } = config.layout.listingImage;
  const variants = firstImage
    ? Object.keys(firstImage?.attributes?.variants).filter(k => k.startsWith(variantPrefix))
    : [];

  const setActivePropsMaybe = setActiveListing
    ? {
        onMouseEnter: () => setActiveListing(currentListing.id),
        onMouseLeave: () => setActiveListing(null),
      }
    : null;

  return (
    <NamedLink className={classes} name="ListingPage" params={{ id, slug }}>
      <AspectRatioWrapper
        className={css.aspectRatioWrapper}
        width={aspectWidth}
        height={aspectHeight}
        {...setActivePropsMaybe}
      >
        <LazyImage
          rootClassName={css.rootForImage}
          alt={title}
          image={firstImage}
          variants={variants}
          sizes={renderSizes}
        />
      </AspectRatioWrapper>
      <div className={css.info}>
        <div className={css.tags}>
          {tags?.map(tag => (
            <span className={css.tag} key={tag}>
              {tag}
            </span>
          ))}
          {/* <span className={css.tag}></span> */}
          <span className={css.listedBy}>
            Listed by:{' '}
            <span className={css.listedByName}>{author.attributes.profile.displayName}</span>
          </span>
        </div>

        <div className={css.mainInfo}>
          <div className={css.title}>
            {richText(title, {
              longWordMinLength: MIN_LENGTH_FOR_LONG_WORDS,
              longWordClass: css.longWord,
            })}
          </div>
          <div className={css.location}>
            <span className={css.typeIcon}>
              <IconCollection name="typeIcon" />
            </span>
            <span className={css.type}>{capitaliseFirstLetter(propertytype)}</span>

            <span className={css.locationWrapper}>
              <span className={css.locationIcon}>
                <IconCollection name="locationIcon" />
              </span>
              {location?.address}
            </span>
          </div>
          <div className={css.bottomContent}>
            <div className={css.icons}>
              {!!bedrooms && (
                <span className={css.iconItem}>
                  <Icon type="bed" /> {bedrooms} bedroom{bedrooms > 1 ? 's' : ''}
                </span>
              )}
              {!!bathrooms && (
                <span className={css.iconItem}>
                  <Icon type="bath" /> {bathrooms} bathroom{bathrooms > 1 ? 's' : ''}
                </span>
              )}
            </div>
            <PriceMaybe price={price} publicData={publicData} config={config} intl={intl} />
          </div>
        </div>
      </div>
    </NamedLink>
  );
};

export default ListingCard;
