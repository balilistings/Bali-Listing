import React, { useState } from 'react';
import classNames from 'classnames';

import { useIntl } from '../../../util/reactIntl';
import { propTypes } from '../../../util/types';
import { formatMoney } from '../../../util/currency';
import { ensureListing, ensureUser } from '../../../util/data';
import { isPriceVariationsEnabled, displayPrice } from '../../../util/configHelpers';
import Slider from 'react-slick';
import { AspectRatioWrapper, IconCollection, NamedLink, ResponsiveImage } from '../../../components';
import { sortTags, capitaliseFirstLetter } from '../../../util/helper';
import css from './SearchMapInfoCard.module.css';
import { Icon } from '../../../containers/PageBuilder/SectionBuilder/SectionArticle/PropertyCards';
import { richText } from '../../../util/richText';

const MIN_LENGTH_FOR_LONG_WORDS = 10;

// react-slick settings
const sliderSettings = {
  dots: true,
  arrows: true,
  infinite: false,
  speed: 500,
  slidesToShow: 1,
  slidesToScroll: 1,
  appendDots: dots => <div className={css.dots}>{dots}</div>,
  customPaging: i => <span className={css.dot}></span>,
  nextArrow: (
    <button className={css.arrowRight} type="button" aria-label="Next image">
      <span className={css.arrowIcon}>
        <svg
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <rect width="24" height="24" rx="12" fill="white" />
          <path
            fillRule="evenodd"
            clipRule="evenodd"
            d="M14.4965 11.6908C14.5784 11.7728 14.6244 11.884 14.6244 12C14.6244 12.1159 14.5784 12.2271 14.4965 12.3091L10.1215 16.6841C10.0386 16.7614 9.92887 16.8035 9.81552 16.8015C9.70218 16.7995 9.59404 16.7536 9.51388 16.6734C9.43373 16.5932 9.38781 16.4851 9.38581 16.3718C9.38381 16.2584 9.42588 16.1487 9.50316 16.0658L13.569 12L9.50316 7.93412C9.42588 7.85118 9.38381 7.74149 9.38581 7.62815C9.38781 7.5148 9.43373 7.40666 9.51388 7.32651C9.59404 7.24635 9.70218 7.20043 9.81552 7.19843C9.92887 7.19643 10.0386 7.2385 10.1215 7.31578L14.4965 11.6908Z"
            fill="#231F20"
          />
        </svg>
      </span>
    </button>
  ),
  prevArrow: (
    <button className={css.arrowLeft} type="button" aria-label="Previous image">
      <span className={css.arrowIcon}>
        <svg
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <rect width="24" height="24" rx="12" transform="matrix(-1 0 0 1 24 0)" fill="white" />
          <path
            fillRule="evenodd"
            clipRule="evenodd"
            d="M9.5035 11.6908C9.42157 11.7728 9.37556 11.884 9.37556 12C9.37556 12.1159 9.42157 12.2271 9.5035 12.3091L13.8785 16.6841C13.9614 16.7614 14.0711 16.8035 14.1845 16.8015C14.2978 16.7995 14.406 16.7536 14.4861 16.6734C14.5663 16.5932 14.6122 16.4851 14.6142 16.3718C14.6162 16.2584 14.5741 16.1487 14.4968 16.0658L10.431 12L14.4968 7.93412C14.5741 7.85118 14.6162 7.74149 14.6142 7.62815C14.6122 7.5148 14.5663 7.40666 14.4861 7.32651C14.406 7.24635 14.2978 7.20043 14.1845 7.19843C14.0711 7.19643 13.9614 7.2385 13.8785 7.31578L9.5035 11.6908Z"
            fill="#231F20"
          />
        </svg>
      </span>
    </button>
  ),
};

// Format price in millions if appropriate
export const formatPriceInMillions = priceAmount => {
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


const PriceMaybe = props => {
  const { price, publicData, config, intl } = props;
  const { listingType } = publicData || {};
  const validListingTypes = config.listing.listingTypes;
  const foundListingTypeConfig = validListingTypes.find(conf => conf.listingType === listingType);
  const showPrice = displayPrice(foundListingTypeConfig);
  if (!showPrice && price) {
    return null;
  }

  const formattedPrice = price ? formatPriceInMillions(price.amount) : null;

  return (
    <div className={css.price}>
      <span className={css.priceValue}>
        {formattedPrice} IDR<span>/night</span>
      </span>
    </div>
  );
};

// ListingCard is the listing info without overlayview or carousel controls
const ListingCard = props => {
  const { className, clickHandler, intl, isInCarousel, listing, urlToListing, config } = props;

  const { title, price, publicData } = listing.attributes;
  const formattedPrice =
    price && price.currency === config.currency
      ? formatMoney(intl, price)
      : price?.currency
        ? price.currency
        : null;
  const firstImage = listing.images && listing.images.length > 0 ? listing.images[0] : null;

  const {
    aspectWidth = 1,
    aspectHeight = 1,
    variantPrefix = 'listing-card',
  } = config.layout.listingImage;
  const variants = firstImage
    ? Object.keys(firstImage?.attributes?.variants).filter(k => k.startsWith(variantPrefix))
    : [];
  const author = ensureUser(listing.author);
  const pricePerUnit = intl.formatMessage(
    { id: 'SearchMapInfoCard.perUnit' },
    { unitType: publicData?.unitType }
  );
  const priceValue = formattedPrice ? formattedPrice : '';

  const validListingTypes = config.listing.listingTypes;
  const foundListingTypeConfig = validListingTypes.find(
    conf => conf.listingType === publicData?.listingType
  );
  const isPriceVariationsInUse = isPriceVariationsEnabled(publicData, foundListingTypeConfig);
  const hasMultiplePriceVariants = isPriceVariationsInUse && publicData?.priceVariants?.length > 1;

  const priceMessage = hasMultiplePriceVariants
    ? intl.formatMessage(
      { id: 'SearchMapInfoCard.priceStartingFrom' },
      { priceValue, pricePerUnit }
    )
    : intl.formatMessage({ id: 'SearchMapInfoCard.price' }, { priceValue, pricePerUnit });

  // listing card anchor needs sometimes inherited border radius.
  const classes = classNames(
    css.anchor,
    css.borderRadiusInheritTop,
    { [css.borderRadiusInheritBottom]: !isInCarousel },
    className
  );

  const { pricee, location, propertytype, bedrooms, bathrooms, kitchen, pool } = publicData;
  const tags = sortTags(pricee);

  const imagesUrls = listing.images.map(
    img => img.attributes.variants['landscape-crop2x']?.url
  );
  // Per-card slider settings
  const cardSliderSettings = {
    ...sliderSettings,
    infinite: imagesUrls.length > 1,
  };


  return (
    <a
      alt={title}
      className={classes}
      href={urlToListing}
      onClick={e => {
        e.preventDefault();
        // Use clickHandler from props to call internal router
        clickHandler(listing);
      }}
    >
      <div
        className={classNames(css.card, css.borderRadiusInheritTop, {
          [css.borderRadiusInheritBottom]: !isInCarousel,
        })}
      >
        <div className={css.imageWrapper}>
          <Slider {...cardSliderSettings} className={css.slider}>
            {imagesUrls.map((img, imgIdx) => (
              <img src={img} alt={title} className={css.image + ' ' + css.imageFade} key={imgIdx} />
            ))}
          </Slider>
        </div>

        {/* <AspectRatioWrapper
          className={css.aspectRatioWrapper}
          width={aspectWidth}
          height={aspectHeight}
        >
          <ResponsiveImage
            rootClassName={classNames(css.rootForImage, css.borderRadiusInheritTop)}
            alt={title}
            noImageMessage={intl.formatMessage({ id: 'SearchMapInfoCard.noImage' })}
            image={firstImage}
            variants={variants}
            sizes="250px"
          />
        </AspectRatioWrapper> */}
        <div className={css.info}>
          <div className={css.tags}>
            {tags?.map(tag => (
              <span className={css.tag} key={tag}>
                {tag}
              </span>
            ))}
            {/* <span className={css.tag}></span> */}
            {/* <NamedLink className={css.listedBy} name="ProfilePage" params={{ id: author.id.uuid }}> */}
            <span className={css.listedBy}>
              Listed by:{' '}
              <span className={css.listedByName}>{author.attributes.profile.displayName}</span>
            </span>
            {/* </NamedLink> */}
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
      </div>
    </a>
  );
};

/**
 * @component
 * @param {Object} props
 * @param {string} [props.className] - Custom class that extends the default class for the root element
 * @param {string} [props.rootClassName] - Custom class that extends the default class for the root element
 * @param {Array<propTypes.listing>} props.listings - The listings
 * @param {Function} props.onListingInfoCardClicked - The function to handle the listing info card click
 * @param {Function} props.createURLToListing - The function to create the URL to the listing
 * @param {Object} props.config - The configuration
 * @returns {JSX.Element}
 */
const SearchMapInfoCard = props => {
  const [currentListingIndex, setCurrentListingIndex] = useState(0);
  const intl = useIntl();
  const {
    className,
    rootClassName,
    listings,
    createURLToListing,
    onListingInfoCardClicked,
    config,
  } = props;
  const currentListing = ensureListing(listings[currentListingIndex]);
  const hasCarousel = listings.length > 1;

  const classes = classNames(rootClassName || css.root, className);
  const caretClass = classNames(css.caret, { [css.caretWithCarousel]: hasCarousel });

  return (
    <div className={classes}>
      <span className={css.closeIcon}>
        <svg width="12" height="11" viewBox="0 0 12 11" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M1.5 10L10.5 1M1.5 1L10.5 10" stroke="#231F20" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" />
        </svg>
      </span>
      <div className={css.caretShadow} />
      <ListingCard
        clickHandler={onListingInfoCardClicked}
        urlToListing={createURLToListing(currentListing)}
        listing={currentListing}
        intl={intl}
        isInCarousel={hasCarousel}
        config={config}
      />
      {hasCarousel ? (
        <div className={classNames(css.paginationInfo, css.borderRadiusInheritBottom)}>
          <button
            className={css.paginationPrev}
            onClick={e => {
              e.preventDefault();
              e.stopPropagation();
              setCurrentListingIndex(
                prevListingIndex => (prevListingIndex + listings.length - 1) % listings.length
              );
            }}
          />
          <div className={css.paginationPage}>
            {`${currentListingIndex + 1}/${listings.length}`}
          </div>
          <button
            className={css.paginationNext}
            onClick={e => {
              e.preventDefault();
              e.stopPropagation();
              setCurrentListingIndex(
                prevListingIndex => (prevListingIndex + listings.length + 1) % listings.length
              );
            }}
          />
        </div>
      ) : null}
      <div className={caretClass} />
    </div>
  );
};

export default SearchMapInfoCard;
