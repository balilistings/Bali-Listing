import React, { useState } from 'react';
import classNames from 'classnames';
import styles from './HelpWidget.module.css';

import { ReactComponent as HelpIcon } from '../../assets/help-widget/help-icon.svg';
import OpenHelpWidget from './OpenHelpWidget';
import { useLocation } from 'react-router-dom';

const HelpWidget = () => {
  const location = useLocation();

  const isAuthPage =
    new URLSearchParams(location.search).get('mobilemenu') === 'open' ||
    location.pathname.startsWith('/l/draft') ||
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

  const onListingPage = location.pathname.startsWith('/l');

  if (!isOpen) {
    return (
      <div
        className={classNames(styles.defaultWidget, { [styles.onListingPage]: onListingPage })}
        onClick={() => setIsOpen(true)}
      >
        <HelpIcon className={styles.defaultWidgetIcon} />
        <span className={styles.defaultWidgetText}>Need help?</span>
      </div>
    );
  }

  return <OpenHelpWidget onClose={handleCloseWidget} />;
};

export default HelpWidget;
