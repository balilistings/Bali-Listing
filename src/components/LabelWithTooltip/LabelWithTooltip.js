import React, { useState, useEffect, useRef } from 'react';
import IconCollection from '../IconCollection/IconCollection';

import css from './LabelWithTooltip.module.css';
import { FormattedMessage, useIntl } from 'react-intl';

const LabelWithTooltip = ({ className, label, id }) => {
  const intl = useIntl();
  const [isTooltipVisible, setIsTooltipVisible] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const tooltipRef = useRef(null);

  // Detect if we're on mobile device
  useEffect(() => {
    const checkIsMobile = () => {
      const mobileCheck = /Mobi|Android/i.test(navigator.userAgent) || window.innerWidth <= 768;
      setIsMobile(mobileCheck);
      return mobileCheck;
    };

    checkIsMobile();

    // Add resize listener to handle device rotation/resizing
    const handleResize = () => {
      const isNowMobile = checkIsMobile();
      if (!isNowMobile && isTooltipVisible) {
        setIsTooltipVisible(false);
      }
    };

    window.addEventListener('resize', handleResize);
    
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, [isTooltipVisible]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (isMobile && isTooltipVisible && tooltipRef.current && !tooltipRef.current.contains(event.target)) {
        setIsTooltipVisible(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isMobile, isTooltipVisible]);

  const tooltipId = id.replace('EditListingDetailsForm.pub_', '');
  const tooltipIntlKey = `EditListingTooltip.${tooltipId}`;
  const hasTooltipMessage = !!intl.messages[tooltipIntlKey];
  const translatedLabel = intl.messages[label] ? intl.messages[label] : label;

  const toggleTooltip = (e) => {
    if (isMobile) {
      e.stopPropagation();
      setIsTooltipVisible(!isTooltipVisible);
    }
  };

  return (
    <div className={css.labelAndGuide}>
      <label htmlFor={id} className={className}>
        {translatedLabel}
      </label>
      {hasTooltipMessage ? (
        <div 
          ref={tooltipRef}
          className={`${css.imgWrapper} ${isTooltipVisible ? css.active : ''}`}
          onClick={isMobile ? toggleTooltip : undefined}
        >
          <div className={css.img}>
            <IconCollection name="info_icon" />
          </div>
          <div className={`${css.tooltip} ${isTooltipVisible ? css.visible : ''}`}>
            <FormattedMessage id={tooltipIntlKey} />
          </div>
        </div>
      ) : null}
    </div>
  );
};

export default LabelWithTooltip;
