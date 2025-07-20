import React, { useState } from 'react';
import { RangeSlider } from '../../../../components';
import css from './PriceSelector.module.css';

const tabs = [
  { id: 'weekly', label: 'Weekly' },
  { id: 'monthly', label: 'Monthly' },
  { id: 'yearly', label: 'Yearly' },
];

const getRangeConfig = tabId => {
  const configs = {
    weekly: { min: 0, max: 99, step: 1 },
    monthly: { min: 0, max: 500, step: 5 },
    yearly: { min: 0, max: 1999, step: 10 },
  };
  return configs[tabId] || configs.monthly;
};

const formatPrice = price => {
  return `${price}M`;
};

function PriceSelector({ selectedPeriod, onPeriodChange, priceRange, onPriceRangeChange }) {
  const [activeTab, setActiveTab] = useState(selectedPeriod || 'weekly');
  const [range, setRange] = useState(priceRange || [0, 50]);

  const handleTabChange = tabId => {
    setActiveTab(tabId);
    const config = getRangeConfig(tabId);
    const newRange = [config.min, Math.min(config.max / 2, range[1])];
    setRange(newRange);
    onPeriodChange(tabId);
    onPriceRangeChange(newRange);
  };

  const handleRangeChange = handles => {
    setRange(handles);
    onPriceRangeChange(handles);
  };

  const config = getRangeConfig(activeTab);

  return (
    <div className={css.container}>
      <div className={css.header}>
        <h3 className={css.title}>Price</h3>
        <p className={css.description}>Select a price range per week, month, or year</p>
      </div>

      {/* Tabs */}
      <div className={css.tabsContainer}>
        <div className={css.tabsWrapper}>
          {tabs.map(tab => (
            <button
              key={tab.id}
              type="button"
              onClick={() => handleTabChange(tab.id)}
              className={`${css.tab} ${activeTab === tab.id ? css.activeTab : ''}`}
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

      {/* Range Slider */}
      <div className={css.sliderSection}>
        <div className={css.sliderWrapper}>
          <RangeSlider
            min={config.min}
            max={config.max}
            step={config.step}
            handles={range}
            onChange={handleRangeChange}
          />
        </div>

        {/* Min/Max Values */}
        <div className={css.priceValues}>
          <div className={css.priceValue}>
            <span className={css.priceLabel}>minimum</span>
            <span className={css.priceAmount}>{formatPrice(range[0])}</span>
          </div>
          <div className={css.priceValue}>
            <span className={css.priceLabel}>maximum</span>
            <span className={css.priceAmount}>{formatPrice(range[1])}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default PriceSelector;
