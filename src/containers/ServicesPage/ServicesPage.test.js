import React from 'react';
import { render, fireEvent } from '@testing-library/react';
import Cookies from 'js-cookie';
import ServicesPage, { ServiceCard } from './ServicesPage';

jest.mock('../TopbarContainer/TopbarContainer', () => () => null);
jest.mock('../FooterContainer/FooterContainer', () => () => null);
jest.mock('../../components', () => ({ Page: ({ children }) => <div>{children}</div>, NamedLink: () => null, ResponsiveImage: () => <img alt="Company" /> }));
jest.mock('react-redux', () => ({ useSelector: selector => selector({ user: { currentUser: null } }) }));
jest.mock('react-router-dom', () => ({ useLocation: () => ({ hash: '' }) }));
jest.mock('../../context/configurationContext', () => ({ useConfiguration: () => ({ cookieConsent: { enabled: true } }) }));
jest.mock('../../util/reactIntl', () => ({ useIntl: () => ({ formatMessage: ({ id }) => id }) }));
jest.mock('../../components/LayoutComposer/LayoutSingleColumn/LayoutSingleColumn', () => ({ children }) => <div>{children}</div>);

test('sends company events to GA only after analytics consent, including consent granted after rendering', () => {
  window.gtag = jest.fn();
  Cookies.set('cookieConsent', 'rejected');
  const block = { blockId: 'clarity-homes-bali', title: { content: 'Clarity Homes Bali' }, text: { content: 'Intro.\n\n[Phone](tel:+6282382382382)' }, callToAction: { href: 'https://clarityhomesbali.com/', content: 'Visit website' } };
  const pageAssetsData = { services: { data: { sections: [{ sectionType: 'columns', blocks: [block] }] } } };
  const { getByRole, getByText } = render(<ServicesPage pageAssetsData={pageAssetsData} params={{ pageId: 'services' }} />);
  fireEvent.click(getByText('Visit website ↗'));
  expect(window.gtag).not.toHaveBeenCalled();
  Cookies.set('cookieConsent', 'accepted');
  fireEvent.click(getByRole('button', { name: 'Clarity Homes Bali', exact: true }));
  expect(window.gtag).toHaveBeenLastCalledWith('event', 'click_service_profile', { service_id: 'clarity-homes-bali', service_name: 'Clarity Homes Bali' });
  fireEvent.click(getByText('WhatsApp: +6282382382382 ↗'));
  expect(window.gtag).toHaveBeenLastCalledWith('event', 'click_service_contact', { service_id: 'clarity-homes-bali', service_name: 'Clarity Homes Bali', contact_method: 'whatsapp' });
  Cookies.remove('cookieConsent');
  delete window.gtag;
});

test('renders every public contact without nested links and tracks the selected method', () => {
  const track = jest.fn();
  const block = { blockId: 'company-one', title: { content: 'Company One' }, text: { content: 'Introduction.\n\n[Email](mailto:hello@company.example)\n\n[Call](tel:+628123456789)\n\n[Unsafe](javascript:alert)' }, callToAction: { href: 'https://wa.me/628123456789', content: 'WhatsApp' } };
  const { container, getByText } = render(<ServiceCard {...{ block, track }} index={0} labels={{ details: 'Services & contact details', contact: 'Contact' }} />);
  expect(container.querySelector('a a')).toBeNull();
  expect(container.querySelector('a[href="tel:+628123456789"]')).not.toBeNull();
  expect(container.querySelector('a[href^="javascript:"]')).toBeNull();
  fireEvent.click(getByText('WhatsApp ↗'));
  expect(track).toHaveBeenCalledWith('click_service_contact', { service_id: 'company-one', service_name: 'Company One', contact_method: 'whatsapp' });
  const whatsapp = new URL(getByText('WhatsApp ↗').href);
  expect(whatsapp.searchParams.get('text')).toBe('I found your profile on balilistings.');
  expect(container.querySelector('article').id).toBe('company-company-one');
});

test('opens the company profile and separates website and WhatsApp clicks without counting profile closes', () => {
  const track = jest.fn();
  const block = { blockId: 'eagle-protect', title: { content: 'Eagle Protect' }, text: { content: 'Introduction.\n\n[Phone](tel:+6285886608888)' }, callToAction: { href: 'https://eagleprotect.id/', content: 'Visit website' } };
  const { container, getByRole, getByText } = render(<ServiceCard {...{ block, track }} index={0} labels={{ details: 'Services & contact details', contact: 'Contact' }} />);
  fireEvent.click(getByRole('button', { name: 'Eagle Protect', exact: true }));
  expect(container.querySelector('details').open).toBe(true);
  expect(track).toHaveBeenLastCalledWith('click_service_profile', { service_id: 'eagle-protect', service_name: 'Eagle Protect' });
  track.mockClear();
  fireEvent.click(getByText('Services & contact details'));
  expect(track).not.toHaveBeenCalled();
  fireEvent.click(getByText('Visit website ↗'));
  expect(track).toHaveBeenLastCalledWith('click_service_contact', { service_id: 'eagle-protect', service_name: 'Eagle Protect', contact_method: 'website' });
  fireEvent.click(getByText('WhatsApp: +6285886608888 ↗'));
  expect(track).toHaveBeenLastCalledWith('click_service_contact', { service_id: 'eagle-protect', service_name: 'Eagle Protect', contact_method: 'whatsapp' });
});

test('renders accessible Instagram contacts and attributes clicks to their company', () => {
  const track = jest.fn();
  const block = { blockId: 'new-company', title: { content: 'New Company' }, text: { content: 'Introduction.\n\n[Instagram: @company](https://www.instagram.com/company/)' } };
  const { getByRole } = render(<ServiceCard {...{ block, track }} index={0} labels={{ details: 'Services & contact details', contact: 'Contact' }} />);
  fireEvent.click(getByRole('button', { name: 'New Company', exact: true }));
  const link = getByRole('link', { name: 'Instagram: @company' });
  expect(link.getAttribute('href')).toBe('https://www.instagram.com/company/');
  expect(link.querySelector('svg').getAttribute('aria-hidden')).toBe('true');
  expect(link.getAttribute('rel')).toBe('noopener noreferrer');
  fireEvent.click(link);
  expect(track).toHaveBeenLastCalledWith('click_service_contact', { service_id: 'new-company', service_name: 'New Company', contact_method: 'instagram' });
});
