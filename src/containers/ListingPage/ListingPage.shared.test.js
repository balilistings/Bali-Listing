// Metadata selection does not depend on page layout or navigation components.
jest.mock('../../components', () => ({ Page: () => null }));
jest.mock('../../containers/FooterContainer/FooterContainer', () => () => null);

import { listingImages } from './ListingPage.shared';

test('metadata includes only the cover while retaining all gallery images', () => {
  const cover = { url: 'https://example.com/cover.jpg', width: 800, height: 600 };
  const other = { url: 'https://example.com/other.jpg', width: 800, height: 600 };
  const images = [
    { attributes: { variants: { facebook: cover } } },
    { attributes: { variants: { facebook: other } } },
  ];
  const listing = { images };
  expect(listingImages(listing, 'facebook')).toEqual([cover]);
  expect(listing.images).toEqual(images);
  expect(listing.images).toHaveLength(2);
});

test('metadata supports the legacy cover size', () => {
  const cover = { name: 'twitter', url: 'https://example.com/cover.jpg' };
  expect(listingImages({ images: [{ attributes: { sizes: [cover] } }] }, 'twitter')).toEqual([cover]);
});

test('missing cover variants do not advertise other gallery photos', () => {
  expect(listingImages({}, 'facebook')).toEqual([]);
  expect(listingImages({ images: [
    { attributes: {} },
    { attributes: { variants: { facebook: { url: 'https://example.com/other.jpg' } } } },
  ] }, 'facebook')).toEqual([]);
});
