import classNames from 'classnames';
import arrayMutators from 'final-form-arrays';
import React from 'react';
import { Form as FinalForm } from 'react-final-form';

// Import configs and util modules
import { formatMoney } from '../../../../util/currency';
import { FormattedMessage, useIntl } from '../../../../util/reactIntl';
import { types as sdkTypes } from '../../../../util/sdkLoader';
import * as validators from '../../../../util/validators';

// Import shared components
import { Button, FieldCurrencyInput, Form } from '../../../../components';

// Import modules from this directory
import { AddListingFields } from '../EditListingDetailsPanel/EditListingDetailsForm';
import css from './EditListingPricingForm.module.css';
import appSettings from '../../../../config/settings';

const { Money } = sdkTypes;

const getPriceValidators = (listingMinimumPriceSubUnits, marketplaceCurrency, intl) => {
  const priceRequiredMsgId = { id: 'EditListingPricingForm.priceRequired' };
  const priceRequiredMsg = intl.formatMessage(priceRequiredMsgId);
  const priceRequired = validators.required(priceRequiredMsg);

  const minPriceRaw = new Money(listingMinimumPriceSubUnits, marketplaceCurrency);
  const minPrice = formatMoney(intl, minPriceRaw);
  const priceTooLowMsgId = { id: 'EditListingPricingForm.priceTooLow' };
  const priceTooLowMsg = intl.formatMessage(priceTooLowMsgId, { minPrice });
  const minPriceRequired = validators.moneySubUnitAmountAtLeast(
    priceTooLowMsg,
    listingMinimumPriceSubUnits
  );

  return listingMinimumPriceSubUnits
    ? validators.composeValidators(priceRequired, minPriceRequired)
    : priceRequired;
};

const ErrorMessages = props => {
  const { fetchErrors } = props;
  const { updateListingError, showListingsError } = fetchErrors || {};

  return (
    <>
      {updateListingError ? (
        <p className={css.error}>
          <FormattedMessage id="EditListingPricingForm.updateFailed" />
        </p>
      ) : null}
      {showListingsError ? (
        <p className={css.error}>
          <FormattedMessage id="EditListingPricingForm.showListingFailed" />
        </p>
      ) : null}
    </>
  );
};

/**
 * The EditListingPricingForm component.
 *
 * @component
 * @param {Object} props
 * @param {string} [props.formId] - The form id
 * @param {string} [props.className] - Custom class that extends the default class for the root element
 * @param {string} [props.rootClassName] - Custom class that overrides the default class for the root element
 * @param {string} props.unitType - The unitType from listing.attributes.publicData
 * @param {Object} [props.listingTypeConfig] - The listing type config that matches with listingType on publicData.
 * @param {Object} [props.listingTypeConfig.priceVariations] - The price variations config.
 * @param {boolean} props.listingTypeConfig.priceVariations.enabled - Whether the price variations are enabled.
 * @param {Object} [props.listingTypeConfig.transactionType] - The transaction type config.
 * @param {string} props.listingTypeConfig.transactionType.process - The transaction process config.
 * @param {string} props.marketplaceCurrency - The marketplace currency
 * @param {number} [props.listingMinimumPriceSubUnits] - The listing minimum price sub units
 * @param {boolean} [props.autoFocus] - Whether the input should be focused
 * @param {boolean} [props.disabled] - Whether the form is disabled
 * @param {boolean} [props.ready] - Whether the form is ready
 * @param {Function} props.onSubmit - The submit function
 * @param {boolean} [props.invalid] - Whether the form is invalid
 * @param {boolean} [props.pristine] - Whether the form is pristine
 * @param {string} props.saveActionMsg - The save action message
 * @param {boolean} [props.updated] - Whether the form is updated
 * @param {boolean} [props.updateInProgress] - Whether the form is updating
 * @param {Object} [props.fetchErrors] - The fetch errors
 * @returns {JSX.Element}
 */
export const EditListingPricingForm = props => (
  <FinalForm
    mutators={{ ...arrayMutators }}
    {...props}
    render={formRenderProps => {
      const {
        formId = 'EditListingPricingForm',
        form: formApi,
        className,
        rootClassName,
        disabled,
        ready,
        handleSubmit,
        marketplaceCurrency,
        listingMinimumPriceSubUnits = 0,
        invalid,
        pristine,
        saveActionMsg,
        updated,
        updateInProgress = false,
        fetchErrors,
        initialValues: formInitialValues,
        values,
        categoryLevel1,
        listingFields,
        listingType,
        unitType,
      } = formRenderProps;

      const intl = useIntl();
      const priceValidators = getPriceValidators(
        listingMinimumPriceSubUnits,
        marketplaceCurrency,
        intl
      );

      const listingFieldsConfig = listingFields.filter(field => ['pricee'].includes(field.key));

      const classes = classNames(rootClassName || css.root, className);
      const submitReady = (updated && pristine) || ready;
      const submitInProgress = updateInProgress;
      const submitDisabled = invalid || disabled || submitInProgress;

      const isRentals = categoryLevel1 === 'rentalvillas';

      let priceFieldsToShow = [];

      if (isRentals && values?.pub_pricee?.length > 0) {
        if (values.pub_pricee.includes('weekly')) {
          priceFieldsToShow.push('weekprice');
        }
        if (values.pub_pricee.includes('monthly')) {
          priceFieldsToShow.push('monthprice');
        }
        if (values.pub_pricee.includes('yearly')) {
          priceFieldsToShow.push('yearprice');
        }
      }

      return (
        <Form onSubmit={handleSubmit} className={classes}>
          <ErrorMessages fetchErrors={fetchErrors} />
          {isRentals ? (
            <>
              <AddListingFields
                listingType={listingType}
                listingFieldsConfig={listingFieldsConfig}
                selectedCategories={{ categoryLevel1 }}
                formId={formId}
                intl={intl}
              />

              {priceFieldsToShow.length > 0 && (
                <AddListingFields
                  listingType={listingType}
                  listingFieldsConfig={listingFields.filter(field =>
                    priceFieldsToShow.includes(field.key)
                  )}
                  selectedCategories={{ categoryLevel1 }}
                  formId={formId}
                  intl={intl}
                />
              )}
            </>
          ) : (
            <FieldCurrencyInput
              id={`${formId}price`}
              name="price"
              className={css.input}
              autoFocus={true}
              label={intl.formatMessage(
                { id: 'EditListingPricingForm.pricePerProduct' },
                { unitType }
              )}
              placeholder={intl.formatMessage({
                id: 'EditListingPricingForm.priceInputPlaceholder',
              })}
              currencyConfig={appSettings.getCurrencyFormatting(marketplaceCurrency)}
              validate={priceValidators}
            />
          )}

          <Button
            className={css.submitButton}
            type="submit"
            inProgress={submitInProgress}
            disabled={submitDisabled}
            ready={submitReady}
          >
            {saveActionMsg}
          </Button>
        </Form>
      );
    }}
  />
);

export default EditListingPricingForm;
