import React, { useState, useEffect, useRef } from 'react';
import css from './DropdownSelector.module.css';
import { FormattedMessage } from 'react-intl';

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
  const dropdownRef = useRef(null);

  const handleToggle = () => {
    setIsOpen(!isOpen);
  };

  useEffect(() => {
    const handleClickOutside = event => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

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
          <FormattedMessage id="CustomFilters.reset" />
        </button>
      </div>

      {description && <div className={css.description}>{description}</div>}

      <div className={css.dropdownContainer} ref={dropdownRef}>
        <div className={`${css.dropdownInput} ${isOpen ? css.open : ''}`} onClick={handleToggle}>
          <span className={css.dropdownText}>{getDisplayText()}</span>
          <span className={`${css.arrow} ${isOpen ? css.arrowUp : ''}`}>
            <svg
              width="14"
              height="8"
              viewBox="0 0 14 8"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                fill-rule="evenodd"
                clip-rule="evenodd"
                d="M6.60409 7.21013C6.70956 7.31547 6.85253 7.37463 7.00159 7.37463C7.15066 7.37463 7.29362 7.31547 7.39909 7.21013L13.0241 1.58513C13.1235 1.4785 13.1775 1.33746 13.175 1.19174C13.1724 1.04601 13.1134 0.906972 13.0103 0.803913C12.9073 0.700853 12.7682 0.641819 12.6225 0.639248C12.4768 0.636677 12.3357 0.690769 12.2291 0.790129L7.00159 6.01763L1.77409 0.790129C1.66746 0.690769 1.52643 0.636677 1.3807 0.639248C1.23498 0.641819 1.09594 0.700853 0.992878 0.803913C0.889818 0.906972 0.830784 1.04601 0.828213 1.19174C0.825641 1.33746 0.879734 1.4785 0.979094 1.58513L6.60409 7.21013Z"
                fill="#F74DF4"
              />
            </svg>
          </span>
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
