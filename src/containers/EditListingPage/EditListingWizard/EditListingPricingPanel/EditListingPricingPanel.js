import classNames from 'classnames';
import React, { useState } from 'react';

// Import configs and util modules
import { FormattedMessage } from '../../../../util/reactIntl';
import { types as sdkTypes } from '../../../../util/sdkLoader';
import { LISTING_STATE_DRAFT, propTypes } from '../../../../util/types';

// Import shared components
import { H3, ListingLink } from '../../../../components';

// Import modules from this directory
import EditListingPricingForm from './EditListingPricingForm';
import css from './EditListingPricingPanel.module.css';

const getListingTypeConfig = (publicData, listingTypes) => {
  const selectedListingType = publicData.listingType;
  return listingTypes.find(conf => conf.listingType === selectedListingType);
};

// NOTE: components that handle price variants and start time interval are currently
// exporting helper functions that handle the initial values and the submission values.
// This is a tentative approach to contain logic in one place.
const getInitialValues = props => {
  const { listing, listingTypes } = props;
  const { publicData, price } = listing?.attributes || {};
  const { unitType, categoryLevel1 } = publicData || {};
  const isRentals = categoryLevel1 === 'rentalvillas';

  if (isRentals) {
    return {
      pub_pricee: publicData.pricee,
      pub_monthprice: publicData.monthprice,
      pub_weekprice: publicData.weekprice,
      pub_yearprice: publicData.yearprice,
    };
  } else {
    return { price };
  }
};

/**
 * The EditListingPricingPanel component.
 *
 * @component
 * @param {Object} props
 * @param {string} [props.className] - Custom class that extends the default class for the root element
 * @param {string} [props.rootClassName] - Custom class that overrides the default class for the root element
 * @param {propTypes.ownListing} props.listing - The listing object
 * @param {string} props.marketplaceCurrency - The marketplace currency
 * @param {number} props.listingMinimumPriceSubUnits - The listing minimum price sub units
 * @param {boolean} props.disabled - Whether the form is disabled
 * @param {boolean} props.ready - Whether the form is ready
 * @param {Function} props.onSubmit - The submit function
 * @param {string} props.submitButtonText - The submit button text
 * @param {Array<propTypes.listingType>} props.listingTypes - The listing types
 * @param {boolean} props.panelUpdated - Whether the panel is updated
 * @param {boolean} props.updateInProgress - Whether the panel is updating
 * @param {Object} props.errors - The errors
 * @returns {JSX.Element}
 */
const EditListingPricingPanel = props => {
  const [state, setState] = useState({ initialValues: getInitialValues(props) });

  const {
    className,
    rootClassName,
    listing,
    marketplaceCurrency,
    listingMinimumPriceSubUnits,
    disabled,
    ready,
    onSubmit,
    submitButtonText,
    listingTypes,
    panelUpdated,
    updateInProgress,
    errors,
    listingFields,
  } = props;

  const classes = classNames(rootClassName || css.root, className);
  const initialValues = state.initialValues;
  const isPublished = listing?.id && listing?.attributes?.state !== LISTING_STATE_DRAFT;

  const publicData = listing?.attributes?.publicData;
  const listingTypeConfig = getListingTypeConfig(publicData, listingTypes);

  const priceCurrencyValid = true;
  const unitType = listing?.attributes?.publicData?.unitType;

  const isRentals = publicData.categoryLevel1 === 'rentalvillas';

  return (
    <div className={classes}>
      <H3 as="h1">
        {isPublished ? (
          <FormattedMessage
            id="EditListingPricingPanel.title"
            values={{ listingTitle: <ListingLink listing={listing} />, lineBreak: <br /> }}
          />
        ) : (
          <FormattedMessage
            id="EditListingPricingPanel.createListingTitle"
            values={{ lineBreak: <br /> }}
          />
        )}
      </H3>

      {priceCurrencyValid ? (
        <EditListingPricingForm
          className={css.form}
          initialValues={initialValues}
          categoryLevel1={publicData.categoryLevel1}
          listingFields={listingFields}
          listingType={'free-listing'}
          onSubmit={values => {
            // New values for listing attributes
            let updateValues = {},
              initialValues = {};

            if (isRentals) {
              const { pub_pricee, pub_monthprice, pub_weekprice, pub_yearprice } = values;
              updateValues = {
                publicData: {
                  pricee: pub_pricee,
                  ...(pub_monthprice && { monthprice: pub_monthprice }),
                  ...(pub_weekprice && { weekprice: pub_weekprice }),
                  ...(pub_yearprice && { yearprice: pub_yearprice }),
                },
              };

              initialValues = {
                pub_pricee,
                pub_monthprice,
                pub_weekprice,
                pub_yearprice,
              };
            } else {
              updateValues = {
                price: values.price,
              };

              initialValues = {
                price: values.price,
              };
            }

            // Save the initialValues to state
            // Otherwise, re-rendering would overwrite the values during XHR call.
            setState({
              initialValues,
            });
            onSubmit(updateValues);
          }}
          marketplaceCurrency={marketplaceCurrency}
          unitType={unitType}
          listingTypeConfig={listingTypeConfig}
          listingMinimumPriceSubUnits={listingMinimumPriceSubUnits}
          saveActionMsg={submitButtonText}
          disabled={disabled}
          ready={ready}
          updated={panelUpdated}
          updateInProgress={updateInProgress}
          fetchErrors={errors}
        />
      ) : (
        <div className={css.priceCurrencyInvalid}>
          <FormattedMessage
            id="EditListingPricingPanel.listingPriceCurrencyInvalid"
            values={{ marketplaceCurrency }}
          />
        </div>
      )}
    </div>
  );
};

export default EditListingPricingPanel;
