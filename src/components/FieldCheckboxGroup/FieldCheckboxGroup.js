/*
 * Renders a group of checkboxes that can be used to select
 * multiple values from a set of options.
 *
 * The corresponding component when rendering the selected
 * values is PropertyGroup.
 *
 */

import React from 'react';
import classNames from 'classnames';
import { FieldArray } from 'react-final-form-arrays';
import { FieldCheckbox, ValidationError } from '../../components';
import guideIcon from '../../assets/guideIcon.png';

import css from './FieldCheckboxGroup.module.css';

const FieldCheckboxRenderer = props => {
  const {
    className,
    rootClassName,
    label,
    optionLabelClassName,
    twoColumns,
    id,
    fields,
    options,
    meta,
    guideText,
    showGuideIcon,
  } = props;
  console.log('fields', fields);
  const classes = classNames(rootClassName || css.root, className);
  const listClasses = twoColumns ? classNames(css.list, css.twoColumns) : css.list;
  let textCheckbox = '';
  if (label == 'Rental period') {
    textCheckbox =
      'Select all allowed periods (Weekly, Monthly, Yearly); users can filter by these.';
  }
  return (
    <fieldset className={classes}>
      {label ? (
        <legend>
          {showGuideIcon && guideText ? (
            <div className={css.labelWithIcon}>
              <span>{label}</span>
              <div className={css.labelIconWrapper}>
                <img src={guideIcon} alt="Rental" className={css.img} />
                <div className={css.tooltip}>{guideText}</div>
              </div>
            </div>
          ) : (
            label
          )}
        </legend>
      ) : null}

      <ul className={listClasses}>
        {options.map((option, index) => {
          const fieldId = `${id}.${option.key}`;
          const textClassName = optionLabelClassName;
          const textClassNameMaybe = textClassName ? { textClassName } : {};
          return (
            <li key={fieldId} className={css.item}>
              <FieldCheckbox
                id={fieldId}
                name={fields.name}
                label={option.label}
                value={option.key}
                onChange={props.onChange}
                {...textClassNameMaybe}
              />
            </li>
          );
        })}
      </ul>
      <ValidationError fieldMeta={{ ...meta }} />
    </fieldset>
  );
};

// Note: name and component are required fields for FieldArray.
// Component-prop we define in this file, name needs to be passed in

/**
 * @typedef {Object} CheckboxGroupOption
 * @property {string} key
 * @property {string} label
 */

/**
 * Final Form Field containing checkbox group.
 * Renders a group of checkboxes that can be used to select
 * multiple values from a set of options.
 *
 * The corresponding component when rendering the selected
 * values is PropertyGroup.
 *
 * @component
 * @param {Object} props
 * @param {string} props.name this is required for FieldArray (Final Form component)
 * @param {string?} props.className add more style rules in addition to components own css.root
 * @param {string?} props.rootClassName overwrite components own css.root
 * @param {string?} props.optionLabelClassName given to each option
 * @param {string} props.id givent to input
 * @param {ReactNode} props.label the label for the checkbox group
 * @param {Array<CheckboxGroupOption>} props.options E.g. [{ key, label }]
 * @param {boolean} props.twoColumns
 * @returns {JSX.Element} Final Form Field containing multiple checkbox inputs
 */
const FieldCheckboxGroup = props => <FieldArray component={FieldCheckboxRenderer} {...props} />;

export default FieldCheckboxGroup;
