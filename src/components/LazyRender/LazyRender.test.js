import React from 'react';
import { renderToString } from 'react-dom/server.node';
import { hydrateRoot } from 'react-dom/client';
import { act } from '@testing-library/react';
import LazyRender from './LazyRender';

it.each(['section', 'article'])('preserves server-rendered %s content during hydration', async tag => {
  const child = React.createElement(tag, { id: 'content' }, 'Searchable content');
  const container = document.createElement('div');
  // The server has always emitted the complete child, without a placeholder.
  container.innerHTML = renderToString(child);
  const originalNode = container.firstChild;
  const onRecoverableError = jest.fn();
  let root;
  await act(async () => {
    root = hydrateRoot(container, <LazyRender>{child}</LazyRender>, { onRecoverableError });
  });
  expect(onRecoverableError).not.toHaveBeenCalled();
  expect(container.firstChild).toBe(originalNode);
  expect(container.textContent).toBe('Searchable content');
  await act(async () => root.unmount());
});
