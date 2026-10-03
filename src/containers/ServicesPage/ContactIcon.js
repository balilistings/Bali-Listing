import React from 'react';
import css from './ServicesPage.module.css';

const ContactIcon = ({ method }) => (
  <svg className={css.contactIcon} viewBox="0 0 24 24" width="20" height="20" aria-hidden="true" focusable="false" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
    {method === 'instagram' ? <><rect x="3" y="3" width="18" height="18" rx="5" /><circle cx="12" cy="12" r="4" /><circle cx="17.5" cy="6.5" r=".7" /></>
      : method === 'email' ? <><rect x="2" y="4" width="20" height="16" rx="3" /><path d="m3 6 9 7 9-7" /></>
      : method === 'whatsapp' ? <><path d="M20.5 11.5a8.5 8.5 0 0 1-12.7 7.4L3 20l1.2-4.6A8.5 8.5 0 1 1 20.5 11.5Z" /><path d="m8 7 1.5 3-1 1c1 2 2.5 3.5 4.5 4.5l1-1 3 1.5c-.5 2-2 2-3.5 1.3-4-1.8-6.5-4.3-7-7C6.2 8.5 7 7.5 8 7Z" /></>
      : method === 'phone' ? <path d="m7 3 3 5-2 2c1.5 3 3 4.5 6 6l2-2 5 3c-1 4-3 4-6 2.5C9 17 5 13 3.5 7 3 5 4 3 7 3Z" />
      : <><circle cx="12" cy="12" r="9" /><ellipse cx="12" cy="12" rx="4" ry="9" /><path d="M3 12h18M5 6h14M5 18h14" /></>}
  </svg>
);

export default ContactIcon;
