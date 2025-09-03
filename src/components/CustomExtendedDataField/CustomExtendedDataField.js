import React from 'react';

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
import css from './CustomExtendedDataField.module.css';

const createFilterOptions = options => options.map(o => ({ key: `${o.option}`, label: o.label }));

const getLabel = fieldConfig => fieldConfig?.saveConfig?.label || fieldConfig?.label;

// Phone number validation function
const validatePhoneNumber = (value, invalidPhoneMessage) => {
  if (!value) return undefined;

  // Only allow numbers and "+" characters, no spaces or other text
  const phoneRegex = /^[\d+]+$/;

  return phoneRegex.test(value) ? undefined : invalidPhoneMessage;
};

const CustomFieldEnum = props => {
  const { name, fieldConfig, defaultRequiredMessage, formId, intl, disabled } = props;
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

  return filterOptions ? (
    <FieldSelect
      className={css.customField}
      name={name}
      id={formId ? `${formId}.${name}` : name}
      label={label}
      disabled={disabled}
      {...validateMaybe}
    >
      <option disabled value="">
        {placeholder}
      </option>
      {filterOptions.map(optionConfig => {
        const key = optionConfig.key;
        return (
          <option key={key} value={key}>
            {optionConfig.label}
          </option>
        );
      })}
    </FieldSelect>
  ) : null;
};

const CustomFieldMultiEnum = props => {
  const { name, fieldConfig, defaultRequiredMessage, formId } = props;
  const { enumOptions = [], saveConfig } = fieldConfig || {};
  const { isRequired, requiredMessage } = saveConfig || {};
  const label = getLabel(fieldConfig);
  const validateMaybe = isRequired
    ? { validate: nonEmptyArray(requiredMessage || defaultRequiredMessage) }
    : {};

  return enumOptions ? (
    <FieldCheckboxGroup
      className={css.customField}
      id={formId ? `${formId}.${name}` : name}
      name={name}
      label={label}
      options={createFilterOptions(enumOptions)}
      {...validateMaybe}
    />
  ) : null;
};

const CustomFieldText = props => {
  const { name, fieldConfig, defaultRequiredMessage, formId, intl } = props;
  const { placeholderMessage, isRequired, requiredMessage } = fieldConfig?.saveConfig || {};
  const label = getLabel(fieldConfig);

  const showtextArea = ![
    'pub_companyname',
    'pub_id_card_nik',
    'pub_id_npwp_nik',
    'pub_company_address',
    'pub_company_registration',
    'pub_phonenumber',
  ].includes(name);

  const customPlaceholder =
    name === 'pub_companyname'
      ? 'Your company name'
      : name === 'pub_company_address'
      ? 'Your company address'
      : name === 'pub_company_registration'
      ? 'Business number'
      : name === 'pub_id_card_nik'
      ? '3212345678990001'
      : name === 'pub_id_npwp_nik'
      ? 'Your NPWP or NIK number'
      : name === 'pub_phonenumber'
      ? '+6212345678911'
      : null;

  const placeholder =
    customPlaceholder ||
    placeholderMessage ||
    intl.formatMessage({ id: 'CustomExtendedDataField.placeholderText' });

  const textMaxlength = {
    pub_payment: 100,
  };

  // Handle validation for phone number field
  const validateMaybe =
    name === 'pub_phonenumber'
      ? {
          validate: value => {
            const requiredMsg = requiredMessage || defaultRequiredMessage;
            const invalidPhoneMsg = intl.formatMessage(
              {
                id: 'CustomExtendedDataField.invalidPhoneNumber',
              },
              {
                defaultMessage: 'Phone number can only contain numbers and "+" character',
              }
            );

            // Check required validation first
            if (!value) {
              return requiredMsg;
            }

            // Then check phone number format if value exists
            return validatePhoneNumber(value, invalidPhoneMsg);
          },
        }
      : isRequired
      ? { validate: required(requiredMessage || defaultRequiredMessage) }
      : {};

  return (
    <FieldTextInput
      className={css.customField}
      id={formId ? `${formId}.${name}` : name}
      name={name}
      type={showtextArea ? 'textarea' : 'text'}
      label={label}
      placeholder={placeholder}
      maxLength={textMaxlength[name]}
      {...validateMaybe}
    />
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

  return (
    <FieldTextInput
      className={css.customField}
      id={formId ? `${formId}.${name}` : name}
      name={name}
      type="number"
      step="1"
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
