import React, { useState, forwardRef } from 'react';

// Import config and utils
import { useIntl } from '../../util/reactIntl';
import {
  SCHEMA_TYPE_ENUM,
  SCHEMA_TYPE_MULTI_ENUM,
  SCHEMA_TYPE_TEXT,
  SCHEMA_TYPE_LONG,
  SCHEMA_TYPE_BOOLEAN,
  SCHEMA_TYPE_YOUTUBE,
} from '../../util/types';
import {
  required,
  nonEmptyArray,
  validateInteger,
  validateYoutubeURL,
} from '../../util/validators';
// Import shared components
import { FieldCheckboxGroup, FieldSelect, FieldTextInput, FieldBoolean } from '../../components';
// Import modules from this directory

import DatePicker from 'react-datepicker';
import { Field } from 'react-final-form';
import PropTypes from 'prop-types';
import classNames from 'classnames';

import { useCheckboxContext } from '../../context/checkBoxContext';
import css from './CustomExtendedDataField.module.css';
import '../../styles/reactDatepicker.css';
import calendarIcon from '../../assets/CalendarIcon.svg';

const createFilterOptions = options => options.map(o => ({ key: `${o.option}`, label: o.label }));

const getLabel = fieldConfig => fieldConfig?.saveConfig?.label || fieldConfig?.label;

const CustomInput = forwardRef(({ value, onClick }, ref) => {
  return (
    <button
      type="button"
      onClick={onClick}
      ref={ref}
      style={{
        border: 'none',
        background: 'transparent',
        cursor: 'pointer',
        fontSize: '16px',
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        padding: 0,
      }}
    >
      {value ? (
        <span>{value}</span>
      ) : (
        <img src={calendarIcon} alt="Select date" style={{ width: 72, height: 72 }} />
      )}
    </button>
  );
});

CustomInput.displayName = 'CustomInput';

const CustomFieldEnum = props => {
  const { name, fieldConfig, defaultRequiredMessage, formId, intl } = props;
  const { enumOptions = [], saveConfig } = fieldConfig || {};
  const { placeholderMessage, isRequired, requiredMessage } = saveConfig || {};
  const validateMaybe = isRequired
    ? { validate: required(requiredMessage || defaultRequiredMessage) }
    : {};
  const placeholder =
    placeholderMessage ||
    intl.formatMessage({ id: 'CustomExtendedDataField.placeholderSingleSelect' });
  const filterOptions = createFilterOptions(enumOptions);

  const label = getLabel(fieldConfig);

  const isAvailableNowField = label === 'Available now';

  if (!filterOptions) return null;
  return (
    <div style={{ marginTop: '1rem' }}>
      {isAvailableNowField ? (
        <Field name={name} {...validateMaybe}>
          {({ input: enumInput }) => (
            <>
              <label htmlFor={name}>{label}</label>
              <select
                className={css.customField}
                id={formId ? `${formId}.${name}` : name}
                {...enumInput}
              >
                <option disabled value="">
                  {placeholder}
                </option>
                {filterOptions.map(optionConfig => (
                  <option key={optionConfig.key} value={optionConfig.key}>
                    {optionConfig.label}
                  </option>
                ))}
              </select>

              {enumInput.value === 'no' && (
                <Field name="availabilityDate">
                  {({ input: dateInput, meta }) => (
                    <div className={css.customField}>
                      <label htmlFor="availabilityDate">Select availability date</label>
                      <DatePicker
                        id="availabilityDate"
                        selected={dateInput.value}
                        onChange={dateInput.onChange}
                        dateFormat="yyyy-MM-dd"
                        placeholderText="Select a available date"
                        minDate={new Date()}
                        customInput={<CustomInput />}
                      />
                      {meta.touched && meta.error && (
                        <span style={{ color: 'red' }}>{meta.error}</span>
                      )}
                    </div>
                  )}
                </Field>
              )}
            </>
          )}
        </Field>
      ) : (
        <FieldSelect
          className={css.customField}
          name={name}
          id={formId ? `${formId}.${name}` : name}
          label={label}
          {...validateMaybe}
        >
          <option disabled value="">
            {placeholder}
          </option>
          {filterOptions.map(optionConfig => (
            <option key={optionConfig.key} value={optionConfig.key}>
              {optionConfig.label}
            </option>
          ))}
        </FieldSelect>
      )}
    </div>
  );
};

const CustomFieldMultiEnum = props => {
  const { name, fieldConfig, defaultRequiredMessage, formId } = props;
  const { enumOptions = [], saveConfig } = fieldConfig || {};
  const { isRequired, requiredMessage } = saveConfig || {};

  const label = getLabel(fieldConfig);
  const validateMaybe = isRequired
    ? { validate: nonEmptyArray(requiredMessage || defaultRequiredMessage) }
    : {};

  const { checkboxState, updateCheckbox } = useCheckboxContext();

  const handleCheckboxChange = event => {
    const { value, checked } = event.target;

    if (['weekly', 'monthly', 'yearly'].includes(value)) {
      updateCheckbox(value, checked);
    }
  };

  const showGuideIcon = label === 'Rental period';
  const guideText = showGuideIcon
    ? 'Select all allowed periods (Weekly, Monthly, Yearly); users can filter by these.'
    : '';

  return enumOptions ? (
    <div style={{ marginTop: '1rem' }}>
      <FieldCheckboxGroup
        className={css.customField}
        id={formId ? `${formId}.${name}` : name}
        name={name}
        label={label}
        options={createFilterOptions(enumOptions)}
        {...validateMaybe}
        guideText={guideText}
        showGuideIcon={true}
        onChange={handleCheckboxChange}
      />
    </div>
  ) : null;
};

const CustomFieldText = props => {
  const { name, fieldConfig, defaultRequiredMessage, formId, intl } = props;
  const { placeholderMessage, isRequired, requiredMessage } = fieldConfig?.saveConfig || {};
  const label = getLabel(fieldConfig);
  const validateMaybe = isRequired
    ? { validate: required(requiredMessage || defaultRequiredMessage) }
    : {};
  const placeholder =
    placeholderMessage || intl.formatMessage({ id: 'CustomExtendedDataField.placeholderText' });

  const getTextInput = label => {
    switch (label) {
      case 'Email adress':
        return 'Enter a valid email for notifications and inquiries (e.g., yourname@email.com).';
      case 'Phone number':
        return 'Add your phone number with country code (e.g., +62 812-3456-7890); it’ll be hidden behind a WhatsApp button.';
      case 'Payment terms':
        return 'Describe your payment terms (e.g., “50% deposit, balance on arrival”).';
      // case 'Link to Facebook post':
      //   return 'Paste the link to your FB post about this property (if applicable).';
      case 'Number of years for leasehold':
        return 'Specify remaining lease years (e.g., “20 years”); leave blank if freehold.';
      case 'Minimum rental period':
        return 'Specify the minimum stay (e.g., “1 week” or “1 month”) to set expectations.';
      default:
        return '';
    }
  };
  console.log('props', props);
  const textInput = getTextInput(label);
  return (
    label !== 'Link to Facebook post' && (
      <div style={{ marginTop: '1rem' }}>
        {/* fieldTextInput */}
        <FieldTextInput
          className={css.customField}
          id={formId ? `${formId}.${name}` : name}
          name={name}
          type="textarea"
          label={label}
          placeholder={placeholder}
          textInput={textInput}
          showGuideIcon={true}
          {...validateMaybe}
        />
      </div>
    )
  );
};

const CustomFieldLong = props => {
  const { name, fieldConfig, defaultRequiredMessage, formId, intl } = props;
  const { minimum, maximum, saveConfig } = fieldConfig;
  const { placeholderMessage, isRequired, requiredMessage } = saveConfig || {};
  const label = getLabel(fieldConfig);
  const placeholder =
    placeholderMessage || intl.formatMessage({ id: 'CustomExtendedDataField.placeholderLong' });
  const numberTooSmallMessage = intl.formatMessage(
    { id: 'CustomExtendedDataField.numberTooSmall' },
    { min: minimum }
  );
  const numberTooBigMessage = intl.formatMessage(
    { id: 'CustomExtendedDataField.numberTooBig' },
    { max: maximum }
  );

  // Field with schema type 'long' will always be validated against min & max
  const validate = (value, min, max) => {
    const requiredMsg = requiredMessage || defaultRequiredMessage;
    return isRequired && value == null
      ? requiredMsg
      : validateInteger(value, max, min, numberTooSmallMessage, numberTooBigMessage);
  };

  const { checkboxState } = useCheckboxContext();

  const getTextInput = label => {
    switch (label) {
      case 'Weekly price in millions':
        return 'Enter your weekly price in millions of IDR (e.g., 2 for IDR 2.000.000); leave blank if not applicable.';
      case 'Monthly price in millions':
        return 'Monthly price in millions';
      case 'Yearly price in millions':
        return 'Enter your yearly price in millions of IDR (e.g., 50 for IDR 50.000.000); leave blank if not applicable.';
      case 'Land size in m2':
        return 'Land size in m2';
      case 'Price per Are':
        return 'Enter the price per are (100 m²) in millions of IDR (e.g., 10 for IDR 10.000.000/are).';
      case 'Building size in M2':
        return 'Enter the building size in square meters (e.g., 100)';
      case 'Total price in millions':
        return 'Enter the sale price in millions of IDR (e.g., 96 for IDR 96.000.000M)';
      default:
        return '';
    }
  };

  const textInput = getTextInput(label);

  return (
    <div style={{ marginTop: '1rem' }}>
      {/* fieldTextInput2 */}
      <FieldTextInput
        className={css.customField}
        id={formId ? `${formId}.${name}` : name}
        name={name}
        textInput={textInput}
        showGuideIcon={true}
        type="number"
        step="1"
        checkboxState={checkboxState}
        parse={value => {
          const parsed = Number.parseInt(value, 10);
          return Number.isNaN(parsed) ? null : parsed;
        }}
        label={label}
        placeholder={placeholder}
        validate={value => validate(value, minimum, maximum)}
        onWheel={e => {
          // fix: number input should not change value on scroll
          if (e.target === document.activeElement) {
            // Prevent the input value change, because we prefer page scrolling
            e.target.blur();

            // Refocus immediately, on the next tick (after the current function is done)
            setTimeout(() => {
              e.target.focus();
            }, 0);
          }
        }}
      />
    </div>
  );
};

const CustomFieldBoolean = props => {
  const { name, fieldConfig, defaultRequiredMessage, formId, intl } = props;
  const { placeholderMessage, isRequired, requiredMessage } = fieldConfig?.saveConfig || {};
  const label = getLabel(fieldConfig);
  const validateMaybe = isRequired
    ? { validate: required(requiredMessage || defaultRequiredMessage) }
    : {};
  const placeholder =
    placeholderMessage || intl.formatMessage({ id: 'CustomExtendedDataField.placeholderBoolean' });

  return (
    <FieldBoolean
      className={css.customField}
      id={formId ? `${formId}.${name}` : name}
      name={name}
      label={label}
      placeholder={placeholder}
      {...validateMaybe}
    />
  );
};

const CustomFieldYoutube = props => {
  const { name, fieldConfig, defaultRequiredMessage, formId, intl } = props;
  const { placeholderMessage, isRequired, requiredMessage } = fieldConfig?.saveConfig || {};
  const label = getLabel(fieldConfig);
  const placeholder =
    placeholderMessage ||
    intl.formatMessage({ id: 'CustomExtendedDataField.placeholderYoutubeVideoURL' });

  const notValidUrlMessage = intl.formatMessage({
    id: 'CustomExtendedDataField.notValidYoutubeVideoURL',
  });

  const validate = value => {
    const requiredMsg = requiredMessage || defaultRequiredMessage;
    return isRequired && value == null
      ? requiredMsg
      : validateYoutubeURL(value, notValidUrlMessage);
  };

  return (
    <FieldTextInput
      className={css.customField}
      id={formId ? `${formId}.${name}` : name}
      name={name}
      type="text"
      label={label}
      placeholder={placeholder}
      validate={value => validate(value)}
    />
  );
};

/**
 * Return Final Form field for each configuration according to schema type.
 *
 * These custom extended data fields are for generating input fields from configuration defined
 * in marketplace-custom-config.js. Other panels in EditListingWizard might add more extended data
 * fields (e.g. shipping fee), but these are independently customizable.
 *
 * @param {Object} props should contain fieldConfig that defines schemaType, enumOptions?, and
 * saveConfig for the field.
 */
const CustomExtendedDataField = props => {
  const intl = useIntl();
  const { enumOptions = [], schemaType } = props?.fieldConfig || {};
  const renderFieldComponent = (FieldComponent, props) => <FieldComponent {...props} intl={intl} />;

  return schemaType === SCHEMA_TYPE_ENUM && enumOptions
    ? renderFieldComponent(CustomFieldEnum, props)
    : schemaType === SCHEMA_TYPE_MULTI_ENUM && enumOptions
    ? renderFieldComponent(CustomFieldMultiEnum, props)
    : schemaType === SCHEMA_TYPE_TEXT
    ? renderFieldComponent(CustomFieldText, props)
    : schemaType === SCHEMA_TYPE_LONG
    ? renderFieldComponent(CustomFieldLong, props)
    : schemaType === SCHEMA_TYPE_BOOLEAN
    ? renderFieldComponent(CustomFieldBoolean, props)
    : schemaType === SCHEMA_TYPE_YOUTUBE
    ? renderFieldComponent(CustomFieldYoutube, props)
    : null;
};

export default CustomExtendedDataField;
