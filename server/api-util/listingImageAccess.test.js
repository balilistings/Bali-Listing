const { restrictListingImages, withListingImageAccess } = require('./listingImageAccess');
const image = id => ({ type: 'image', id: { uuid: id }, attributes: { variants: { scaled: { url: `https://cdn/${id}.jpg` } } } });
const listing = (id, ids, state = 'published') => ({
  type: 'listing', id: { uuid: id }, attributes: { state, title: id },
  relationships: { images: { data: ids.map(id => ({ type: 'image', id: { uuid: id } })) } },
});
const response = () => ({ data: { data: listing('open', ['cover', 'gallery']), included: [image('cover'), image('gallery'), image('avatar')] } });
test('anonymous responses retain a cover but no gallery URLs without mutating the cache', () => {
  const raw = response(); const before = JSON.stringify(raw); const safe = restrictListingImages(raw);
  expect(JSON.stringify(safe)).toContain('https://cdn/cover.jpg');
  expect(JSON.stringify(safe)).not.toContain('https://cdn/gallery.jpg');
  expect(safe.data.included[1].attributes.loginRequired).toBe(true);
  expect(safe.data.data.relationships.images.data).toHaveLength(2);
  expect(JSON.stringify(raw)).toBe(before);
});
test('authenticated published galleries retain all original photo URLs', () => {
  const safe = restrictListingImages(response(), true);
  expect(safe.data.included[1].attributes.variants.scaled.url).toBe('https://cdn/gallery.jpg');
  expect(safe.data.data.attributes.galleryAccess).toBe('full');
});
test.each([false, true])('closed listing photos are hidden, authenticated=%s', authenticated => {
  const raw = response(); raw.data.data.attributes.state = 'closed';
  const safe = restrictListingImages(raw, authenticated);
  expect(safe.data.data.relationships.images.data).toEqual([]);
  expect(safe.data.included).toEqual([image('avatar')]);
  expect(safe.data.data.attributes.title).toBe('open');
});
test('a cover shared with another gallery remains visible', () => {
  const raw = { data: { data: [listing('a', ['cover-a', 'cover-b']), listing('b', ['cover-b', 'extra'])], included: ['cover-a', 'cover-b', 'extra'].map(image) } };
  const safe = restrictListingImages(raw);
  expect(safe.data.included[1].attributes.variants).toEqual(image('cover-b').attributes.variants);
  expect(safe.data.included[2].attributes.loginRequired).toBe(true);
});
test('sparse reads include state so callers cannot omit closed-listing checks', async () => {
  const show = jest.fn().mockResolvedValue(response());
  await withListingImageAccess({ listings: { show } }, false).listings.show({ 'fields.listing': ['title'] }, { expand: true });
  expect(show).toHaveBeenCalledWith({ 'fields.listing': ['title', 'state'] }, { expand: true });
});
test('authentication is evaluated after reading and upstream failures stay rejected', async () => {
  let authenticated = false;
  const show = jest.fn().mockImplementation(() => { authenticated = true; return Promise.resolve(response()); });
  const sdk = withListingImageAccess({ listings: { show } }, async () => authenticated);
  expect((await sdk.listings.show({ id: 'open' })).data.included[1].attributes.variants).toBeTruthy();
  show.mockRejectedValueOnce(new Error('Not permitted'));
  await expect(sdk.listings.show({ id: 'private' })).rejects.toThrow('Not permitted');
});
