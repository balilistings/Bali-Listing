import React, { useEffect } from 'react';
import { useSelector } from 'react-redux';
import Cookies from 'js-cookie';
import { useLocation } from 'react-router-dom';
import { useIntl } from '../../util/reactIntl';
import { useConfiguration } from '../../context/configurationContext';
import { Page, NamedLink, ResponsiveImage } from '../../components';
import TopbarContainer from '../TopbarContainer/TopbarContainer';
import FooterContainer from '../FooterContainer/FooterContainer';
import LayoutSingleColumn from '../../components/LayoutComposer/LayoutSingleColumn/LayoutSingleColumn';
import renderMarkdown from '../PageBuilder/markdownProcessor';
import markdownSchema from 'hast-util-sanitize/lib/github.json';
import { contactMethod, serviceBlocks, serviceHref } from '../../util/services';
import css from './ServicesPage.module.css';
import eagleProtectLogo from '../../components/IconSolution/solution-eagle.svg';
import clarityHomesLogo from '../../assets/clarity-homes-bali-logo.svg';

const partnerLogos = { 'eagle-protect': eagleProtectLogo, 'clarity-homes-bali': clarityHomesLogo };

const contactSchema = { ...markdownSchema, protocols: { ...markdownSchema.protocols, href: [...markdownSchema.protocols.href, 'tel'] } };

export const ServiceCard = ({ block, index, track, labels }) => {
  const title = block.title.content;
  const paragraphs = (block.text?.content || '').trim().split(/\n\s*\n/);
  const intro = paragraphs[0] || '';
  const details = paragraphs.slice(1).join('\n\n');
  const primary = serviceHref(block.callToAction?.href);
  const image = block.media?.image;
  const variants = Object.keys(image?.attributes?.variants || {});
  // Uploaded company images take precedence over bundled partner logos.
  const legacyLogo = partnerLogos[block.blockId];
  const id = `company-${block.blockId}`;
  const ContactLink = ({ href, children }) => {
    const safe = serviceHref(href);
    if (!safe) return <span>{children}</span>;
    const external = /^https?:/.test(safe);
    return <a href={safe} target={external ? '_blank' : undefined} rel={external ? 'noopener noreferrer' : undefined}
      onClick={() => track('click_service_contact', { service_id: block.blockId, contact_method: contactMethod(safe) })}>{children}</a>;
  };
  const markdownComponents = { a: ContactLink, h1: 'h3', h2: 'h3', img: () => null };
  return (
    <article id={id} className={css.card} aria-labelledby={`${id}-title`}>
      <div className={css.media}>
        {variants.length ? <ResponsiveImage image={image} variants={variants} alt={block.media.alt || title}
          sizes="(max-width: 650px) 100vw, (max-width: 1000px) 50vw, 400px" loading={index < 3 ? 'eager' : 'lazy'} />
          : legacyLogo ? <img src={legacyLogo} alt={`${title} logo`} width="160" height="125" />
          : <span className={css.fallbackImage}>{title}</span>}
      </div>
      <div className={css.cardContent}>
        <h2 id={`${id}-title`}>{title}</h2>
        <div className={css.description}>{renderMarkdown(intro, markdownComponents, contactSchema)}</div>
        {primary ? <a className={css.primaryButton} href={primary}
          target={/^https?:/.test(primary) ? '_blank' : undefined}
          rel={/^https?:/.test(primary) ? 'noopener noreferrer' : undefined}
          onClick={() => track('click_service_contact', { service_id: block.blockId, contact_method: contactMethod(primary) })}>
          {block.callToAction.content || labels.contact} ↗</a> : null}
        {details ? <details className={css.details}><summary>{labels.details}</summary>
          <div>{renderMarkdown(details, markdownComponents, contactSchema)}</div></details> : null}
      </div>
    </article>
  );
};

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
      <a className={css.secondaryButton} href="#submit-company">{msg('addCompany')} ↗</a>
    </div>
  </article>
);

const ServicesPage = ({ pageAssetsData, params }) => {
  const intl = useIntl();
  const config = useConfiguration();
  const location = useLocation();
  const currentUser = useSelector(state => state.user.currentUser);
  const pageData = pageAssetsData?.[params.pageId]?.data;
  const blocks = serviceBlocks(pageData);
  const placeholderCount = Math.max(0, 6 - blocks.length);
  const msg = key => intl.formatMessage({ id: `Services.${key}` });
  const track = (event, properties = {}) => {
    const profileConsent = currentUser?.attributes?.profile?.protectedData?.cookieConsent?.accepted;
    const allowed = !config.cookieConsent?.enabled || (typeof profileConsent === 'boolean' ? profileConsent : Cookies.get('cookieConsent') === 'accepted');
    if (allowed && typeof window !== 'undefined' && window.gtag) window.gtag('event', event, properties);
  };
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
