import React from 'react';
import { useForm, Field } from 'react-final-form';
import dayjs from 'dayjs';
import classNames from 'classnames';

import { ValidationError } from '../../../components';

import SingleDatePicker from '../../DatePicker/DatePickers/SingleDatePicker';
import LabelWithTooltip from '../../LabelWithTooltip/LabelWithTooltip';
import css from './CustomAvailablePerField.module.css';

// This is the "dumb" component that renders the UI.
// In this approach, the parent Field with format/parse will handle the conversion
// So input.value will already be the string "yes" or "no"
const CustomAvailablePerComponent = props => {
  const { input, meta, label, intl, formId } = props;
  const form = useForm();
  const dateFieldName = 'availableDate';

  // input.value is now the string "yes" or "no" thanks to format function
  const selection = input.value;

  const handleSelectChange = e => {
    const newValue = e.target.value; // This will be "yes" or "no"
    input.onChange(newValue);
    if (newValue === 'yes') {
      // When user selects "yes", we clear the date field.
      form.change(dateFieldName, null);
    }
  };

  const { touched, error } = meta;
  const hasError = touched && error;

  // On initial load, if the selection is "yes", make sure date field is cleared
  React.useEffect(() => {
    if (selection === 'yes') {
      form.change(dateFieldName, null);
    }
  }, [selection, form, dateFieldName]);

  return (
    <div className={css.customField}>
      <div className={css.fieldSelect}>
        {label ? (
          <LabelWithTooltip
            label={label}
            id={'EditListingDetailsForm.pub_availableper'}
          />
        ) : null}
        <select
          id={formId ? `${formId}.${input.name}-select` : `${input.name}-select`}
          value={selection}
          onChange={handleSelectChange}
          className={classNames(css.select, { [css.selectError]: hasError })}
        >
          <option value="yes">Yes</option>
          <option value="no">No</option>
        </select>
        <ValidationError fieldMeta={meta} />
      </div>

      {selection === 'no' ? (
        <div style={{ marginTop: '24px' }}>
          <LabelWithTooltip
            label="Availability Date"
            id={formId ? `${formId}.${dateFieldName}-date` : `${dateFieldName}-date`}
          />
          {/* This is a standard Field for the date picker. It gets its initial value from the form's initialValues. */}
          <Field
            name={dateFieldName}
            render={({ input: datePickerInput, meta: datePickerMeta }) => {
              const date = datePickerInput.value ? dayjs.utc(datePickerInput.value).toDate() : null;
              const handleDateChange = dateObject => {
                if (dateObject) {
                  const dateString = dayjs(dateObject).format('YYYY-MM-DD');
                  datePickerInput.onChange(dateString);
                } else {
                  datePickerInput.onChange(null);
                }
              };
              return (
                <SingleDatePicker
                  id={formId ? `${formId}.${dateFieldName}-date` : `${dateFieldName}-date`}
                  input={datePickerInput}
                  meta={datePickerMeta}
                  placeholderText={intl.formatMessage({
                    id: 'CustomExtendedDataField.availablePerDatePlaceholder',
                  })}
                  value={date}
                  onChange={handleDateChange}
                  onFocus={datePickerInput.onFocus}
                  onBlur={datePickerInput.onBlur}
                  isDayBlocked={day => dayjs(day).isBefore(dayjs().startOf('day'))}
                />
              );
            }}
          />
        </div>
      ) : null}
    </div>
  );
};

const CustomAvailablePerField = props => {
  return <Field component={CustomAvailablePerComponent} {...props} />;
};

export default CustomAvailablePerField;
