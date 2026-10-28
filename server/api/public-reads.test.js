jest.mock('../api-util/sdk',()=>({getReadSdk:jest.fn(),serialize:x=>x,handleError:jest.fn(),getPublicReadCacheStats:()=>({})}));
const {getReadSdk,handleError}=require('../api-util/sdk');
const routes=require('./public-reads');
const res=()=>{const r={};['set','type','send','status','json'].forEach(k=>r[k]=jest.fn().mockReturnValue(r));return r;};
test('location and bedroom searches restore bounds after the real Transit round trip', async()=>{
 const sdk=require('sharetribe-flex-sdk');
 const {LatLng,LatLngBounds}=sdk.types;
 const original={bounds:new LatLngBounds(new LatLng(-8.62735,115.14261),new LatLng(-8.65302,115.11824)),pub_bedrooms:'3',pub_categoryLevel1:'rentalvillas'};
 const params=sdk.transit.read(sdk.transit.write(original));
 expect(params.bounds).not.toBeInstanceOf(LatLngBounds);
 const query=jest.fn().mockResolvedValue({data:{data:[],meta:{}}});getReadSdk.mockReturnValue({listings:{query}});
 await routes.listings({body:{params}},res());
 const received=query.mock.calls[0][0];
 expect(received.bounds).toBeInstanceOf(LatLngBounds);
 expect(received.bounds).toEqual(original.bounds);
 expect(received.pub_bedrooms).toBe('3');
 expect(received.pub_categoryLevel1).toBe('rentalvillas');
 expect(params.bounds).not.toBeInstanceOf(LatLngBounds);
});

test('featured gallery requests remove non-cover URLs before sending them to the browser', async () => {
 const images = ['cover', 'extra'].map(uuid => ({ id: { uuid }, type: 'image', attributes: { variants: { scaled: { url: uuid + '.jpg' } } } }));
 const original = { data: { meta: {}, data: [{ relationships: { images: { data: images.map(({ id, type }) => ({ id, type })) } } }], included: images } };
 const query = jest.fn().mockResolvedValue(original);
 getReadSdk.mockReturnValue({ listings: { query } });
 const r = res();
 await routes.listings({ body: { params: { perPage: 3 }, deferImages: true } }, r);
 expect(query).toHaveBeenCalledWith({ perPage: 3 });
 expect(r.send.mock.calls[0][0].included[1].attributes).toEqual({ variants: {}, deferred: true });
 expect(original.data.included[1].attributes.variants.scaled.url).toBe('extra.jpg');
});
test('malformed location bounds are rejected before querying listings',async()=>{
 const query=jest.fn();getReadSdk.mockReturnValue({listings:{query}});
 const r=res();await routes.listings({body:{params:{bounds:{_sdkType:'LatLngBounds',ne:{lat:NaN,lng:115},sw:{lat:-8,lng:115}}}}},r);
 expect(r.status).toHaveBeenCalledWith(400);expect(query).not.toHaveBeenCalled();
});
test('queries use request-scoped permissions and report cache status without HTTP sharing', async()=>{
 const query=jest.fn().mockResolvedValue({data:{data:[],meta:{publicReadCache:'hit'}}});getReadSdk.mockReturnValue({listings:{query}});
 const req={body:{params:{page:2,sort:'createdAt'}}};const r=res();await routes.listings(req,r);
 expect(getReadSdk).toHaveBeenCalledWith(req,r);expect(query).toHaveBeenCalledWith(req.body.params);
 expect(r.set).toHaveBeenCalledWith('Cache-Control','private, no-store');
 expect(r.set).toHaveBeenCalledWith('X-Public-Read-Cache','hit');
});
test('reviews are always public and permission errors stay denied',async()=>{
 const query=jest.fn().mockRejectedValue({status:403});getReadSdk.mockReturnValue({reviews:{query}});
 const r=res();await routes.reviews({body:{params:{state:'pending',listing_id:'listing'}}},r);
 expect(query).toHaveBeenCalledWith({state:'public',listing_id:'listing'});
 expect(handleError).toHaveBeenCalledWith(r,{status:403});expect(r.send).not.toHaveBeenCalled();
});
