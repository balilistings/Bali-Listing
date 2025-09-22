import React, { useState, useEffect, useRef } from 'react';
import { RangeSlider } from '../../../../components';
import css from './SimplePriceSelector.module.css';
import { FormattedMessage } from 'react-intl';

const formatPrice = (price, isSize = false) => {
  return isSize ? `${price}` : `${price / 1000000}M`;
};

function SimplePriceSelector({
  priceRange,
  onPriceRangeChange,
  title = 'Price',
  description,
  formatValue,
  min = 1000000,
  max = 999000000000,
  step = 1000000,
  isSize,
}) {
  // Set default formatValue based on isSize prop
  const defaultFormatValue = formatValue || (price => formatPrice(price, isSize));
  const [range, setRange] = useState(priceRange || [min, Math.min(500000000000, max)]);
  const debounceRef = useRef(null);

  // Add separate state for input values to allow intermediate editing
  const [minInputValue, setMinInputValue] = useState(
    isSize ? priceRange?.[0] || min : (priceRange?.[0] || min) / 1000000
  );
  const [maxInputValue, setMaxInputValue] = useState(
    isSize
      ? priceRange?.[1] || Math.min(500000000000, max)
      : (priceRange?.[1] || Math.min(500000000000, max)) / 1000000
  );
  const [isRangeChanging, setIsRangeChanging] = useState(false);

  // Debounced function to call onPriceRangeChange
  const debouncedPriceRangeChange = newRange => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }
    debounceRef.current = setTimeout(() => {
      onPriceRangeChange(newRange);
    }, 300); // 300ms debounce
  };

  // Update input values when range changes (e.g., from slider)
  // But don't interfere when range is changing programmatically
  useEffect(() => {
    if (!isRangeChanging) {
      setMinInputValue(isSize ? range[0] : range[0] / 1000000);
      setMaxInputValue(isSize ? range[1] : range[1] / 1000000);
    }
  }, [range, isRangeChanging, isSize]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, []);

  const handleRangeChange = handles => {
    setIsRangeChanging(true);
    setRange(handles);
    debouncedPriceRangeChange(handles);

    // Reset the flag after a brief delay to allow the change to complete
    setTimeout(() => {
      setIsRangeChanging(false);
    }, 100);
  };

  const handleMinInputChange = e => {
    const inputValue = e.target.value;

    // Prevent typing values beyond absolute max limit
    if (inputValue !== '' && !isNaN(inputValue)) {
      const numValue = parseFloat(inputValue);
      const maxInputLimit = isSize ? max : max / 1000000;
      if (numValue > maxInputLimit) {
        return; // Don't update input if beyond max limit
      }
    }

    setMinInputValue(inputValue);

    // Only update the range if we have a valid number and it's within absolute limits
    if (inputValue !== '' && !isNaN(inputValue)) {
      const numValue = parseFloat(inputValue);
      const actualValue = isSize ? numValue : numValue * 1000000;

      // Validate against absolute limits and current max
      if (actualValue >= min && actualValue <= max && actualValue <= range[1]) {
        const newRange = [actualValue, range[1]];
        setRange(newRange);
        debouncedPriceRangeChange(newRange);
      }
    }
    // Don't call debounced function for empty values - wait for blur or valid input
  };

  const handleMaxInputChange = e => {
    const inputValue = e.target.value;

    // Prevent typing values beyond absolute max limit
    if (inputValue !== '' && !isNaN(inputValue)) {
      const numValue = parseFloat(inputValue);
      const maxInputLimit = isSize ? max : max / 1000000;
      if (numValue > maxInputLimit) {
        return; // Don't update input if beyond max limit
      }
    }

    setMaxInputValue(inputValue);

    // Only update the range if we have a valid number and it's within absolute limits
    if (inputValue !== '' && !isNaN(inputValue)) {
      const numValue = parseFloat(inputValue);
      const actualValue = isSize ? numValue : numValue * 1000000;

      // Validate against absolute limits and current min
      if (actualValue <= max && actualValue >= min && actualValue >= range[0]) {
        const newRange = [range[0], actualValue];
        setRange(newRange);
        debouncedPriceRangeChange(newRange);
      }
    }
    // Don't call debounced function for empty values - wait for blur or valid input
  };

  // Add blur handlers to apply final validation
  const handleMinInputBlur = e => {
    const inputValue = e.target.value;
    if (inputValue !== '' && !isNaN(inputValue)) {
      const numValue = parseFloat(inputValue);
      const actualValue = isSize ? numValue : numValue * 1000000;
      const clampedValue = Math.max(min, Math.min(actualValue, range[1]));

      if (clampedValue !== actualValue) {
        // Update input display to show clamped value
        setMinInputValue(isSize ? clampedValue : clampedValue / 1000000);
        const newRange = [clampedValue, range[1]];
        setRange(newRange);
        debouncedPriceRangeChange(newRange);
      }
    } else if (inputValue === '') {
      // If empty on blur, reset to current range value
      setMinInputValue(isSize ? range[0] : range[0] / 1000000);
    }
  };

  const handleMaxInputBlur = e => {
    const inputValue = e.target.value;
    if (inputValue !== '' && !isNaN(inputValue)) {
      const numValue = parseFloat(inputValue);
      const actualValue = isSize ? numValue : numValue * 1000000;
      const clampedValue = Math.min(max, Math.max(actualValue, range[0]));

      if (clampedValue !== actualValue) {
        // Update input display to show clamped value
        setMaxInputValue(isSize ? clampedValue : clampedValue / 1000000);
        const newRange = [range[0], clampedValue];
        setRange(newRange);
        debouncedPriceRangeChange(newRange);
      }
    } else if (inputValue === '') {
      // If empty on blur, reset to current range value
      setMaxInputValue(isSize ? range[1] : range[1] / 1000000);
    }
  };

  return (
    <div className={css.container}>
      <div className={css.header}>
        <h3 className={css.title}>
          <FormattedMessage id="PriceFilter.label" />
        </h3>
      </div>

      {description && (
        <div className={css.description}>
          <FormattedMessage id={description} />
        </div>
      )}

      {/* Range Slider */}
      <div className={css.sliderSection}>
        <div className={css.sliderWrapper}>
          <RangeSlider
            min={min}
            max={max}
            step={step}
            handles={range}
            onChange={handleRangeChange}
          />
        </div>

        {/* Min/Max Values */}
        <div className={css.priceValues}>
          <div className={css.priceValue}>
            <span className={css.priceLabel}>
              <FormattedMessage id="PageBuilder.SearchCTA.PriceFilter.minimum" />
            </span>
            <input
              type="number"
              className={css.priceAmount}
              value={minInputValue}
              onChange={handleMinInputChange}
              onBlur={handleMinInputBlur}
              min={isSize ? min : min / 1000000}
              max={isSize ? max : max / 1000000}
              step={isSize ? step : step / 1000000}
            />
          </div>
          <div className={css.priceValue}>
            <span className={css.priceLabel}>
              <FormattedMessage id="PageBuilder.SearchCTA.PriceFilter.maximum" />
            </span>
            <input
              type="number"
              className={css.priceAmount}
              value={maxInputValue}
              onChange={handleMaxInputChange}
              onBlur={handleMaxInputBlur}
              min={isSize ? min : min / 1000000}
              max={isSize ? max : max / 1000000}
              step={isSize ? step : step / 1000000}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

export default SimplePriceSelector;
