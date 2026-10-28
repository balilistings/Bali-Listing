import defer from './deferListingImages';
const serverDefer = require('../../server/api-util/deferListingImages');
test('browser and server sanitizers keep the same cover-only contract', () => {
 const images = ['cover','second'].map(uuid => ({type:'image',id:{uuid},attributes:{variants:{scaled:{url:uuid+'.jpg'}}}}));
 const response = {data:{data:{relationships:{images:{data:images.map(({type,id})=>({type,id}))}}},included:images}};
 expect(defer(response)).toEqual(serverDefer(response));
 expect(defer(response).data.included[1].attributes).toEqual({variants:{},deferred:true});
 expect(response.data.included[1].attributes.variants.scaled.url).toBe('second.jpg');
});

test('multi-listing responses retain covers and IDs but omit extra URLs without changing the cache', () => {
 const refs = ids => ids.map(uuid => ({ type: 'image', id: { uuid } }));
 const data = [['cover-a', 'second-a', 'cover-b'], ['cover-b', 'second-b']].map(ids => ({
   relationships: { images: { data: refs(ids) } },
 }));
 const included = refs(['cover-a', 'second-a', 'cover-b', 'second-b', 'avatar']).map(r => ({
   ...r, attributes: { variants: { scaled: { url: r.id.uuid + '.jpg' } } },
 }));
 const original = { data: { data, included } };
 const result = defer(original);
 expect(result).toEqual(serverDefer(original));
 expect(JSON.stringify(result)).not.toContain('second-a.jpg');
 expect(JSON.stringify(result)).not.toContain('second-b.jpg');
 expect(result.data.data).toBe(data);
 expect(result.data.included.filter(i => !i.attributes.deferred)).toHaveLength(3);
 expect(original.data.included[1].attributes.variants.scaled.url).toBe('second-a.jpg');
});
