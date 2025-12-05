import React, { useState } from 'react';
import styles from './HelpWidget.module.css';

import HelpWidgetContent from './HelpWidgetContent';
import Faq from './Faq';
import Message from './Message';
import { IconClose } from '../../components';
import useChatSession from './useChatSession';

const OpenHelpWidget = ({ onClose }) => {
  const [currentView, setCurrentView] = useState('main');
  const session = useChatSession();

  const handleViewChange = view => {
    setCurrentView(view);
  };

  const handleBack = () => {
    setCurrentView('main');
  };

  const handleClose = () => (currentView === 'main' ? onClose() : setCurrentView('main'));

  const isFullscreen = currentView === 'faq' || currentView === 'message';

  const containerClass = [
    styles.openWidgetContainer,
    isFullscreen && styles.fullscreen,
    currentView === 'message' && styles.messageView,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div className={containerClass}>
      {currentView === 'main' && <div className={styles.overlay} onClick={handleClose}></div>}

      {currentView === 'faq' ? (
        <Faq className={styles.faqComponent} onBack={handleBack} />
      ) : currentView === 'message' ? (
        <Message
          className={styles.messageComponent}
          onBack={handleBack}
          onClose={handleClose}
          session={session}
        />
      ) : (
        <HelpWidgetContent onNavigate={handleViewChange} />
      )}
      <button className={styles.closeButton} onClick={handleClose}>
        <IconClose />
      </button>
    </div>
  );
};

export default OpenHelpWidget;
