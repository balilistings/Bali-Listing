import React from 'react';
import { render, fireEvent } from '@testing-library/react';
import { ServiceCard } from './ServicesPage';

jest.mock('../TopbarContainer/TopbarContainer', () => () => null);
jest.mock('../FooterContainer/FooterContainer', () => () => null);
jest.mock('../../components', () => ({ Page: ({ children }) => <div>{children}</div>, NamedLink: () => null, ResponsiveImage: () => <img alt="Company" /> }));

test('renders every public contact without nested links and tracks the selected method', () => {
  const track = jest.fn();
  const block = { blockId: 'company-one', title: { content: 'Company One' }, text: { content: 'Introduction.\n\n[Email](mailto:hello@company.example)\n\n[Call](tel:+628123456789)\n\n[Unsafe](javascript:alert)' }, callToAction: { href: 'https://wa.me/628123456789', content: 'WhatsApp' } };
  const { container, getByText } = render(<ServiceCard {...{ block, track }} index={0} labels={{ details: 'Services & contact details', contact: 'Contact' }} />);
  expect(container.querySelector('a a')).toBeNull();
  expect(container.querySelector('a[href="tel:+628123456789"]')).not.toBeNull();
  expect(container.querySelector('a[href^="javascript:"]')).toBeNull();
  fireEvent.click(getByText('WhatsApp ↗'));
  expect(track).toHaveBeenCalledWith('click_service_contact', { service_id: 'company-one', contact_method: 'whatsapp' });
  expect(container.querySelector('article').id).toBe('company-company-one');
});
