import React, { useState } from 'react';
import { useIntl } from '../../util/reactIntl';
import css from './CustomExtendedDataField.module.css';
import SingleDatePicker from '../DatePicker/DatePickers/SingleDatePicker';

const CustomAvailablePerField = props => {
  const intl = useIntl();
  const { input, label, formId, name } = props;

  const fieldValue = input?.value;

  // Determine initial selection based on field values
  const getInitialSelection = () => {
    if (fieldValue === 'yes' || fieldValue === 'no') {
      return fieldValue;
    }

    // Handle new date format
    if (fieldValue && typeof fieldValue === 'string' && fieldValue.match(/^\d{4}-\d{2}-\d{2}/)) {
      const date = new Date(fieldValue);
      if (date instanceof Date && !isNaN(date)) {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        date.setHours(0, 0, 0, 0);

        return date <= today ? 'yes' : 'no';
      }
    }
    return 'yes';
  };

  // Determine initial date based on field values
  const getInitialDate = () => {
    if (fieldValue === 'yes' || fieldValue === 'no') {
      return null;
    }

    if (fieldValue && typeof fieldValue === 'string' && fieldValue.match(/^\d{4}-\d{2}-\d{2}/)) {
      const date = new Date(fieldValue);
      if (date instanceof Date && !isNaN(date)) {
        return date;
      }
    }

    return null;
  };

  // State to track which option is selected
  const [selection, setSelection] = useState(getInitialSelection());

  // State to track the selected date
  const [selectedDate, setSelectedDate] = useState(getInitialDate());

  // Handle dropdown selection change
  const handleSelectChange = e => {
    // For native select, we get the value directly
    const value = e.target.value;
    setSelection(value);

    // If user selects "yes", set today's date as the value
    if (value === 'yes') {
      const today = new Date();
      const todayString = today.toISOString().split('T')[0]; // Format as YYYY-MM-DD
      setSelectedDate(today);
      // Update the form field value to today's date
      input.onChange(todayString);
    }
    // If user selects "no", clear the date value initially
    else if (value === 'no') {
      setSelectedDate(null);
      input.onChange(null);
    }
  };

  // Handle date picker change
  const handleDateChange = date => {
    if (date instanceof Date && !isNaN(date)) {
      setSelectedDate(date);
      // Format date as YYYY-MM-DD string
      const dateString = date.toISOString().split('T')[0];
      input.onChange(dateString);
    } else {
      setSelectedDate(null);
      input.onChange(null);
    }
  };

  return (
    <div className={css.customField}>
      <div className={css.fieldSelect}>
        {label && (
          <label htmlFor={formId ? `${formId}.${name}-select` : `${name}-select`}>{label}</label>
        )}
        <select
          id={formId ? `${formId}.${name}-select` : `${name}-select`}
          value={selection}
          onChange={handleSelectChange}
          className={css.select}
        >
          <option value="yes">
            {intl.formatMessage({ id: 'CustomExtendedDataField.availablePerYes' })}
          </option>
          <option value="no">
            {intl.formatMessage({ id: 'CustomExtendedDataField.availablePerNo' })}
          </option>
        </select>
      </div>

      {selection === 'no' && (
        <div style={{ marginTop: '16px' }}>
          <SingleDatePicker
            id={formId ? `${formId}.${name}-date` : `${name}-date`}
            name={name}
            label={intl.formatMessage({ id: 'CustomExtendedDataField.availablePerDateLabel' })}
            placeholderText={intl.formatMessage({
              id: 'CustomExtendedDataField.availablePerDatePlaceholder',
            })}
            value={selectedDate}
            onChange={handleDateChange}
            isDayBlocked={day => {
              const today = new Date();
              today.setHours(0, 0, 0, 0);
              return day < today;
            }}
          />
        </div>
      )}
    </div>
  );
};

export default CustomAvailablePerField;
