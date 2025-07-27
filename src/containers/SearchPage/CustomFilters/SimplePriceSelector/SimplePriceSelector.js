import React, { useState, useEffect, useRef } from 'react';
import { RangeSlider } from '../../../../components';
import css from './SimplePriceSelector.module.css';

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
  const [range, setRange] = useState(priceRange || [min, 500000000000]);
  const debounceRef = useRef(null);

  // Debounced function to call onPriceRangeChange
  const debouncedPriceRangeChange = newRange => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }
    debounceRef.current = setTimeout(() => {
      onPriceRangeChange(newRange);
    }, 300); // 300ms debounce
  };

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, []);

  const handleRangeChange = handles => {
    setRange(handles);
    debouncedPriceRangeChange(handles);
  };

  const handleMinInputChange = e => {
    const value = parseFloat(e.target.value) || 0;
    const actualValue = isSize ? value : value * 1000000;
    const clampedValue = Math.max(min, Math.min(actualValue, range[1]));
    const newRange = [clampedValue, range[1]];
    setRange(newRange);
    debouncedPriceRangeChange(newRange);
  };

  const handleMaxInputChange = e => {
    const value = parseFloat(e.target.value) || 0;
    const actualValue = isSize ? value : value * 1000000;
    const clampedValue = Math.min(max, Math.max(actualValue, range[0]));
    const newRange = [range[0], clampedValue];
    setRange(newRange);
    debouncedPriceRangeChange(newRange);
  };

  // console.log('inisdeeee range', range);
  // console.log('inisdeeee min', min);
  // console.log('inisdeeee max', max);
  // console.log('inisdeeee step', step);
  return (
    <div className={css.container}>
      <div className={css.header}>
        <h3 className={css.title}>{title}</h3>
      </div>

      {description && <div className={css.description}>{description}</div>}

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
            <span className={css.priceLabel}>minimum</span>
            <input
              type="number"
              className={css.priceAmount}
              value={isSize ? range[0] : range[0] / 1000000}
              onChange={handleMinInputChange}
              min={isSize ? min : min / 1000000}
              max={isSize ? max : max / 1000000}
              step={isSize ? step : step / 1000000}
            />
          </div>
          <div className={css.priceValue}>
            <span className={css.priceLabel}>maximum</span>
            <input
              type="number"
              className={css.priceAmount}
              value={isSize ? range[1] : range[1] / 1000000}
              onChange={handleMaxInputChange}
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
