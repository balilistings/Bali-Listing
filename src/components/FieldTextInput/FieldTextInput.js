import React, { Component } from 'react';
import { Field } from 'react-final-form';
import classNames from 'classnames';
import { ValidationError, ExpandingTextarea } from '../../components';
import iconGuide from '../../assets/guideIcon.png';

import css from './FieldTextInput.module.css';

const CONTENT_MAX_LENGTH = 5000;

const FieldTextInputComponent = props => {
  const {
    rootClassName,
    className,
    inputRootClass,
    customErrorText,
    id,
    label,
    input,
    meta,
    onUnmount,
    isUncontrolled,
    inputRef,
    hideErrorMessage,
    ...rest
  } = props;

  if (label && !id) {
    throw new Error('id required when a label is given');
  }

  const { valid, invalid, touched, error } = meta;
  const isTextarea = input.type === 'textarea';

  const errorText = customErrorText || error;

  // Error message and input error styles are only shown if the
  // field has been touched and the validation has failed.
  const hasError = !!customErrorText || !!(touched && invalid && error);

  const fieldMeta = { touched: hasError, error: errorText };

  // Textarea doesn't need type.
  const { type, ...inputWithoutType } = input;
  // Uncontrolled input uses defaultValue instead of value.
  const { value: defaultValue, ...inputWithoutValue } = input;
  // Use inputRef if it is passed as prop.
  const refMaybe = inputRef ? { ref: inputRef } : {};

  const inputClasses =
    inputRootClass ||
    classNames(css.input, {
      [css.inputSuccess]: valid,
      [css.inputError]: hasError,
      [css.textarea]: isTextarea,
    });
  const maxLength = CONTENT_MAX_LENGTH;
  const inputProps = isTextarea
    ? {
        className: inputClasses,
        id,
        rows: 1,
        maxLength,
        ...refMaybe,
        ...inputWithoutType,
        ...rest,
      }
    : isUncontrolled
    ? {
        className: inputClasses,
        id,
        type,
        defaultValue,
        ...refMaybe,
        ...inputWithoutValue,
        ...rest,
      }
    : { className: inputClasses, id, type, ...refMaybe, ...input, ...rest };

  const classes = classNames(rootClassName || css.root, className);
  // console.log('label', label);
  let textInput = '';

  switch (label) {
    case 'Property Name ':
      textInput = '';
      break;
    case 'Email adress':
      textInput = 'Enter a valid email for notifications and inquiries (e.g., yourname@email.com).';
      break;
    case 'Phone number':
      textInput =
        'Add your phone number with country code (e.g., +62 812-3456-7890); it’ll be hidden behind a WhatsApp button.';
      break;
    case 'Payment terms':
      textInput = 'Describe your payment terms (e.g., “50% deposit, balance on arrival”).';
      break;
    case 'Link to Facebook post':
      textInput = 'Paste the link to your FB post about this property (if applicable).';
      break;
    case 'Number of years for leasehold':
      textInput = 'Specify remaining lease years (e.g., “20 years”); leave blank if freehold.';
      break;
    case 'Minimum rental period':
      textInput = 'Specify the minimum stay (e.g., “1 week” or “1 month”) to set expectations.';
      break;

    case 'Weekly price in millions':
      textInput =
        'Enter your weekly price in millions of IDR (e.g., 2 for IDR 2.000.000); leave blank if not applicable.';
      break;
    case 'Monthly price in millions':
      textInput = 'Monthly price in millions';
      break;
    case 'Yearly price in millions':
      textInput =
        'Enter your yearly price in millions of IDR (e.g., 50 for IDR 50.000.000); leave blank if not applicable.';
      break;
    case 'Land size in m2':
      textInput = 'Land size in meter square';
      break;
    case 'Price per Are':
      textInput =
        'Enter the price per are (100 m²) in millions of IDR (e.g., 10 for IDR 10.000.000/are).';
      break;

    case 'Building size in M2':
      textInput = 'Enter the building size in square meters (e.g., 100)';
      break;
    case 'Total price in millions':
      textInput = 'Enter the sale price in millions of IDR (e.g., 96 for IDR 96.000.000M)';
      break;
  }
  return (
    <div className={classes}>
      {label ? (
        <div className={css.customFieldWrapper}>
          <div className={css.labelAndGuide}>
            <label htmlFor={id}>{label}</label>
            <div className={css.imgWrapper}>
              <img src={iconGuide} alt="instruction" className={css.img} />
              <div className={css.tooltip}>{textInput}</div>
            </div>
          </div>
        </div>
      ) : null}
      {isTextarea ? <ExpandingTextarea {...inputProps} /> : <input {...inputProps} />}
      {hideErrorMessage ? null : <ValidationError fieldMeta={fieldMeta} />}
    </div>
  );
};

/**
 * Create Final Form field for <input> or <textarea>.
 * It's often used for type="text" and sometimes with other types like 'number' too.
 *
 * Note: Uncontrolled input uses defaultValue prop, but doesn't pass value from form to the field.
 * https://reactjs.org/docs/uncontrolled-components.html#default-values
 *
 * @component
 * @param {Object} props
 * @param {string?} props.className add more style rules in addition to components own css.root
 * @param {string?} props.rootClassName overwrite components own css.root
 * @param {string?} props.inputRootClass overwrite components own css.input
 * @param {string} props.name Name of the input in Final Form
 * @param {string} props.id
 * @param {string?} props.label Label is optional, but if it is given, an id is also required.
 * @param {string?} props.customErrorText Error message that can be manually passed to input field, overrides default validation message
 * @param {boolean} props.isUncontrolled is value tracked by parent component
 * @param {Object} props.inputRef a ref object passed for input element.
 * @param {Function} props.onUnmount Uncontrolled input uses defaultValue prop, but doesn't pass value from form to the field.
 * @returns {JSX.Element} Final Form Field containing nested "select" input
 */
class FieldTextInput extends Component {
  componentWillUnmount() {
    // Unmounting happens too late if it is done inside Field component
    // (Then Form has already registered its (new) fields and
    // changing the value without corresponding field is prohibited in Final Form
    if (this.props.onUnmount) {
      this.props.onUnmount();
    }
  }

  render() {
    return <Field component={FieldTextInputComponent} {...this.props} />;
  }
}

export default FieldTextInput;
