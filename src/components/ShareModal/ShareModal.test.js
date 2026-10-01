import React from 'react';
import { act } from '@testing-library/react';
import { renderToString } from 'react-dom/server.node';
import { hydrateRoot } from 'react-dom/client';
import ShareModal from './ShareModal';

jest.mock('../Modal/Modal', () => props => <div data-testid="share-modal">{props.children}</div>);
jest.mock('../../containers/PageBuilder/Primitives/Link', () => ({ SocialMediaLink: () => <span /> }));
jest.mock('react-intl', () => ({ FormattedMessage: ({ id }) => <span>{id}</span> }));

test('hydrates the server placeholder without a mismatch, then mounts the share dialog', async () => {
  const props = { isOpen: false, onClose: jest.fn() };
  const descriptor = Object.getOwnPropertyDescriptor(global, 'window');
  let html;
  try {
    Object.defineProperty(global, 'window', { value: undefined, configurable: true });
    html = renderToString(<ShareModal {...props} />);
  } finally {
    Object.defineProperty(global, 'window', descriptor);
  }
  expect(html).toBe('');
  const container = document.createElement('div');
  container.innerHTML = html;
  document.body.appendChild(container);
  const onRecoverableError = jest.fn();
  let root;
  await act(async () => {
    root = hydrateRoot(container, <ShareModal {...props} />, { onRecoverableError });
  });
  expect(onRecoverableError).not.toHaveBeenCalled();
  expect(container.querySelector('[data-testid="share-modal"]')).not.toBeNull();
  await act(async () => root.unmount());
  container.remove();
});
