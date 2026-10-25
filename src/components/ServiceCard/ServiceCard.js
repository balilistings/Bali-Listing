import React, { useRef } from 'react';
import { ResponsiveImage } from '../../components';
import renderMarkdown from '../../containers/PageBuilder/markdownProcessor';
import markdownSchema from 'hast-util-sanitize/lib/github.json';
import { contactMethod, serviceHref, serviceWhatsapp, serviceWhatsappContact } from '../../util/services';
import css from '../../containers/ServicesPage/ServicesPage.module.css';
import eagleProtectLogo from '../IconSolution/solution-eagle.svg';
import clarityHomesLogo from '../../assets/clarity-homes-bali-logo.svg';
import ContactIcon from '../../containers/ServicesPage/ContactIcon';

const partnerLogos = { 'eagle-protect': eagleProtectLogo, 'clarity-homes-bali': clarityHomesLogo };

const contactSchema = { ...markdownSchema, protocols: { ...markdownSchema.protocols, href: [...markdownSchema.protocols.href, 'tel'] } };

const ServiceCard = ({ block, index, track, labels }) => {
  const title = block.title.content;
  const paragraphs = (block.text?.content || '').trim().split(/\n\s*\n/);
  const intro = paragraphs[0] || '';
  const socialMethods = ['whatsapp', 'instagram'];
  const instagram = Array.from((block.text?.content || '').matchAll(/\]\(([^\s)]+)\)/g), match => match[1])
    .find(href => contactMethod(href) === 'instagram');
  // Standalone social links are shown once as accessible icon buttons below the website.
  const details = paragraphs.slice(1).filter(paragraph => {
    const link = paragraph.trim().match(/^\[([^\]]+)\]\(([^\s)]+)\)$/);
    return !link || !socialMethods.includes(contactMethod(link[2]));
  }).join('\n\n');
  const primaryHref = serviceHref(block.callToAction?.href);
  const primary = contactMethod(primaryHref) === 'whatsapp' ? serviceWhatsapp(primaryHref)?.href || primaryHref : primaryHref;
  const whatsapp = serviceWhatsappContact(block);
  const detailsRef = useRef(null);
  const trackContact = href => track('click_service_contact', {
    service_id: block.blockId, service_name: title, contact_method: contactMethod(href),
  });
  const trackProfile = () => track('click_service_profile', { service_id: block.blockId, service_name: title });
  const openProfile = () => {
    trackProfile();
    if (detailsRef.current) {
      detailsRef.current.open = true;
      detailsRef.current.querySelector('summary').focus();
    }
  };
  const image = block.media?.image;
  const variants = Object.keys(image?.attributes?.variants || {});
  // Uploaded company images take precedence over bundled partner logos.
  const legacyLogo = partnerLogos[block.blockId];
  const id = `company-${block.blockId}`;
  const ContactLink = ({ href, children }) => {
    const safe = contactMethod(href) === 'whatsapp' ? serviceWhatsapp(href)?.href || serviceHref(href) : serviceHref(href);
    if (!safe) return <span>{children}</span>;
    const external = /^https?:/.test(safe);
    return <a className={css.contactLink} href={safe} target={external ? '_blank' : undefined} rel={external ? 'noopener noreferrer' : undefined}
      onClick={() => trackContact(safe)}><ContactIcon method={contactMethod(safe)} /><span>{children}</span><span className={css.contactArrow} aria-hidden="true">↗</span></a>;
  };
  const markdownComponents = { a: ContactLink, h1: 'h3', h2: 'h3', img: () => null };
  return (
    <article id={id} className={css.card} aria-labelledby={`${id}-title`}>
      <button type="button" className={`${css.media} ${css.profileMedia}`} aria-label={`${labels.details}: ${title}`} onClick={openProfile}>
        {variants.length ? <ResponsiveImage image={image} variants={variants} alt={block.media.alt || title}
          sizes="(max-width: 650px) 100vw, (max-width: 1000px) 50vw, 400px" loading={index < 3 ? 'eager' : 'lazy'} />
          : legacyLogo ? <img src={legacyLogo} alt={`${title} logo`} width="160" height="125" />
          : <span className={css.fallbackImage}>{title}</span>}
      </button>
      <div className={css.cardContent}>
        <h2 id={`${id}-title`}><button type="button" className={css.profileTitle} onClick={openProfile}>{title}</button></h2>
        <div className={css.description}>{renderMarkdown(intro, markdownComponents, contactSchema)}</div>
      </div>
      <div className={css.cardFooter}>
        {primary && !socialMethods.includes(contactMethod(primary)) ? <a className={css.primaryButton} href={primary}
          target={/^https?:/.test(primary) ? '_blank' : undefined}
          rel={/^https?:/.test(primary) ? 'noopener noreferrer' : undefined}
          onClick={() => trackContact(primary)}>
          <ContactIcon method={contactMethod(primary)} />{block.callToAction.content || labels.contact} ↗</a> : null}
        {whatsapp || instagram || contactMethod(primary) === 'instagram' ? <div className={css.socialLinks}>
          {whatsapp ? <a className={`${css.socialButton} ${css.whatsappIcon}`} href={whatsapp.href}
            aria-label={`WhatsApp: ${title}`} title={`WhatsApp: +${whatsapp.number}`}
            target="_blank" rel="noopener noreferrer" onClick={() => trackContact(whatsapp.href)}><ContactIcon method="whatsapp" /></a> : null}
          {instagram || contactMethod(primary) === 'instagram' ? <a className={`${css.socialButton} ${css.instagramIcon}`} href={instagram || primary}
            aria-label={`Instagram: ${title}`} title={`Instagram: ${title}`}
            target="_blank" rel="noopener noreferrer" onClick={() => trackContact(instagram || primary)}><ContactIcon method="instagram" /></a> : null}
        </div> : null}
        {details ? <details ref={detailsRef} className={css.details}><summary onClick={() => { if (!detailsRef.current.open) trackProfile(); }}>{labels.details}</summary>
          <div>{renderMarkdown(details, markdownComponents, contactSchema)}</div></details> : null}
      </div>
    </article>
  );
};


export default ServiceCard;
