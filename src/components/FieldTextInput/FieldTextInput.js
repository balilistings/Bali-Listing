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
    textInput,
    showGuideIcon,
    hideErrorMessage,
    ...rest
  } = props;
  const shouldDisable =
    (label === 'Weekly price in millions' && !props.checkboxState?.weekly) ||
    (label === 'Monthly price in millions' && !props.checkboxState?.monthly) ||
    (label === 'Yearly price in millions' && !props.checkboxState?.yearly);

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
        disabled: shouldDisable,
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
        disabled: shouldDisable,
        ...refMaybe,
        ...inputWithoutValue,
        ...rest,
      }
    : {
        className: inputClasses,
        id,
        type,
        disabled: shouldDisable,
        ...refMaybe,
        ...input,
        ...rest,
      };

  const classes = classNames(rootClassName || css.root, className);

  return (
    <div className={classes}>
      {label ? (
        <div className={css.customFieldWrapper}>
          <div className={css.labelAndGuide}>
            <label htmlFor={id}>{label}</label>
            {showGuideIcon &&
            [
              // 'Property Name ',
              'Email adress',
              'Phone number',
              'Payment terms',
              'Link to Facebook post',
              'Number of years for leasehold',
              'Minimum rental period',
              'Weekly price in millions',
              'Monthly price in millions',
              'Yearly price in millions',
              'Land size in m2',
              'Price per Are',
              'Building size in M2',
              'Total price in millions',
            ].includes(label) ? (
              <div className={css.imgWrapper}>
                <img src={iconGuide} alt="instruction" className={css.img} />
                <div className={css.tooltip}>{textInput}</div>
              </div>
            ) : null}
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
