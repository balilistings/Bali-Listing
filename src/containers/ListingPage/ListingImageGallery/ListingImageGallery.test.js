import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react';
import ListingImageGallery from './ListingImageGallery';

jest.mock('../../../util/reactIntl', () => ({
  useIntl: () => ({ formatMessage: (message, values) => message.defaultMessage || `Photo ${values?.index || ''}` }),
  FormattedMessage: () => <span>View images</span>,
}));
jest.mock('../../../components', () => ({
  AspectRatioWrapper: ({ children }) => <div>{children}</div>,
  Button: ({ children, ...props }) => <button {...props}>{children}</button>,
  IconClose: () => null,
  IconArrowHead: () => null,
  ResponsiveImage: ({ image, alt, variants }) => <img alt={alt} srcSet={image?.attributes?.variants?.[variants[0]]?.url} />,
}));

test('initial gallery exposes only cover URLs and selection loads another photo', async () => {
  const images = [0, 1, 2].map(i => ({ attributes: { variants: { scaled: { url: `photo-${i}.jpg`, width: 800, height: 600 } } } }));
  const { container, getByRole } = render(<ListingImageGallery images={images} imageVariants={['scaled']} />);
  const sources = () => [...container.querySelectorAll('img[srcset]')].map(img => img.getAttribute('srcset'));
  expect(sources()).toEqual(['photo-0.jpg']);
  expect(container.querySelector('.image-gallery-thumbnails-wrapper')).toBeNull();
  expect(getByRole('status').textContent).toBe('1 / 3');
  fireEvent.click(getByRole('button', { name: 'Next photo' }));
  await waitFor(() => expect(getByRole('status').textContent).toBe('2 / 3'));
  expect(sources()).toEqual(['photo-0.jpg', 'photo-1.jpg']);
  fireEvent.click(getByRole('button', { name: 'Previous photo' }));
  await waitFor(() => expect(getByRole('status').textContent).toBe('1 / 3'));
  expect(sources()).not.toContain('photo-2.jpg');
});

test('swiping loads the destination photo without loading the remaining gallery', async () => {
  const images = [0, 1, 2].map(i => ({ attributes: { variants: { scaled: { url: `swipe-${i}.jpg`, width: 800, height: 600 } } } }));
  const { container, getByRole } = render(<ListingImageGallery images={images} imageVariants={['scaled']} />);
  const slider = container.querySelector('.image-gallery-swipe');
  fireEvent.touchStart(slider, { touches: [{ clientX: 300, clientY: 100 }] });
  fireEvent.touchMove(slider, { touches: [{ clientX: 100, clientY: 100 }] });
  fireEvent.touchEnd(slider, { changedTouches: [{ clientX: 100, clientY: 100 }] });
  await waitFor(() => expect(getByRole('status').textContent).toBe('2 / 3'));
  const sources = [...container.querySelectorAll('img[srcset]')].map(img => img.getAttribute('srcset'));
  expect(sources).toEqual(['swipe-0.jpg', 'swipe-1.jpg']);
});
