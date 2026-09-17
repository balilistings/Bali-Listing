import React from 'react';
import { renderToString } from 'react-dom/server.node';
import { hydrateRoot } from 'react-dom/client';
import { act } from '@testing-library/react';
import { TestProvider } from '../../util/testHelpers';
import LocationInput from './LocationAutocompleteInputImpl';

jest.mock('uuid', () => ({ validate: () => false, v4: () => 'test-id' }));

it('hydrates desktop server markup on a mobile viewport without replacing the root', async () => {
  const oldWidth = window.innerWidth;
  const props = { input: { name: 'location', value: {}, onChange: jest.fn() }, placeholder: 'Select location' };
  const tree = <TestProvider><LocationInput {...props} /></TestProvider>;
  const container = document.createElement('div');
  window.innerWidth = 1280;
  container.innerHTML = renderToString(tree);
  const originalNode = container.firstChild;
  window.innerWidth = 390;
  const onRecoverableError = jest.fn();
  let root;
  try {
    await act(async () => { root = hydrateRoot(container, tree, { onRecoverableError }); });
    expect(onRecoverableError).not.toHaveBeenCalled();
    expect(container.firstChild).toBe(originalNode);
    expect(container.querySelector('input[type="search"]')).toBeNull();
    expect(container.textContent).toContain('Select location');
  } finally {
    if (root) await act(async () => root.unmount());
    window.innerWidth = oldWidth;
  }
});
