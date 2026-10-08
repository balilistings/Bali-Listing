import defer from './deferListingImages';
const serverDefer = require('../../server/api-util/deferListingImages');
test('browser and server sanitizers keep the same cover-only contract', () => {
 const images = ['cover','second'].map(uuid => ({type:'image',id:{uuid},attributes:{variants:{scaled:{url:uuid+'.jpg'}}}}));
 const response = {data:{data:{relationships:{images:{data:images.map(({type,id})=>({type,id}))}}},included:images}};
 expect(defer(response)).toEqual(serverDefer(response));
 expect(defer(response).data.included[1].attributes).toEqual({variants:{},deferred:true});
 expect(response.data.included[1].attributes.variants.scaled.url).toBe('second.jpg');
});
