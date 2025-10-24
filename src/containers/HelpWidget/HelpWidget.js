import React, { useState } from 'react';
import styles from './HelpWidget.module.css';

import { ReactComponent as Logo } from '../../assets/balilistings-logo-icon.svg';
import { ReactComponent as Person1 } from '../../assets/help-widget/person-1.svg';
import { ReactComponent as Person2 } from '../../assets/help-widget/person-2.svg';
import { ReactComponent as Person3 } from '../../assets/help-widget/person-3.svg';
import { ReactComponent as FaqIcon } from '../../assets/help-widget/faq-icon.svg';
import { ReactComponent as MessageIcon } from '../../assets/help-widget/message.svg';
import { ReactComponent as HelpIcon } from '../../assets/help-widget/help-icon.svg';

import Faq from './Faq';
import Message from './Message';
import { IconClose } from '../../components';

const HelpWidget = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [currentView, setCurrentView] = useState('main');

  const handleCloseWidget = () => {
    setIsOpen(false);
    setCurrentView('main');
  };

  const handleClose = () => (currentView === 'main' ? handleCloseWidget() : setCurrentView('main'));

  const handleBack = () => {
    setCurrentView('main');
  };

  if (!isOpen) {
    return (
      <div className={styles.defaultWidget} onClick={() => setIsOpen(true)}>
        <HelpIcon className={styles.defaultWidgetIcon} />
        <span className={styles.defaultWidgetText}>Need help?</span>
      </div>
    );
  }

  return (
    <div className={styles.openWidgetContainer}>
      {currentView === 'faq' ? (
        <Faq onBack={handleBack} />
      ) : currentView === 'message' ? (
        <Message onBack={handleBack} />
      ) : (
        <div className={styles.hlWidget}>
          <div className={styles.hlLogo}>
            <Logo />
            <div className={styles.hlLogoText}>Bali Listings</div>
          </div>

          <div className={styles.hlAvatars}>
            <Person1 className={styles.hlAvatar} />
            <Person2 className={styles.hlAvatar} />
            <Person3 className={styles.hlAvatar} />
          </div>

          <h2 className={styles.hlTitle}>How can we help ?</h2>

          <div className={styles.hlOption} onClick={() => setCurrentView('faq')}>
            <div style={{ textAlign: 'left' }}>
              <strong>Frequently asked questions</strong>
              <div className={styles.hlOptionSub}>We are here to help.</div>
            </div>
            <FaqIcon className={styles.hlOptionIcon} />
          </div>

          <div className={styles.hlOption} onClick={() => setCurrentView('message')}>
            <div style={{ textAlign: 'left' }}>
              <strong>Send us a message</strong>
              <div className={styles.hlOptionSub}>We are here to help.</div>
            </div>
            <MessageIcon className={styles.hlOptionIcon} />
          </div>
        </div>
      )}
      <button className={styles.closeButton} onClick={handleClose}>
        <IconClose />
      </button>
    </div>
  );
};

export default HelpWidget;
