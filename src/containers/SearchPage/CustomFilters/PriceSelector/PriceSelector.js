import React, { useState, useEffect, useRef } from 'react';
import { RangeSlider } from '../../../../components';
import css from './PriceSelector.module.css';

const tabs = [
  { id: 'weekly', label: 'Weekly' },
  { id: 'monthly', label: 'Monthly' },
  { id: 'yearly', label: 'Yearly' },
];

const getRangeConfig = tabId => {
  const configs = {
    weekly: { min: 1000000, max: 150000000, step: 1000000 }, // 1M-150M
    monthly: { min: 1000000, max: 500000000, step: 5000000 }, // 1M-500M
    yearly: { min: 50000000, max: 5000000000, step: 50000000 }, // 50M-5000M
  };
  return configs[tabId] || configs.monthly;
};

const formatPrice = price => {
  return `${price / 1000000}M`;
};

function PriceSelector({ selectedPeriod, onPeriodChange, priceRange, onPriceRangeChange }) {
  const [activeTab, setActiveTab] = useState(selectedPeriod || 'monthly');
  const [range, setRange] = useState(priceRange || [1000000, 500000000]);
  const debounceRef = useRef(null);

  // Debounced function to call onPriceRangeChange
  const debouncedPriceRangeChange = newRange => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }
    debounceRef.current = setTimeout(() => {
      onPriceRangeChange(newRange, activeTab);
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

  const handleTabChange = tabId => {
    setActiveTab(tabId);
    const config = getRangeConfig(tabId);
    const newRange = [config.min, config.max];
    setRange(newRange);
    onPeriodChange(tabId);
    // Immediate call for tab change, no debouncing
    onPriceRangeChange(newRange, tabId);
  };

  const handleRangeChange = handles => {
    setRange(handles);
    debouncedPriceRangeChange(handles);
  };

  const handleMinInputChange = e => {
    const value = parseFloat(e.target.value) * 1000000 || 0;
    const config = getRangeConfig(activeTab);
    const clampedValue = Math.max(config.min, Math.min(value, range[1]));
    const newRange = [clampedValue, range[1]];
    setRange(newRange);
    debouncedPriceRangeChange(newRange);
  };

  const handleMaxInputChange = e => {
    const value = parseFloat(e.target.value) * 1000000 || 0;
    const config = getRangeConfig(activeTab);
    const clampedValue = Math.min(config.max, Math.max(value, range[0]));
    const newRange = [range[0], clampedValue];
    setRange(newRange);
    debouncedPriceRangeChange(newRange);
  };

  const config = getRangeConfig(activeTab);

  // console.log('config', config);
  // console.log('selectedPeriod', selectedPeriod);
  // console.log('priceRange', priceRange);

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
            <input
              type="number"
              className={css.priceAmount}
              value={range[0] / 1000000}
              onChange={handleMinInputChange}
              min={config.min / 1000000}
              max={config.max / 1000000}
              step={config.step / 1000000}
            />
          </div>
          <div className={css.priceValue}>
            <span className={css.priceLabel}>maximum</span>
            <input
              type="number"
              className={css.priceAmount}
              value={range[1] / 1000000}
              onChange={handleMaxInputChange}
              min={config.min / 1000000}
              max={config.max / 1000000}
              step={config.step / 1000000}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

export default PriceSelector;
