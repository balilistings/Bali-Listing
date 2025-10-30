import React, { useState } from 'react';
import styles from './HelpWidget.module.css';

import { ReactComponent as HelpIcon } from '../../assets/help-widget/help-icon.svg';
import OpenHelpWidget from './OpenHelpWidget';

const HelpWidget = () => {
  const [isOpen, setIsOpen] = useState(false);

  const handleCloseWidget = () => {
    setIsOpen(false);
  };

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
