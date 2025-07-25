import React from 'react';
import css from './CounterSelector.module.css';

function CounterSelector({
  title,
  subtitle,
  description,
  value,
  onValueChange,
  onReset,
  min = 0,
  max = 10,
  showPlus = false,
}) {
  const handleIncrement = () => {
    if (value < max) {
      onValueChange(value + 1);
    }
  };

  const handleDecrement = () => {
    if (value > min) {
      onValueChange(value - 1);
    }
  };

  return (
    <div className={css.container}>
      {/* Header */}
      <div className={css.header}>
        <h3 className={css.title}>{title}</h3>
        <button onClick={onReset} className={css.resetButton}>
          Reset
        </button>
      </div>

      {/* Content */}
      <div className={css.content}>
        <div className={css.subtitleRow}>
          <span className={css.subtitle}>{subtitle}</span>
          <div className={css.counter}>
            <button
              onClick={handleDecrement}
              className={`${css.counterButton} ${value <= min ? css.disabled : ''}`}
              disabled={value <= min}
            >
              -
            </button>
            <span className={css.counterValue}>{value === 6 && showPlus ? '6+' : value}</span>
            <button
              onClick={handleIncrement}
              className={`${css.counterButton} ${value >= max ? css.disabled : ''}`}
              disabled={value >= max}
            >
              +
            </button>
          </div>
        </div>
        <p className={css.description}>{description}</p>
      </div>
    </div>
  );
}

export default CounterSelector;
