import { contactMethod, isServicesPage, serviceBlocks, serviceHref, serviceWhatsapp, serviceWhatsappContact } from './services';

test('creates company WhatsApp links with the referral message and prefers explicit WhatsApp numbers', () => {
  const phone = serviceWhatsapp('tel:+62 858-8660-8888');
  expect(phone.number).toBe('6285886608888');
  expect(new URL(phone.href).searchParams.get('text')).toBe('I found your profile on balilistings.');
  expect(serviceWhatsapp('https://api.whatsapp.com/send?phone=6282382382382&text=Old').number).toBe('6282382382382');
  expect(serviceWhatsapp('tel:08123456789')).toBeNull();
  expect(serviceWhatsapp('https://wa.me.evil.example/628123456789')).toBeNull();
  const block = { text: { content: '[Call](tel:+6285886608888)\n\n[WhatsApp](https://wa.me/6282382382382)' } };
  expect(serviceWhatsappContact(block).number).toBe('6282382382382');
  expect(serviceWhatsappContact({})).toBeNull();
});

test('accepts public contact destinations but rejects executable and credential URLs', () => {
  expect(serviceHref('https://company.example/services')).toBe('https://company.example/services');
  expect(contactMethod('https://wa.me/628123456789')).toBe('whatsapp');
  expect(contactMethod('mailto:hello@company.example')).toBe('email');
  expect(contactMethod('tel:+628123456789')).toBe('phone');
  expect(contactMethod('https://www.instagram.com/clarityhomesbali/')).toBe('instagram');
  expect(contactMethod('https://instagram.com.evil.example/account')).toBe('website');
  [
    'javascript:alert(1)',
    'data:text/html,test',
    '//company.example',
    'https://user:secret@company.example',
    'tel:hello',
    'mailto:invalid',
  ].forEach(href => expect(serviceHref(href)).toBeNull());
});

test('flattens editor sections without exposing groups or duplicate/untitled companies', () => {
  const company = { blockId: 'one', title: { content: 'Company One' } };
  const second = { blockId: 'two', title: { content: 'Company Two' } };
  const data = {
    sections: [
      { sectionType: 'hero', blocks: [second] },
      { sectionType: 'columns', blocks: [company] },
      { sectionType: 'columns', blocks: [company, second, { blockId: 'empty' }] },
    ],
  };
  expect(serviceBlocks(data)).toEqual([company, second]);
  expect(serviceBlocks(undefined)).toEqual([]);
  expect(isServicesPage('services-id')).toBe(true);
  expect(isServicesPage('solution-hub')).toBe(true);
  expect(isServicesPage('other-page')).toBe(false);
});
