import React, { useState } from 'react';
import css from './DropdownSelector.module.css';

function DropdownSelector({
  title,
  description,
  options,
  selectedOptions = [],
  onSelectionChange,
  onReset,
  placeholder,
}) {
  const [isOpen, setIsOpen] = useState(false);

  const handleToggle = () => {
    setIsOpen(!isOpen);
  };

  const handleOptionToggle = optionId => {
    const newSelection = selectedOptions.includes(optionId)
      ? selectedOptions.filter(id => id !== optionId)
      : [...selectedOptions, optionId];

    onSelectionChange(newSelection);
  };

  const handleReset = () => {
    onSelectionChange([]);
    onReset();
  };

  const getDisplayText = () => {
    if (selectedOptions.length === 0) {
      return placeholder || `Select ${title.toLowerCase()}`;
    }
    if (selectedOptions.length === 1) {
      const selectedOption = options.find(opt => opt.id === selectedOptions[0]);
      return selectedOption ? selectedOption.label : placeholder;
    }
    return `${selectedOptions.length} selected`;
  };

  return (
    <div className={css.container}>
      <div className={css.header}>
        <h3 className={css.title}>{title}</h3>
        <button onClick={handleReset} className={css.resetButton}>
          Reset
        </button>
      </div>

      {description && <div className={css.description}>{description}</div>}

      <div className={css.dropdownContainer}>
        <div className={`${css.dropdownInput} ${isOpen ? css.open : ''}`} onClick={handleToggle}>
          <span className={css.dropdownText}>{getDisplayText()}</span>
          <span className={`${css.arrow} ${isOpen ? css.arrowUp : ''}`}>▼</span>
        </div>

        {isOpen && (
          <div className={css.dropdownContent}>
            {options.map(option => (
              <label key={option.id} className={css.option}>
                <input
                  type="checkbox"
                  checked={selectedOptions.includes(option.id)}
                  onChange={() => handleOptionToggle(option.id)}
                  className={css.checkbox}
                />
                <span className={css.optionLabel}>{option.label}</span>
              </label>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default DropdownSelector;
