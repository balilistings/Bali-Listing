import React from 'react';
import { FormattedMessage } from '../../util/reactIntl';
import { NamedLink } from '../../components';
import css from './ServicesPromotion.module.css';

const ServicesPromotion = () => <section className={css.root} aria-labelledby="services-promotion-title">
  <div className={css.inner}><div><h2 id="services-promotion-title"><FormattedMessage id="Services.promotionTitle" /></h2>
    <p><FormattedMessage id="Services.promotionDescription" /></p></div>
    <NamedLink name="CMSPage" params={{ pageId: 'services' }} className={css.button}><FormattedMessage id="Services.explore" /> →</NamedLink>
  </div>
</section>;
export default ServicesPromotion;
