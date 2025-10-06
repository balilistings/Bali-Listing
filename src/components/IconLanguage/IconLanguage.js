
import React from 'react';
import classNames from 'classnames';

import css from './IconLanguage.module.css';

const IconLanguage = props => {
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
        d="M15.75 7.5H10.875L9.9375 5.25C9.82125 4.9575 9.42375 4.9575 9.3075 5.25L8.37 7.5H3.5625C3.315 7.5 3.1875 7.815 3.3525 7.98L7.29 10.5525L6.3525 12.795C6.23625 13.0875 6.525 13.3575 6.7725 13.185L9.6 11.205L12.465 13.185C12.7125 13.3575 13.0013 13.0875 12.885 12.795L11.9475 10.5525L15.885 7.98C16.05 7.815 15.9225 7.5 15.75 7.5Z"
        stroke="#231F20"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
};

export default IconLanguage;
