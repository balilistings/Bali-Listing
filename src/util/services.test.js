import { contactMethod, isServicesPage, serviceBlocks, serviceHref } from './services';

test('accepts public contact destinations but rejects executable and credential URLs', () => {
  expect(serviceHref('https://company.example/services')).toBe('https://company.example/services');
  expect(contactMethod('https://wa.me/628123456789')).toBe('whatsapp');
  expect(contactMethod('mailto:hello@company.example')).toBe('email');
  expect(contactMethod('tel:+628123456789')).toBe('phone');
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
