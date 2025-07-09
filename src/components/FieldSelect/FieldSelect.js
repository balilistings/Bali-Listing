import React from 'react';
import { Field } from 'react-final-form';
import classNames from 'classnames';
import { ValidationError } from '../../components';
import iconGuide from '../../assets/guideIcon.png';

import css from './FieldSelect.module.css';

const FieldSelectComponent = props => {
  const {
    rootClassName,
    className,
    selectClassName,
    id,
    label,
    input,
    meta,
    children,
    onChange,
    showLabelAsDisabled,
    ...rest
  } = props;

  if (label && !id) {
    throw new Error('id required when a label is given');
  }

  const { valid, invalid, touched, error } = meta;

  // Error message and input error styles are only shown if the
  // field has been touched and the validation has failed.
  const hasError = touched && invalid && error;

  const selectClasses = classNames({
    [selectClassName]: selectClassName,
    [css.selectError]: hasError,
  });
  const handleChange = e => {
    input.onChange(e);
    if (onChange) {
      onChange(e.currentTarget.value);
    }
  };

  const selectProps = { className: selectClasses, id, ...input, onChange: handleChange, ...rest };

  const classes = classNames(rootClassName || css.root, className);

  let textEnum = '';

  switch (label) {
    case 'Property type':
      textEnum =
        'Choose the type of property you’re listing. This helps users filter listings based on their needs.';
      break;
    case 'Bedrooms':
      textEnum = 'Choose the number of bedrooms (e.g., 1, 2, 3+); select “0” for land';
      break;
    case 'Bathrooms':
      textEnum = 'Choose the number of bathrooms (e.g., 1, 2, 3+); select “0” for land.';
      break;
    case 'Available now':
      textEnum =
        'Select “Yes” if the property is available immediately, or “No” if it’s available later. This helps users filter for properties they can book right away.';
      break;
    case 'Living':
      textEnum = 'Select whether the living room is “Open” or “Closed.” ';
      break;
    case 'Pool':
      textEnum = 'Select “Yes” if the property has a pool, or “No” if it doesn’t.';
      break;
    case 'Furnished':
      textEnum =
        'Select “Yes” if the property is furnished, or “No” if it’s unfurnished. Choose “Semi” if it is partly furnished.';
      break;
    case 'Kitchen':
      textEnum = 'Select “Yes” if there’s a kitchen, or “No” if there isn’t.';
      break;
    case 'Airconditioning':
      textEnum = 'Select “Yes” if the property has air conditioning, or “No” if it doesn’t. ';
      break;
    case 'Pet friendly':
      textEnum = 'Select “Yes” if pets are allowed, or “No” if they’re not.';
      break;
    case 'Working desk':
      textEnum = 'Select “Yes” if there’s a working desk, or “No” if there isn’t.';
      break;
    case 'Car parking':
      textEnum = 'Select “Yes” if there’s car parking available, or “No” if there isn’t. ';
      break;
    case 'Gym':
      textEnum = 'Select “Yes” if there’s a gym on-site, or “No” if there isn’t.';
      break;
    case 'Agent or Direct owner':
      textEnum = 'Select if you’re the owner or an agent; this builds trust with users.';
      break;
    case 'Freehold or leasehold':
      textEnum = 'Select “Freehold” for outright ownership, or “Leasehold” for leased property.';
      break;
    case 'Land Title':
      textEnum = 'Select the title (e.g., Hak Milik, HGB); critical for buyers to avoid scams.';
      break;
    case 'Land zone':
      textEnum =
        'Select the zone (e.g., Green, Pink); informs buyers about usage and investment potential.';
      break;
  }
  console.log('label', label);
  return (
    <div className={classes}>
      {label ? (
        <div className={css.customFieldWrapper}>
          <div className={css.labelAndGuide}>
            <label
              htmlFor={id}
              className={classNames({ [css.labelDisabled]: showLabelAsDisabled })}
            >
              {label}
            </label>
            {[
              'Property type',
              'Bedrooms',
              'Bathrooms',
              'Available now',
              'Living',
              'Pool',
              'Furnished',
              'Kitchen',
              'Airconditioning',
              'Pet friendly',
              'Working desk',
              'Car parking',
              'Gym',
              'Agent or Direct owner',
              'Freehold or leasehold',
              'Land Title',
              'Land zone',
            ].includes(label) ? (
              <div className={css.imgWrapper}>
                <img src={iconGuide} alt="instruction" className={css.img} />
                <div className={css.tooltip}>{textEnum}</div>
              </div>
            ) : null}
          </div>
        </div>
      ) : null}
      <select {...selectProps}>{children}</select>
      <ValidationError fieldMeta={meta} />
    </div>
  );
};

/**
 * Final Form Field wrapping <select> input
 *
 * @component
 * @param {Object} props
 * @param {string?} props.className add more style rules in addition to components own css.root
 * @param {string?} props.rootClassName overwrite components own css.root
 * @param {string?} props.selectClassName add more style rules to <select> component
 * @param {string} props.name Name of the input in Final Form
 * @param {string} props.id Label is optional, but if it is given, an id is also required so the label can reference the input in the `for` attribute
 * @param {ReactNode} props.label
 * @param {ReactNode} props.children
 * @param {boolean} props.disabled Whether the select element is disabled
 * @param {boolean} props.showLabelAsDisabled Whether the label is disabled
 * @returns {JSX.Element} Final Form Field containing <select> input
 */
const FieldSelect = props => {
  return <Field component={FieldSelectComponent} {...props} />;
};

export default FieldSelect;
