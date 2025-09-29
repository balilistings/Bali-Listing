import React, { Component } from 'react';
import { Field } from 'react-final-form';
import PhoneInput from 'react-phone-number-input';
import classNames from 'classnames';

import css from './FieldPhoneNumberInputWithCountry.module.css';

const FieldPhoneNumberInputWithCountryComponent = props => {
  const {
    rootClassName,
    className,
    id,
    label,
    placeholder,
    input,
    meta,
    ...rest
  } = props;

  // Extract value and onChange from input
  const { value, onChange, ...inputProps } = input;
  
  // Handle validation errors
  const { touched, error } = meta || {};
  const hasError = !!(touched && error);

  return (
    <div className={classNames(rootClassName || css.root, className)}>
      {label && (
        <label htmlFor={id} className={css.label}>
          {label}
        </label>
      )}
      <PhoneInput
        id={id}
        className={classNames(css.phoneInput, { [css.phoneInputError]: hasError })}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        defaultCountry="ID" // Set Indonesia as the default country
        international
        withCountryCallingCode
        countryCallingCodeEditable={false}
        {...inputProps}
        {...rest}
      />
      {hasError && (
        <div className={css.error}>
          {error}
        </div>
      )}
    </div>
  );
};

class FieldPhoneNumberInputWithCountry extends Component {
  render() {
    return <Field component={FieldPhoneNumberInputWithCountryComponent} {...this.props} />;
  }
}

export default FieldPhoneNumberInputWithCountry;