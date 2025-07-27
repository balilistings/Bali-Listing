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

  // Add separate state for input values to allow intermediate editing
  const getInitialConfig = () => getRangeConfig(selectedPeriod || 'monthly');
  const initialConfig = getInitialConfig();
  const [minInputValue, setMinInputValue] = useState(
    (priceRange?.[0] || initialConfig.min) / 1000000
  );
  const [maxInputValue, setMaxInputValue] = useState(
    (priceRange?.[1] || initialConfig.max) / 1000000
  );
  const [isTabChanging, setIsTabChanging] = useState(false);

  // Debounced function to call onPriceRangeChange
  const debouncedPriceRangeChange = newRange => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }
    debounceRef.current = setTimeout(() => {
      onPriceRangeChange(newRange, activeTab);
    }, 300); // 300ms debounce
  };

  // Update input values when range changes (e.g., from slider)
  // But don't interfere when tab is changing
  useEffect(() => {
    if (!isTabChanging) {
      setMinInputValue(range[0] / 1000000);
      setMaxInputValue(range[1] / 1000000);
    }
  }, [range, isTabChanging]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, []);

  const handleTabChange = tabId => {
    setIsTabChanging(true);
    setActiveTab(tabId);
    const config = getRangeConfig(tabId);
    const newRange = [config.min, config.max];
    setRange(newRange);
    setMinInputValue(config.min / 1000000);
    setMaxInputValue(config.max / 1000000);
    onPeriodChange(tabId);
    // Immediate call for tab change, no debouncing
    onPriceRangeChange(newRange, tabId);

    // Reset the flag after a brief delay to allow the change to complete
    setTimeout(() => {
      setIsTabChanging(false);
    }, 100);
  };

  const handleRangeChange = handles => {
    setRange(handles);
    debouncedPriceRangeChange(handles);
  };

  const handleMinInputChange = e => {
    const inputValue = e.target.value;
    const config = getRangeConfig(activeTab);

    // Prevent typing values beyond absolute max limit
    if (inputValue !== '' && !isNaN(inputValue)) {
      const numValue = parseFloat(inputValue);
      if (numValue > config.max / 1000000) {
        return; // Don't update input if beyond max limit
      }
    }

    setMinInputValue(inputValue);

    // Only update the range if we have a valid number and it's within absolute limits
    if (inputValue !== '' && !isNaN(inputValue)) {
      const value = parseFloat(inputValue) * 1000000;

      // Validate against absolute config limits and current max
      if (value >= config.min && value <= config.max && value <= range[1]) {
        const newRange = [value, range[1]];
        setRange(newRange);
        debouncedPriceRangeChange(newRange);
      }
    }
    // Don't call debounced function for empty values - wait for blur or valid input
  };

  const handleMaxInputChange = e => {
    const inputValue = e.target.value;
    const config = getRangeConfig(activeTab);

    // Prevent typing values beyond absolute max limit
    if (inputValue !== '' && !isNaN(inputValue)) {
      const numValue = parseFloat(inputValue);
      if (numValue > config.max / 1000000) {
        return; // Don't update input if beyond max limit
      }
    }

    setMaxInputValue(inputValue);

    // Only update the range if we have a valid number and it's within absolute limits
    if (inputValue !== '' && !isNaN(inputValue)) {
      const value = parseFloat(inputValue) * 1000000;

      // Validate against absolute config limits and current min
      if (value <= config.max && value >= config.min && value >= range[0]) {
        const newRange = [range[0], value];
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
      const value = parseFloat(inputValue) * 1000000;
      const config = getRangeConfig(activeTab);
      const clampedValue = Math.max(config.min, Math.min(value, range[1]));

      if (clampedValue !== value) {
        // Update input display to show clamped value
        setMinInputValue(clampedValue / 1000000);
        const newRange = [clampedValue, range[1]];
        setRange(newRange);
        debouncedPriceRangeChange(newRange);
      }
    } else if (inputValue === '') {
      // If empty on blur, reset to current range value
      setMinInputValue(range[0] / 1000000);
    }
  };

  const handleMaxInputBlur = e => {
    const inputValue = e.target.value;
    if (inputValue !== '' && !isNaN(inputValue)) {
      const value = parseFloat(inputValue) * 1000000;
      const config = getRangeConfig(activeTab);
      const clampedValue = Math.min(config.max, Math.max(value, range[0]));

      if (clampedValue !== value) {
        // Update input display to show clamped value
        setMaxInputValue(clampedValue / 1000000);
        const newRange = [range[0], clampedValue];
        setRange(newRange);
        debouncedPriceRangeChange(newRange);
      }
    } else if (inputValue === '') {
      // If empty on blur, reset to current range value
      setMaxInputValue(range[1] / 1000000);
    }
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
              value={minInputValue}
              onChange={handleMinInputChange}
              onBlur={handleMinInputBlur}
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
              value={maxInputValue}
              onChange={handleMaxInputChange}
              onBlur={handleMaxInputBlur}
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
