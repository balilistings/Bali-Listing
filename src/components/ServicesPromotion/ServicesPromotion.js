import React from 'react';
import { useSelector } from 'react-redux';
import { FormattedMessage, useIntl } from '../../util/reactIntl';
import { NamedLink } from '../../components';
import ServiceCard from '../ServiceCard/ServiceCard';
import { serviceBlocks } from '../../util/services';
import useServiceTracking from '../../util/useServiceTracking';
import css from './ServicesPromotion.module.css';

const ServicesPromotion = () => {
  const pageData = useSelector(state => state.LandingPage?.servicesPageData);
  const blocks = serviceBlocks(pageData).slice(0, 3);
  const intl = useIntl();
  const track = useServiceTracking();
  const labels = {
    contact: intl.formatMessage({ id: 'Services.contact' }),
    details: intl.formatMessage({ id: 'Services.details' }),
  };
  return <section id="services-promotion" className={css.root} aria-labelledby="services-promotion-title">
    <div className={css.inner}>
      <header className={css.header}>
        <h2 id="services-promotion-title"><FormattedMessage id="Services.nav" /></h2>
        <p><FormattedMessage id="Services.promotionDescription" /></p>
      </header>
      {blocks.length ? <div className={css.grid}>
        {blocks.map((block, index) => <ServiceCard key={block.blockId} {...{ block, index, track, labels }} />)}
      </div> : null}
      <div className={css.actions}>
        <NamedLink name="CMSPage" params={{ pageId: 'services' }} className={css.button}><FormattedMessage id="Services.explore" /> →</NamedLink>
      </div>
    </div>
  </section>;
};
export default ServicesPromotion;
