import React, { useState } from 'react';
import { Field } from 'react-final-form';
import classNames from 'classnames';
import { FormattedMessage } from '../../../../../util/reactIntl';

import { OutsideClickHandler, IconCollection, RangeSlider } from '../../../../../components';

import css from './FilterPrice.module.css';

const tabs = [
  { id: 'weekly', label: <FormattedMessage id="PageBuilder.SearchCTA.PriceFilter.weekly" /> },
  { id: 'monthly', label: <FormattedMessage id="PageBuilder.SearchCTA.PriceFilter.monthly" /> },
  { id: 'yearly', label: <FormattedMessage id="PageBuilder.SearchCTA.PriceFilter.yearly" /> },
];

const formatPrice = price => {
  return `${price}M`;
};

const getRangeConfig = tabId => {
  const configs = {
    weekly: { min: 0, max: 99, step: 1 }, // 0-99M
    monthly: { min: 0, max: 500, step: 5 }, // 0-500M
    yearly: { min: 0, max: 1999, step: 10 }, // 0-1999M
  };
  return configs[tabId] || configs.monthly;
};

const PriceDropdown = ({ input, className, rootClassName, alignLeft }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('monthly');
  const [priceRange, setPriceRange] = useState([0, 500]); // Default monthly range: 0-500M

  const toggleDropdown = () => {
    setIsOpen(prev => !prev);
  };

  const closeDropdown = () => {
    setIsOpen(false);
  };

  const handleTabChange = tab => {
    setActiveTab(tab);
    const config = getRangeConfig(tab);
    setPriceRange([config.min, config.max]);
    handleRangeChange([config.min, config.max]);
  };

  const handleRangeChange = handles => {
    setPriceRange(handles);
    // Update the form value with the range and period
    input.onChange({
      period: activeTab,
      minPrice: handles[0],
      maxPrice: handles[1],
    });
  };

  const getCurrentValue = () => {
    if (input.value && priceRange.length > 0) {
      return `${formatPrice(priceRange[0] || 0)} - ${formatPrice(priceRange[1])}`;
    }
    return null;
  };

  const labelText = getCurrentValue() || (
    <FormattedMessage id="PageBuilder.SearchCTA.PriceFilter.placeholder" />
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
          <span className={css.priceIcon}>
            <IconCollection name="area_icon" />
          </span>
          <div className={css.dropdownText}>
            <span className={css.mainLabel}>
              <FormattedMessage id="PageBuilder.SearchCTA.PriceFilter.mainLabel" />
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
            <div className={css.priceModal}>
              <div className={css.tabsContainer}>
                <div className={css.tabsWrapper}>
                  {tabs.map(tab => (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => handleTabChange(tab.id)}
                      className={classNames(css.tab, {
                        [css.activeTab]: activeTab === tab.id,
                      })}
                    >
                      {tab.label}
                    </button>
                  ))}
                  <div
                    className={css.tabIndicator}
                    style={{
                      transform: `translateX(${tabs.findIndex(t => t.id === activeTab) * 100}%)`,
                    }}
                  />
                </div>
              </div>

              {/* Price Range Slider */}
              <div className={css.sliderSection}>
                <div className={css.sliderWrapper}>
                  <RangeSlider
                    min={getRangeConfig(activeTab).min}
                    max={getRangeConfig(activeTab).max}
                    step={getRangeConfig(activeTab).step}
                    handles={priceRange}
                    onChange={handleRangeChange}
                  />
                </div>

                {/* Min/Max Values */}
                <div className={css.priceValues}>
                  <div className={css.priceValue}>
                    <span className={css.priceLabel}>
                      <FormattedMessage id="PageBuilder.SearchCTA.PriceFilter.minimum" />
                    </span>
                    <span className={css.priceAmount}>{formatPrice(priceRange[0])}</span>
                  </div>
                  <div className={css.priceValue}>
                    <span className={css.priceLabel}>
                      <FormattedMessage id="PageBuilder.SearchCTA.PriceFilter.maximum" />
                    </span>
                    <span className={css.priceAmount}>{formatPrice(priceRange[1])}</span>
                  </div>
                </div>
              </div>

              <div className={css.showButtonContainer}>
                <button type="button" className={css.showButton} onClick={closeDropdown}>
                  <FormattedMessage
                    id="PageBuilder.SearchCTA.PriceFilter.showButton"
                    values={{ count: 574 }}
                  />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </OutsideClickHandler>
  );
};

const FilterPrice = props => {
  const { className, rootClassName, form, ...rest } = props;
  return (
    <Field
      {...rest}
      name="pub_price"
      component={PriceDropdown}
      className={className}
      rootClassName={rootClassName}
    />
  );
};

export default FilterPrice;
