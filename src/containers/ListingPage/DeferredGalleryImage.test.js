import React from 'react';
import { render, waitFor } from '@testing-library/react';
import DeferredGalleryImage from './DeferredGalleryImage';
import { get } from '../../util/api';
jest.mock('../../components/NamedLink/NamedLink', () => ({ children, to, onClick }) => <a href="/login" onClick={onClick} data-return-to={to?.state?.from}>{children}</a>);
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

test('restricted images show sign-in with a return path without requesting a photo',()=>{
  const restricted={...image,attributes:{...image.attributes,loginRequired:true}};
  const {getByRole,queryByAltText}=render(<DeferredGalleryImage image={restricted} listingId={{uuid:'listing'}} variants={['scaled']} />);
  expect(getByRole('link',{name:'Sign in to view all photos'}).getAttribute('data-return-to')).toBe('/');
  expect(queryByAltText('selected')).toBeNull(); expect(get).not.toHaveBeenCalled();
});
test('server access denial offers sign-in instead of retrying indefinitely',async()=>{
  get.mockRejectedValue(Object.assign(new Error('Sign in'),{status:403}));
  const {getByRole,queryByRole}=render(<DeferredGalleryImage image={image} listingId={{uuid:'listing'}} variants={['scaled']} />);
  await waitFor(()=>expect(getByRole('link',{name:'Sign in to view all photos'})).toBeTruthy());
  expect(queryByRole('button',{name:/Retry/})).toBeNull(); expect(get).toHaveBeenCalledTimes(1);
});
