import React from 'react';
import css from './PillSelector.module.css';
import { FormattedMessage } from 'react-intl';

function PillSelector({ title, options, selectedOption, onOptionChange, onReset }) {
  const handleOptionSelect = optionId => {
    onOptionChange(optionId);
  };

  const handleReset = () => {
    onOptionChange(null);
    onReset();
  };

  return (
    <div className={css.container}>
      {/* Header */}
      <div className={css.header}>
        <h3 className={css.title}>{title}</h3>
        <button onClick={handleReset} className={css.resetButton}>
          Reset
        </button>
      </div>

      {/* Pills Grid */}
      <div className={css.pillsGrid}>
        {options.map(option => (
          <button
            key={option.id}
            className={`${css.pill} ${selectedOption === option.id ? css.selected : ''}`}
            onClick={() => handleOptionSelect(option.id)}
          >
            {option.label}
          </button>
        ))}
      </div>
    </div>
  );
}

export default PillSelector;
