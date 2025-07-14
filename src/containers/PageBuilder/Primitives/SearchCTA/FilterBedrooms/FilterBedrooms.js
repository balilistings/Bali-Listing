import React, { useState } from 'react';
import { Field } from 'react-final-form';
import classNames from 'classnames';
import { FormattedMessage } from '../../../../../util/reactIntl';

import { OutsideClickHandler, IconCollection } from '../../../../../components';

import css from './FilterBedrooms.module.css';

const BedroomDropdown = ({ input, className, rootClassName, alignLeft }) => {
  const [isOpen, setIsOpen] = useState(false);

  const toggleDropdown = () => {
    setIsOpen(prev => !prev);
  };

  const closeDropdown = () => {
    setIsOpen(false);
  };

  const handleIncrement = () => {
    const currentValue = input.value || 0;
    const numValue = typeof currentValue === 'string' ? parseInt(currentValue, 10) : currentValue;
    const newValue = Math.min(6, numValue + 1);
    input.onChange(newValue);
  };

  const handleDecrement = () => {
    const currentValue = input.value || 0;
    const numValue = typeof currentValue === 'string' ? parseInt(currentValue, 10) : currentValue;
    const newValue = Math.max(0, numValue - 1);
    input.onChange(newValue);
  };

  const numValue = input.value || 0;
  const displayValue = typeof numValue === 'string' ? parseInt(numValue, 10) : numValue;

  const labelText =
    displayValue > 0 ? (
      displayValue === 1 ? (
        <FormattedMessage id="PageBuilder.SearchCTA.BedroomFilter.oneBedroom" />
      ) : (
        <FormattedMessage
          id="PageBuilder.SearchCTA.BedroomFilter.multipleBedrooms"
          values={{ count: displayValue }}
        />
      )
    ) : (
      <FormattedMessage id="PageBuilder.SearchCTA.BedroomFilter.placeholder" />
    );

  const rootClass = rootClassName || css.root;
  const classes = classNames(rootClass, className);

  return (
    <OutsideClickHandler className={classes} onOutsideClick={() => setIsOpen(false)}>
      <div className={css.dropdownContainer}>
        <div
          role="button"
          tabIndex={0}
          onClick={toggleDropdown}
          onKeyDown={e => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              toggleDropdown();
            }
          }}
          className={classNames(css.toggleButton, {
            [css.unselected]: displayValue === 0 && !isOpen,
            [css.selected]: displayValue > 0,
            [css.opened]: isOpen,
          })}
        >
          <span className={css.bedroomIcon}>
            <IconCollection name="bedroom_icon" />
          </span>
          <div className={css.dropdownText}>
            <span className={css.mainLabel}>
              <FormattedMessage id="PageBuilder.SearchCTA.BedroomFilter.mainLabel" />
            </span>
            <span className={css.subLabel}>{labelText}</span>
          </div>
          <span className={classNames(css.chevron, isOpen && css.isOpen)} />
        </div>

        {isOpen && (
          <div
            className={classNames(css.dropdownContent, {
              [css.alignLeft]: alignLeft,
            })}
          >
            <div className={css.counterModal}>
              <div className={css.counterRow}>
                <span className={css.counterTitle}>
                  <FormattedMessage id="PageBuilder.SearchCTA.BedroomFilter.counterTitle" />
                </span>

                <div className={css.counterControls}>
                  <button
                    type="button"
                    className={classNames(css.counterButton, css.decrementButton)}
                    onClick={handleDecrement}
                    disabled={displayValue <= 0}
                    aria-label="Decrease bedrooms"
                  >
                    <span className={css.counterButtonIcon}>−</span>
                  </button>

                  <span className={css.counterValue}>{displayValue}</span>

                  <button
                    type="button"
                    className={classNames(css.counterButton, css.incrementButton)}
                    onClick={handleIncrement}
                    disabled={displayValue >= 6}
                    aria-label="Increase bedrooms"
                  >
                    <span className={css.counterButtonIcon}>+</span>
                  </button>
                </div>
              </div>

              <div className={css.nextButtonContainer}>
                <button type="button" className={css.nextButton} onClick={closeDropdown}>
                  <FormattedMessage id="PageBuilder.SearchCTA.BedroomFilter.nextButton" />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </OutsideClickHandler>
  );
};

const FilterBedrooms = props => {
  const { className, rootClassName, ...rest } = props;
  return (
    <Field
      {...rest}
      name="pub_bedrooms"
      component={BedroomDropdown}
      className={className}
      rootClassName={rootClassName}
    />
  );
};

export default FilterBedrooms;
