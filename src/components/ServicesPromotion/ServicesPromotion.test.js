import React from 'react';
import { render, fireEvent } from '@testing-library/react';
import Cookies from 'js-cookie';
import ServicesPromotion from './ServicesPromotion';
import { useSelector } from 'react-redux';

jest.mock('react-redux', () => ({ useSelector: jest.fn() }));
jest.mock('../../components', () => ({
  NamedLink: ({ params, children, ...props }) => <a href={'/p/' + params.pageId}>{children}</a>,
  ResponsiveImage: () => <img alt="Company" />,
}));
jest.mock('../../context/configurationContext', () => ({ useConfiguration: () => ({ cookieConsent: { enabled: true } }) }));
jest.mock('../../util/reactIntl', () => ({
  useIntl: () => ({ formatMessage: ({ id }) => id }),
  FormattedMessage: ({ id }) => id,
}));

const company = n => ({ blockId: 'company-' + n, title: { content: 'Company ' + n }, text: { content: 'Introduction.\n\n[WhatsApp](https://wa.me/6282382382382)' }, callToAction: { href: 'https://company.example/', content: 'Visit website' } });
const setCompanies = blocks => useSelector.mockImplementation(selector => selector({ user: { currentUser: null }, LandingPage: { servicesPageData: { sections: [{ sectionType: 'columns', blocks }] } } }));

afterEach(() => { Cookies.remove('cookieConsent'); delete window.gtag; });

test('shows only the first three companies in directory order and links to the full directory', () => {
  setCompanies([1,2,3,4].map(company));
  const { getAllByRole, queryByRole, getByRole } = render(<ServicesPromotion />);
  expect(getAllByRole('article')).toHaveLength(3);
  expect(getAllByRole('heading', { level: 2 }).map(h => h.textContent)).toEqual(['Services.nav', 'Company 1', 'Company 2', 'Company 3']);
  expect(queryByRole('button', { name: 'Company 4', exact: true })).toBeNull();
  expect(getByRole('link', { name: /Services.explore/ }).getAttribute('href')).toBe('/p/services');
});

test('keeps the directory link usable when no companies are available', () => {
  setCompanies([]);
  const { queryAllByRole, getByRole } = render(<ServicesPromotion />);
  expect(queryAllByRole('article')).toHaveLength(0);
  expect(getByRole('link', { name: /Services.explore/ })).toBeTruthy();
});

test('homepage WhatsApp icons keep the prefilled message and consent-based company attribution', () => {
  setCompanies([company(1)]);
  window.gtag=jest.fn();
  Cookies.set('cookieConsent','rejected');
  const { getByRole }=render(<ServicesPromotion />);
  const link=getByRole('link',{name:'WhatsApp: Company 1'});
  expect(new URL(link.href).searchParams.get('text')).toBe('I found your profile on balilistings.');
  fireEvent.click(link);
  expect(window.gtag).not.toHaveBeenCalled();
  Cookies.set('cookieConsent','accepted');
  fireEvent.click(link);
  expect(window.gtag).toHaveBeenCalledWith('event','click_service_contact',{service_id:'company-1',service_name:'Company 1',contact_method:'whatsapp'});
});
