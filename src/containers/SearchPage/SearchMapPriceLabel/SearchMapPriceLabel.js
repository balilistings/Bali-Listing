import React, { Component } from 'react';
import classNames from 'classnames';
import { connect } from 'react-redux';

import { injectIntl, intlShape } from '../../../util/reactIntl';
import { propTypes } from '../../../util/types';
import { formatMoney } from '../../../util/currency';
import { ensureListing } from '../../../util/data';
import { isPriceVariationsEnabled } from '../../../util/configHelpers';
import { formatPriceWithCurrency } from '../../../components/ListingCard/ListingCard';

import css from './SearchMapPriceLabel.module.css';

/**
 * SearchMapPriceLabel component
 * TODO: change to functional component
 *
 * @component
 * @param {Object} props
 * @param {string} [props.className] - Custom class that extends the default class for the root element
 * @param {string} [props.rootClassName] - Custom class that extends the default class for the root element
 * @param {propTypes.listing} props.listing - The listing
 * @param {Function} props.onListingClicked - The function to handle the listing click
 * @param {Object} props.config - The configuration
 * @param {intlShape} props.intl - The intl object
 * @param {string} props.rentPeriodParam - The rent period parameter
 * @returns {JSX.Element}
 */
class SearchMapPriceLabel extends Component {
  shouldComponentUpdate(nextProps) {
    const currentListing = ensureListing(this.props.listing);
    const nextListing = ensureListing(nextProps.listing);
    const isSameListing = currentListing.id.uuid === nextListing.id.uuid;
    const hasSamePrice = currentListing.attributes.price === nextListing.attributes.price;
    const hasSameActiveStatus = this.props.isActive === nextProps.isActive;
    const hasSameRefreshToken =
      this.props.mapComponentRefreshToken === nextProps.mapComponentRefreshToken;
    const hasSameRentPeriodParam = this.props.rentPeriodParam === nextProps.rentPeriodParam;
    const hasSameCurrencyConversion = this.props.currencyConversion?.selectedCurrency === nextProps.currencyConversion?.selectedCurrency;

    return !(
      isSameListing &&
      hasSamePrice &&
      hasSameActiveStatus &&
      hasSameCurrencyConversion &&
      hasSameRefreshToken &&
      hasSameRentPeriodParam
    );
  }

  render() {
    const {
      className,
      rootClassName,
      intl,
      listing,
      onListingClicked,
      isActive,
      config,
      rentPeriodParam,
      currencyConversion,
    } = this.props;

    const currentListing = ensureListing(listing);
    const { price, publicData } = currentListing.attributes;
    const priceAmount = price?.amount / 100;

    const rentPriceAmount =
      rentPeriodParam === 'noFilter'
        ? publicData['monthprice'] ??
          publicData['weekprice'] ??
          publicData['yearprice'] ??
          priceAmount
        : publicData[rentPeriodParam];

    const isRental = publicData?.categoryLevel1 === 'rentalvillas';
    const needPriceConversion = currencyConversion?.selectedCurrency === 'USD';
    let actualPrice = isRental ? rentPriceAmount : priceAmount;
    if (needPriceConversion) {
      actualPrice = actualPrice * currencyConversion?.conversionRate.USD;
    }
    const currency = currencyConversion?.selectedCurrency || 'IDR';
    let formattedPriceAmount = actualPrice ? formatPriceWithCurrency(actualPrice, currency) : null;
    // Create formatted price if currency is known or alternatively show just the unknown currency.
    const formattedPrice =
      (price && price.currency === config.currency) || isRental
        ? formattedPriceAmount
        : price?.currency
        ? price.currency
        : null;

    const priceValue = formattedPrice
      ? intl.formatMessage({ id: 'SearchMapPriceLabel.price' }, { priceValue: formattedPrice })
      : null;

    const validListingTypes = config.listing.listingTypes;
    const foundListingTypeConfig = validListingTypes.find(
      conf => conf.listingType === publicData?.listingType
    );
    const isPriceVariationsInUse = isPriceVariationsEnabled(publicData, foundListingTypeConfig);
    const hasMultiplePriceVariants =
      isPriceVariationsInUse && publicData?.priceVariants?.length > 1;

    const priceMessage = hasMultiplePriceVariants
      ? intl.formatMessage({ id: 'SearchMapInfoCard.priceStartingFrom' }, { priceValue })
      : intl.formatMessage({ id: 'SearchMapInfoCard.price' }, { priceValue });

    const classes = classNames(rootClassName || css.root, className);
    const priceLabelClasses = classNames(css.priceLabel, {
      [css.mapLabelActive]: isActive,
      [css.noPriceSetLabel]: !formattedPrice,
    });
    const caretClasses = classNames(css.caret, { [css.caretActive]: isActive });

    return (
      <button className={classes} onClick={() => onListingClicked(currentListing)}>
        <div className={css.caretShadow} />
        <div className={priceLabelClasses}>{priceMessage}</div>
        <div className={caretClasses} />
      </button>
    );
  }
}

export default injectIntl(SearchMapPriceLabel);
