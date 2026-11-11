import React from 'react';
import { render, waitFor } from '@testing-library/react';
import DeferredGalleryImage from './DeferredGalleryImage';
import { get } from '../../util/api';
jest.mock('../../util/api', () => ({ get: jest.fn() }));
jest.mock('../../components/ResponsiveImage/ResponsiveImage', () => ({ image }) => <img alt="selected" src={image.attributes.variants.scaled.url} />);

const image = { id: { uuid: 'photo' }, attributes: { deferred: true, variants: {} } };
const photo = { ...image, attributes: { variants: { scaled: { url: 'photo.jpg' } } } };
beforeEach(() => get.mockReset());

test('gallery remounts reuse the same photo request but separate galleries do not share it', async () => {
  const photoRequests = new Map();
  get.mockResolvedValue(photo);
  const props = { image, listingId: { uuid: 'listing' }, variants: ['scaled'], photoRequests };
  const first = render(<DeferredGalleryImage {...props} />);
  await waitFor(() => expect(first.getByAltText('selected').getAttribute('src')).toBe('photo.jpg'));
  first.unmount();
  const second = render(<DeferredGalleryImage {...props} />);
  await waitFor(() => expect(second.getByAltText('selected')).toBeTruthy());
  expect(get).toHaveBeenCalledTimes(1);
  second.unmount();
  render(<DeferredGalleryImage {...props} photoRequests={new Map()} />);
  await waitFor(() => expect(get).toHaveBeenCalledTimes(2));
});
