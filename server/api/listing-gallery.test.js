jest.mock('../api-util/sdk', () => ({ getReadSdk: jest.fn(), serialize: x => x, handleError: jest.fn() }));
const { getReadSdk, handleError } = require('../api-util/sdk');
const { show, photo } = require('./listing-gallery');
const defer = require('../api-util/deferListingImages');
const listingId = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';
const imageId = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb';
const coverId = 'cccccccc-cccc-cccc-cccc-cccccccccccc';
const resource = id => ({ id: { uuid: id }, type: 'image', attributes: { variants: { 'scaled-small': { url: 'https://cdn/'+id } } } });
const response = () => ({ data: { data: { relationships: { images: { data: [resource(coverId), resource(imageId)].map(({id,type}) => ({id,type})) } } }, included: [resource(coverId), resource(imageId), resource('avatar')] } });
const res = () => { const r={}; ['set','type','send','status','json'].forEach(k => {r[k]=jest.fn().mockReturnValue(r);}); return r; };
beforeEach(() => jest.clearAllMocks());
test('defers non-cover URLs without mutating cached data, cover, avatar or photo IDs', () => {
  const original=response(); const snapshot=JSON.stringify(original); const result=defer(original);
  expect(JSON.stringify(original)).toBe(snapshot);
  expect(result.data.included[1].attributes).toEqual({variants:{},deferred:true});
  expect(result.data.included[0]).toBe(original.data.included[0]);
  expect(result.data.included[2]).toBe(original.data.included[2]);
  expect(result.data.data.relationships.images.data).toHaveLength(2);
});
test('initial browser response removes non-cover URLs and disables shared HTTP caching', async () => {
  const sdk={listings:{show:jest.fn().mockResolvedValue(response())}}; getReadSdk.mockReturnValue(sdk);
  const req={body:{params:{id:{uuid:listingId}}}}; const r=res(); await show(req,r);
  expect(getReadSdk).toHaveBeenCalledWith(req,r);
  expect(r.send.mock.calls[0][0].included[1].attributes.deferred).toBe(true);
  expect(r.set).toHaveBeenCalledWith('Cache-Control','private, no-store');
});
test('photo endpoint returns only the selected related image using request scoped permissions', async () => {
  const sdk={listings:{show:jest.fn().mockResolvedValue(response())}}; getReadSdk.mockReturnValue(sdk);
  const req={params:{listingId,imageId}}; const r=res(); await photo(req,r);
  expect(getReadSdk).toHaveBeenCalledWith(req,r);
  expect(r.send).toHaveBeenCalledWith(resource(imageId));
});
test('unrelated image and malformed IDs cannot return image data', async () => {
  const sdk={listings:{show:jest.fn().mockResolvedValue(response())}}; getReadSdk.mockReturnValue(sdk);
  const r=res(); await photo({params:{listingId,imageId:'dddddddd-dddd-dddd-dddd-dddddddddddd'}},r);
  expect(r.status).toHaveBeenCalledWith(404); expect(r.send).not.toHaveBeenCalled();
  const invalid=res(); await photo({params:{listingId:'invalid',imageId}},invalid);
  expect(invalid.status).toHaveBeenCalledWith(400); expect(sdk.listings.show).toHaveBeenCalledTimes(1);
});
test('denied listing reads remain denied', async () => {
  const error={status:403}; getReadSdk.mockReturnValue({listings:{show:jest.fn().mockRejectedValue(error)}});
  const r=res(); await photo({params:{listingId,imageId}},r);
  expect(handleError).toHaveBeenCalledWith(r,error); expect(r.send).not.toHaveBeenCalled();
});
