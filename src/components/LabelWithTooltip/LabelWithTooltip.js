import React from 'react';
import IconCollection from '../IconCollection/IconCollection';

import css from './LabelWithTooltip.module.css';
import { fieldTooltipText } from '../../util/fieldHelpers';

const LabelWithTooltip = ({ className,label, htmlFor }) => {
  const tooltipText = fieldTooltipText[label];

  return (
    <div className={css.labelAndGuide}>
      <label htmlFor={htmlFor} className={className}>{label}</label>
      {tooltipText ? (
        <div className={css.imgWrapper}>
          <div className={css.img}>
            <IconCollection name="info_icon" />
          </div>
          <div className={css.tooltip}>{tooltipText}</div>
        </div>
      ) : null}
    </div>
  );
};

export default LabelWithTooltip;
