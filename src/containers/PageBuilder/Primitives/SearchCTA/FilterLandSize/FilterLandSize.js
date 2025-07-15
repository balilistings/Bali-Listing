import React, { useState } from 'react';
import { Field } from 'react-final-form';
import classNames from 'classnames';
import { FormattedMessage } from '../../../../../util/reactIntl';

import { OutsideClickHandler, IconCollection, RangeSlider } from '../../../../../components';

import css from './FilterLandSize.module.css';

const formatLandSize = size => {
  return `${size} m2`;
};

const LandSizeDropdown = ({ input, className, rootClassName, alignLeft }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [landSizeRange, setLandSizeRange] = useState([0, 1000]);

  const toggleDropdown = () => {
    setIsOpen(prev => !prev);
  };

  const closeDropdown = () => {
    setIsOpen(false);
  };

  const handleRangeChange = handles => {
    setLandSizeRange(handles);
    // Update the form value with the range
    input.onChange({
      minSize: handles[0],
      maxSize: handles[1],
    });
  };

  const getCurrentValue = () => {
    if (input.value && landSizeRange.length > 0) {
      return `${formatLandSize(landSizeRange[0])} - ${formatLandSize(landSizeRange[1])}`;
    }
    return null;
  };

  const labelText = getCurrentValue() || (
    <FormattedMessage id="PageBuilder.SearchCTA.LandSizeFilter.placeholder" />
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
            [css.unselected]: !getCurrentValue() && !isOpen,
            [css.selected]: getCurrentValue(),
            [css.opened]: isOpen,
          })}
        >
          <span className={css.landSizeIcon}>
            <IconCollection name="area_icon" />
          </span>
          <div className={css.dropdownText}>
            <span className={css.mainLabel}>
              <FormattedMessage id="PageBuilder.SearchCTA.LandSizeFilter.mainLabel" />
            </span>
            <span className={css.subLabel}>{labelText}</span>
          </div>
          {/* <span className={classNames(css.chevron, isOpen && css.isOpen)} /> */}
        </div>

        {isOpen && (
          <div
            className={classNames(css.dropdownContent, {
              [css.alignLeft]: alignLeft,
            })}
          >
            <div className={css.landSizeModal}>
              {/* Land Size Range Slider */}
              <div className={css.sliderSection}>
                <div className={css.sliderWrapper}>
                  <RangeSlider
                    min={0}
                    max={1000}
                    step={1}
                    handles={landSizeRange}
                    onChange={handleRangeChange}
                  />
                </div>

                {/* Min/Max Values */}
                <div className={css.priceValues}>
                  <div className={css.priceValue}>
                    <span className={css.priceLabel}>
                      <FormattedMessage id="PageBuilder.SearchCTA.LandSizeFilter.minimum" />
                    </span>
                    <span className={css.priceAmount}>{formatLandSize(landSizeRange[0])}</span>
                  </div>
                  <div className={css.priceValue}>
                    <span className={css.priceLabel}>
                      <FormattedMessage id="PageBuilder.SearchCTA.LandSizeFilter.maximum" />
                    </span>
                    <span className={css.priceAmount}>{formatLandSize(landSizeRange[1])}</span>
                  </div>
                </div>
              </div>

              {/* Next Button */}
              <div className={css.nextButtonContainer}>
                <button type="button" className={css.nextButton} onClick={closeDropdown}>
                  <FormattedMessage id="PageBuilder.SearchCTA.LandSizeFilter.nextButton" />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </OutsideClickHandler>
  );
};

// Final Form wrapper
const FilterLandSize = props => {
  const { className, rootClassName, ...rest } = props;
  return (
    <Field
      {...rest}
      name="pub_landSize"
      component={LandSizeDropdown}
      className={className}
      rootClassName={rootClassName}
    />
  );
};

export default FilterLandSize;
