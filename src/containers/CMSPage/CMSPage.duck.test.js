import { loadData } from './CMSPage.duck';
import { fetchPageAssets } from '../../ducks/hostedAssets.duck';

jest.mock('../../ducks/hostedAssets.duck', () => ({ fetchPageAssets: jest.fn(assets => assets) }));

test('missing service translation falls back to the shared English company directory', async () => {
  const dispatch = jest
    .fn()
    .mockResolvedValueOnce(undefined)
    .mockResolvedValueOnce({ services: { data: { sections: [] } } });
  await loadData({ pageId: 'services' }, '', {}, { params: { locale: 'id' } }, 'id')(dispatch);
  expect(fetchPageAssets).toHaveBeenNthCalledWith(
    1,
    { services: 'content/pages/services-id.json' },
    true
  );
  expect(fetchPageAssets).toHaveBeenNthCalledWith(
    2,
    { services: 'content/pages/services.json' },
    true
  );
});
