import React from 'react';
import { renderToString } from 'react-dom/server.node';
import { hydrateRoot } from 'react-dom/client';
import { act, fireEvent } from '@testing-library/react';
import { TestProvider, renderWithProviders } from '../../util/testHelpers';
import { createUser, createListing, fakeIntl } from '../../util/testData';
import ListingCard, { checkPriceParams } from './ListingCard';
import { GenericError } from '../../containers/TopbarContainer/Topbar/Topbar';
import CardContainer from './CardContainer';
import { useLocation } from 'react-router-dom';

jest.mock('embla-carousel-react', () => () => [() => {}, null]);
jest.mock('uuid', () => ({ validate: () => false, v4: () => 'test-id' }));

it('hydrates listing and author links without browser HTML repair', async () => {
  const listing = createListing('listing1', {}, { author: createUser('user1') });
  const tree = <TestProvider><ListingCard listing={listing} intl={fakeIntl} /></TestProvider>;
  const container = document.createElement('div');
  document.body.appendChild(container);
  container.innerHTML = renderToString(tree);
  const before = container.innerHTML;
  const onRecoverableError = jest.fn();
  let root;
  await act(async () => { root = hydrateRoot(container, tree, { onRecoverableError }); });
  expect(onRecoverableError).not.toHaveBeenCalled();
  expect(container.querySelector('article')).not.toBeNull();
  expect(container.querySelector('a a')).toBeNull();
  expect(container.querySelectorAll('a').length).toBe(2);
  expect(container.innerHTML).toBe(before);
  await act(async () => root.unmount());
  container.remove();
});

it('uses supplied router query for rental prices', () => {
  expect(checkPriceParams('?pub_monthprice=100,200')).toEqual({
    weekprice: null, monthprice: '100,200', yearprice: null,
  });
  expect(checkPriceParams('').monthprice).toBeNull();
});

it('keeps carousel controls separate from card navigation', () => {
  const Location = () => <output data-testid="route">{useLocation().pathname}</output>;
  const view = renderWithProviders(<>
    <CardContainer id="listing1" slug="villa"><button>Next image</button><span>Card background</span></CardContainer>
    <Location />
  </>);
  fireEvent.click(view.getByRole('button', { name: 'Next image' }));
  expect(view.getByTestId('route').textContent).toBe('/');
  fireEvent.click(view.getByText('Card background'));
  expect(view.getByTestId('route').textContent).toBe('/l/villa/listing1');
});

it('removes inactive errors and announces active errors', () => {
  const view = renderWithProviders(<GenericError show={false} />);
  expect(view.container.textContent).toBe('');
  view.rerender(<GenericError show={true} />);
  expect(view.getByRole('alert')).toBeTruthy();
});
