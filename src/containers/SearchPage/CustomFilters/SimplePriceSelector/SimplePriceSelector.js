import React, { useState } from 'react';
import { RangeSlider } from '../../../../components';
import css from './SimplePriceSelector.module.css';

const formatPrice = price => {
  return `${price}M`;
};

function SimplePriceSelector({
  priceRange,
  onPriceRangeChange,
  onReset,
  title = 'Price',
  description,
  formatValue = formatPrice,
  min = 0,
  max = 10000,
  step = 100,
}) {
  const [range, setRange] = useState(priceRange || [min, max / 2]);

  const handleRangeChange = handles => {
    setRange(handles);
    onPriceRangeChange(handles);
  };

  return (
    <div className={css.container}>
      <div className={css.header}>
        <h3 className={css.title}>{title}</h3>
        <button onClick={onReset} className={css.resetButton}>
          Reset
        </button>
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
            <span className={css.priceAmount}>{formatValue(range[0])}</span>
          </div>
          <div className={css.priceValue}>
            <span className={css.priceLabel}>maximum</span>
            <span className={css.priceAmount}>{formatValue(range[1])}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default SimplePriceSelector;
