import React, { useState } from 'react';
import moment from 'moment';
import css from './CustomAvailablePerField.module.css';
import SingleDatePicker from '../../DatePicker/DatePickers/SingleDatePicker';
import LabelWithTooltip from '../../LabelWithTooltip/LabelWithTooltip';

const CustomAvailablePerField = props => {
  const { input, label, formId, name, intl } = props;

  const fieldValue = input?.value;

  // Determine initial selection based on field values
  const getInitialSelection = () => {
    if (fieldValue === 'yes' || fieldValue === 'no') {
      return fieldValue;
    }

    // Handle new date format
    if (fieldValue && typeof fieldValue === 'string' && fieldValue.match(/^\d{4}-\d{2}-\d{2}/)) {
      const date = moment.utc(fieldValue);
      if (date.isValid()) {
        const today = moment.utc().startOf('day');
        return date.isSameOrBefore(today) ? 'yes' : 'no';
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
      const date = moment.utc(fieldValue);
      if (date.isValid()) {
        return date.toDate();
      }
    }

    return null;
  };

  const [selection, setSelection] = useState(getInitialSelection());
  const [selectedDate, setSelectedDate] = useState(getInitialDate());

  // Handle dropdown selection change
  const handleSelectChange = e => {
    const value = e.target.value;
    setSelection(value);

    if (value === 'yes') {
      const today = moment.utc().startOf('day');
      const todayString = today.format('YYYY-MM-DD');
      setSelectedDate(today.toDate());
      input.onChange(todayString);
    } else if (value === 'no') {
      setSelectedDate(null);
      input.onChange(null);
    }
  };

  // Handle date picker change
  const handleDateChange = date => {
    if (date) {
      const momentDate = moment(date);
      setSelectedDate(momentDate.toDate());
      const dateString = momentDate.format('YYYY-MM-DD');
      input.onChange(dateString);
    } else {
      setSelectedDate(null);
      input.onChange(null);
    }
  };

  return (
    <div className={css.customField}>
      <div className={css.fieldSelect}>
        {label ? <LabelWithTooltip label={label} id={'id'} /> : null}
        <select
          id={formId ? `${formId}.${name}-select` : `${name}-select`}
          value={selection}
          onChange={handleSelectChange}
          className={css.select}
        >
          <option value="yes">{intl.formatMessage({ id: 'FieldBoolean.yes' })}</option>
          <option value="no">{intl.formatMessage({ id: 'FieldBoolean.no' })}</option>
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
              const today = moment().startOf('day');
              return moment(day).isBefore(today);
            }}
          />
        </div>
      )}
    </div>
  );
};

export default CustomAvailablePerField;
