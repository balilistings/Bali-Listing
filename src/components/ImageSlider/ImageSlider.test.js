import React from 'react';
import { render, fireEvent } from '@testing-library/react';
import ImageSlider from './ImageSlider';

jest.mock('../../util/useDisableBodyScrollOnSwipe', () => () => jest.fn());
jest.mock('embla-carousel-react', () => {
  let index = 0;
  let selected;
  const api = {
    selectedScrollSnap: () => index,
    canScrollPrev: () => index > 0,
    canScrollNext: () => index < 2,
    scrollSnapList: () => [0, 1, 2],
    on: (event, callback) => { if (event === 'select') selected = callback; },
    off: jest.fn(),
    scrollNext: () => { index += 1; selected(); },
    scrollPrev: () => { index -= 1; selected(); },
  };
  return () => [jest.fn(), api];
});

test('loads only the selected photo and keeps arrow navigation working', () => {
  const { container, getByRole } = render(<ImageSlider images={['cover.jpg', 'second.jpg', 'third.jpg']} title="Villa" />);
  const sources = () => [...container.querySelectorAll('img[src]')].map(img => img.getAttribute('src'));
  expect(sources()).toEqual(['cover.jpg']);
  fireEvent.click(getByRole('button', { name: 'Next image' }));
  expect(sources()).toEqual(['second.jpg']);
  fireEvent.click(getByRole('button', { name: 'Previous image' }));
  expect(sources()).toEqual(['cover.jpg']);
});
