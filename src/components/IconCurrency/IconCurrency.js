
import React from 'react';
import { string } from 'prop-types';
import classNames from 'classnames';

import css from './IconCurrency.module.css';

const IconCurrency = props => {
  const { className, rootClassName } = props;
  const classes = classNames(rootClassName || css.root, className);
  return (
    <svg
      className={classes}
      width="18"
      height="18"
      viewBox="0 0 18 18"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M12.375 10.125C12.375 10.9162 12.0722 11.6766 11.5366 12.2121C11.001 12.7477 10.2407 13.0505 9.44953 13.0505C8.65833 13.0505 7.89802 12.7477 7.36246 12.2121C6.8269 11.6766 6.52405 10.9162 6.52405 10.125M15 5.25H3V10.125M15 15H3V10.125M15 10.125H3M6.75 3V5.25M11.25 3V5.25M6.75 15V17.25M11.25 15V17.25"
        stroke="#231F20"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
};

export default IconCurrency;
