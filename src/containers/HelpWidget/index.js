import React, { useState } from 'react';
import styles from './HelpWidget.module.css';

import { ReactComponent as HelpIcon } from '../../assets/help-widget/help-icon.svg';
import OpenHelpWidget from './OpenHelpWidget';
import { useLocation } from 'react-router-dom';

const HelpWidget = () => {
  const location = useLocation();

  const isAuthPage =
    location.pathname === '/login' ||
    location.pathname === '/signup' ||
    location.pathname.startsWith('/signup/');

  const [isOpen, setIsOpen] = useState(false);

  const handleCloseWidget = () => {
    setIsOpen(false);
  };

  if (isAuthPage) {
    return null;
  }

  if (!isOpen) {
    return (
      <div className={styles.defaultWidget} onClick={() => setIsOpen(true)}>
        <HelpIcon className={styles.defaultWidgetIcon} />
        <span className={styles.defaultWidgetText}>Need help?</span>
      </div>
    );
  }

  return <OpenHelpWidget onClose={handleCloseWidget} />;
};

export default HelpWidget;
