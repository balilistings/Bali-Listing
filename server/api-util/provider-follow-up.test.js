const { status, buildReport, fetchAll } = require('./provider-follow-up');
const now = Date.parse('2026-10-25T00:00:00Z');
test('60-day boundary is inclusive, future and missing dates are unknown',()=>{
 expect(status(new Date(now-60*86400000).toISOString(),now).status).toBe('Follow up');
 expect(status(new Date(now-60*86400000+1).toISOString(),now).status).toBe('Current');
 [undefined,'bad','2099-01-01'].forEach(x=>expect(status(x,now).status).toBe('Unknown'));
});
test('published inventory is joined to providers, with activity and confirmation kept separate',()=>{
 const user={id:{uuid:'owner'},attributes:{email:'owner@example.com',profile:{displayName:'Owner',privateData:{blLastActiveAt:new Date(now).toISOString()}}}};
 const listing=(state,confirmed)=>({id:{uuid:state},attributes:{state,title:state,privateData:{blAvailabilityConfirmedAt:confirmed}},relationships:{author:{data:{id:{uuid:'owner'}}}}});
 const r=buildReport([user],[listing('published'),listing('closed'),listing('draft')],now);
 expect(r.providers).toHaveLength(1); expect(r.providers[0]).toMatchObject({status:'Current',publishedListings:1,listingsUnknown:1}); expect(r.listings[0].status).toBe('Unknown');
});
test('reports paginate through all records and fail rather than return partial data',async()=>{
 const query=jest.fn().mockResolvedValueOnce({data:{data:[1],meta:{totalPages:2}}}).mockResolvedValueOnce({data:{data:[2],meta:{totalPages:2}}});
 expect(await fetchAll(query,{})).toEqual([1,2]); expect(query).toHaveBeenLastCalledWith({page:2,perPage:100});
 await expect(fetchAll(async()=>({data:{data:[]}}),{})).rejects.toThrow('Incomplete');
});
