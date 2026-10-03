export const SERVICES_PAGE_ID = 'services';
export const isServicesPage = pageId => /^(services|solution-hub)(-(id|ru))?$/.test(pageId || '');

export const serviceHref = href => {
  if (typeof href !== 'string') return null;
  const value = href.trim();
  try {
    const url = new URL(value);
    if (['https:', 'http:'].includes(url.protocol) && !url.username && !url.password) return value;
    if (url.protocol === 'mailto:' && url.pathname.includes('@')) return value;
    if (url.protocol === 'tel:' && /^\+?[\d ()-]+$/.test(url.pathname)) return value;
  } catch (e) {
    /* Invalid destinations are omitted rather than made clickable. */
  }
  return null;
};

export const contactMethod = href => {
  const safe = serviceHref(href);
  if (!safe) return null;
  const url = new URL(safe);
  if (url.protocol === 'mailto:') return 'email';
  if (url.protocol === 'tel:') return 'phone';
  if (['instagram.com', 'www.instagram.com'].includes(url.hostname)) return 'instagram';
  return ['wa.me', 'api.whatsapp.com', 'www.whatsapp.com'].includes(url.hostname)
    ? 'whatsapp'
    : 'website';
};

export const serviceWhatsapp = href => {
  const safe = serviceHref(href);
  if (!safe) return null;
  const url = new URL(safe);
  const method = contactMethod(safe);
  const number = method === 'phone' ? url.pathname.replace(/[+ ()-]/g, '')
    : method === 'whatsapp' ? (url.hostname === 'wa.me' ? url.pathname.slice(1) : url.searchParams.get('phone')) : null;
  if (!/^[1-9]\d{6,14}$/.test(number || '')) return null;
  return { number, href: `https://wa.me/${number}?text=${encodeURIComponent('I found your profile on balilistings.')}` };
};

export const serviceWhatsappContact = block => {
  const links = [block.callToAction?.href, ...Array.from((block.text?.content || '').matchAll(/\]\(([^\s)]+)\)/g), match => match[1])].filter(Boolean);
  // Prefer the company's explicit WhatsApp destination when its call number differs.
  return links.filter(href => contactMethod(href) === 'whatsapp').map(serviceWhatsapp).find(Boolean)
    || links.filter(href => contactMethod(href) === 'phone').map(serviceWhatsapp).find(Boolean) || null;
};

export const serviceBlocks = pageData => {
  const seen = new Set();
  return (pageData?.sections || [])
    .filter(section => section.sectionType === 'columns')
    .flatMap(section => section.blocks || [])
    .filter(block => {
      const valid = block.blockId && block.title?.content?.trim() && !seen.has(block.blockId);
      if (valid) seen.add(block.blockId);
      return valid;
    });
};
