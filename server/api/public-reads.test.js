jest.mock('../api-util/sdk',()=>({getReadSdk:jest.fn(),serialize:x=>x,handleError:jest.fn(),getPublicReadCacheStats:()=>({})}));
const {getReadSdk,handleError}=require('../api-util/sdk');
const routes=require('./public-reads');
const res=()=>{const r={};['set','type','send','status','json'].forEach(k=>r[k]=jest.fn().mockReturnValue(r));return r;};
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
