import React, { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useIntl } from '../../util/reactIntl';
import { useConfiguration } from '../../context/configurationContext';
import { Page, NamedLink } from '../../components';
import TopbarContainer from '../TopbarContainer/TopbarContainer';
import FooterContainer from '../FooterContainer/FooterContainer';
import LayoutSingleColumn from '../../components/LayoutComposer/LayoutSingleColumn/LayoutSingleColumn';
import { serviceBlocks } from '../../util/services';
import ServiceCard from '../../components/ServiceCard/ServiceCard';
import useServiceTracking from '../../util/useServiceTracking';
export { ServiceCard };
import css from './ServicesPage.module.css';

const ServicePlaceholder = ({ msg }) => (
  <article className={`${css.card} ${css.placeholder}`}>
    <div className={`${css.media} ${css.placeholderMedia}`} aria-hidden="true">
      <svg viewBox="0 0 64 64" width="64" height="64" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M14 56V16h36v40M8 56h48M24 56V42h16v14M24 26h4m8 0h4m-16 8h4m8 0h4" />
      </svg>
    </div>
    <div className={css.cardContent}>
      <p className={css.placeholderLabel}>{msg('placeholderLabel')}</p>
      <h2>{msg('placeholderTitle')}</h2>
      <p className={css.description}>{msg('placeholderDescription')}</p>
    </div>
    <div className={css.cardFooter}>
      <a className={css.secondaryButton} href="#submit-company">{msg('addCompany')} ↗</a>
    </div>
  </article>
);

const ServicesPage = ({ pageAssetsData, params }) => {
  const intl = useIntl();
  const config = useConfiguration();
  const location = useLocation();
  const pageData = pageAssetsData?.[params.pageId]?.data;
  const blocks = serviceBlocks(pageData);
  const placeholderCount = Math.max(0, 6 - blocks.length);
  const msg = key => intl.formatMessage({ id: `Services.${key}` });
  const track = useServiceTracking();
  useEffect(() => {
    const hash = location.hash.slice(1);
    if (!hash.startsWith('company-') && hash !== 'submit-company') return;
    const element = document.getElementById(hash);
    if (element) {
      const details = element.querySelector('details');
      if (details) details.open = true;
      element.scrollIntoView();
    }
  }, [location.hash, pageData]);
  const email = 'mailto:info@balilistings.com?subject=Services%20directory%20submission';
  const whatsapp = 'https://wa.me/628812125050?text=Hi%20Bali%20Listings%2C%20I%20would%20like%20to%20submit%20my%20company%20for%20the%20services%20directory.';
  return <Page title={msg('metaTitle')} description={msg('metaDescription')} config={config} className={css.root}>
    <LayoutSingleColumn topbar={<TopbarContainer currentPage="CMSPage:services" />} footer={<FooterContainer />}>
      <section className={css.hero}><div className={css.wrap}>
        <div className={css.breadcrumb}><NamedLink name="LandingPage">{msg('home')}</NamedLink> / {msg('nav')}</div>
        <div className={css.heroRow}><div><p className={css.eyebrow}>{msg('eyebrow')}</p><h1>{msg('title')}</h1><p>{msg('intro')}</p></div>
          <a className={css.primaryButton} href="#submit-company">{msg('addCompany')} ↗</a></div>
      </div></section>
      <div className={css.wrap}>
        <div className={css.grid}>
          {blocks.map((block, index) => <ServiceCard key={block.blockId} {...{ block, index, track }} labels={{ contact: msg('contact'), details: msg('details') }} />)}
          {Array.from({ length: placeholderCount }, (_, index) => <ServicePlaceholder key={`placeholder-${index}`} msg={msg} />)}
        </div>
        <section id="submit-company" className={css.submission}>
          <h2>{msg('submitTitle')}</h2><p>{msg('submitIntro')}</p>
          <ul className={css.requirements}><li>{msg('submitName')}</li><li>{msg('submitImage')}</li><li>{msg('submitDescription')}</li><li>{msg('submitContacts')}</li></ul>
          <p>{msg('submitReview')}</p><div className={css.actions}>
            <a className={css.primaryButton} href={email} onClick={() => track('click_service_submission', { contact_method: 'email' })}>{msg('submitEmail')} ↗</a>
            <a className={css.secondaryButton} href={whatsapp} target="_blank" rel="noopener noreferrer" onClick={() => track('click_service_submission', { contact_method: 'whatsapp' })}>{msg('submitWhatsapp')} ↗</a>
          </div>
        </section><p className={css.disclaimer}>{msg('disclaimer')}</p>
      </div>
    </LayoutSingleColumn>
  </Page>;
};
export default ServicesPage;
