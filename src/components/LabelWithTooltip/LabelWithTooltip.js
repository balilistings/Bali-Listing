import React from 'react';
import IconCollection from '../IconCollection/IconCollection';

import css from './LabelWithTooltip.module.css';
import { FormattedMessage, useIntl } from 'react-intl';

const LabelWithTooltip = ({ className, label, id }) => {
  const intl = useIntl();

  const tooltipId = id.replace('EditListingDetailsForm.pub_', '');
  const tooltipIntlKey = `EditListingTooltip.${tooltipId}`;
  const hasTooltipMessage = !!intl.messages[tooltipIntlKey];

  return (
    <div className={css.labelAndGuide}>
      <label htmlFor={id} className={className}>
        {label}
      </label>
      {hasTooltipMessage ? (
        <div className={css.imgWrapper}>
          <div className={css.img}>
            <IconCollection name="info_icon" />
          </div>
          <div className={css.tooltip}>
            <FormattedMessage id={tooltipIntlKey} />
          </div>
        </div>
      ) : null}
    </div>
  );
};

export default LabelWithTooltip;
