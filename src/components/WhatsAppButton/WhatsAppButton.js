import React from 'react';
import css from './WhatsAppButton.module.css';
import waIcon from '../../assets/WA.button.png';

const WhatsAppButton = () => {
  const url = 'https://wa.me/6281234567890?text=Hi%20%20I%20am%20interested%20in%20your%20services';

  return (
    <a href={url} target="_blank" rel="noopener noreferrer" className={css.whatsappButton}>
      <img src={waIcon} alt="Chat via WhatsApp" className={css.whatsappIcon} />
    </a>
  );
};

export default WhatsAppButton;
