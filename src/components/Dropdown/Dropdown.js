import React from 'react';
import css from './Dropdown.module.css';

const Dropdown = ({ value, onChange, options, label }) => {
  return (
    <div>
      <label className={css.selectLabel}>{label}</label>
      <div className={css.selectContainer}>
        <select className={css.selectField} value={value} onChange={e => onChange(e.target.value)}>
          <option value="">Choose a role</option>
          {options.map(option => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <span className={css.selectArrow}>&#x25BC;</span>
      </div>
    </div>
  );
};

export default Dropdown;
