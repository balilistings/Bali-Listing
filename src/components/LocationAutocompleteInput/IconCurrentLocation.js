import React from 'react';

import css from './LocationAutocompleteInput.module.css';

const IconCurrentLocation = () => (
  <svg   className={css.currentLocationIcon} width="34" height="34" viewBox="0 0 34 34" fill="none" xmlns="http://www.w3.org/2000/svg">
  <rect width="34" height="34" rx="5" fill="#FBA6F9" fill-opacity="0.2"/>
  <g clip-path="url(#clip0_2433_2189)">
  <path d="M17 5C10.3676 5 5 10.367 5 17C5 23.6324 10.367 29 17 29C23.6324 29 29 23.633 29 17C29 10.3676 23.633 5 17 5ZM17 27.4C11.2655 27.4 6.59998 22.7346 6.59998 17C6.59998 11.2654 11.2655 6.59998 17 6.59998C22.7345 6.59998 27.4 11.2655 27.4 17C27.4 22.7345 22.7345 27.4 17 27.4Z" fill="#F74DF4"/>
  <path d="M19.7715 17L21.8592 12.7831C22.1898 12.1154 21.5032 11.3962 20.8209 11.6956L10.3995 16.2674C9.76203 16.547 9.76329 17.4535 10.3995 17.7326L20.8209 22.3045C21.5046 22.6045 22.1888 21.8826 21.8592 21.2169L19.7715 17ZM18.1618 17.3549L19.4494 19.9556L12.7122 17L19.4494 14.0444L18.1618 16.6451C18.0511 16.8687 18.0511 17.1312 18.1618 17.3549Z" fill="#F74DF4"/>
  </g>
  <defs>
  <clipPath id="clip0_2433_2189">
  <rect width="24" height="24" fill="white" transform="translate(5 5)"/>
  </clipPath>
  </defs>
  </svg>
  
);

export default IconCurrentLocation;
