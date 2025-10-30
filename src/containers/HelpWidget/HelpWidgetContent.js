import React from 'react';
import styles from './HelpWidget.module.css';

import { ReactComponent as Logo } from '../../assets/balilistings-logo-icon.svg';
import { ReactComponent as Person1 } from '../../assets/help-widget/person-1.svg';
import { ReactComponent as Person2 } from '../../assets/help-widget/person-2.svg';
import { ReactComponent as Person3 } from '../../assets/help-widget/person-3.svg';
import { ReactComponent as MessageIcon } from '../../assets/help-widget/message.svg';

import { FormattedMessage } from 'react-intl';

const HelpWidgetContent = ({ onNavigate }) => {
  return (
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

      <h2 className={styles.hlTitle}>
        <FormattedMessage id="helpWidget.title" defaultMessage="How can we help ?" />
      </h2>

      {/* <div className={styles.hlOption} onClick={() => onNavigate('faq')}>
        <div>
          <strong>Frequently asked questions</strong>
          <div className={styles.hlOptionSub}>We are here to help.</div>
        </div>
        <FaqIcon className={styles.hlOptionIcon} />
      </div> */}

      <div className={styles.hlOption} onClick={() => onNavigate('message')}>
        <div>
          <strong>
            <FormattedMessage
              id="helpWidget.sendUsAMessage"
              defaultMessage="Send us a message"
            />
          </strong>
          <div className={styles.hlOptionSub}>
            <FormattedMessage
              id="helpWidget.weAreHereToHelp"
              defaultMessage="We are here to help."
            />
          </div>
        </div>
        <MessageIcon className={styles.hlOptionIcon} />
      </div>
    </div>
  );
};

export default HelpWidgetContent;
