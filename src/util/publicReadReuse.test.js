import { reusePublicRead, canReusePublicRead, responseFromEntities, publicReadKey } from './publicReadReuse';
const response = (at, data = []) => ({ data: { data, meta: { publicReadFetchedAt: at } } });
const publicConfig = { accessControl: { marketplace: { private: false } } };
test('rehydration reuses server data without refreshing its age, then expires', async () => {
  const sdk = {}; let now=100000; const clock=jest.spyOn(Date,'now').mockImplementation(()=>now);
  const seed=response(50000); const load=jest.fn().mockResolvedValue(response(110001));
  try {
    expect(await reusePublicRead(sdk,'listing',60000,true,seed,load)).toBe(seed);
    now=110001;
    await reusePublicRead(sdk,'listing',60000,true,seed,load);
    expect(load).toHaveBeenCalledTimes(1);
  } finally { clock.mockRestore(); }
});
test('identical in-flight reads share a request and empty review results are cached', async () => {
  const sdk={}; const load=jest.fn().mockResolvedValue(response(Date.now()));
  const a=reusePublicRead(sdk,'reviews',300000,true,null,load);
  const b=reusePublicRead(sdk,'reviews',300000,true,null,load);
  expect(a).toBe(b); await a;
  await reusePublicRead(sdk,'reviews',300000,true,null,load);
  expect(load).toHaveBeenCalledTimes(1);
});
test('private, authenticated and unknown marketplace contexts do not reuse public data', async () => {
  expect(canReusePublicRead({},publicConfig)).toBe(true);
  expect(canReusePublicRead({auth:{isAuthenticated:true}},publicConfig)).toBe(false);
  expect(canReusePublicRead({user:{currentUser:{id:'user'}}},publicConfig)).toBe(false);
  expect(canReusePublicRead({}, {accessControl:{marketplace:{private:true}}})).toBe(false);
  expect(canReusePublicRead({},{})).toBe(false);
  const sdk={}; const load=jest.fn().mockResolvedValue(response(Date.now()));
  await reusePublicRead(sdk,'same',60000,true,null,load);
  await reusePublicRead(sdk,'same',60000,false,null,load);
  await reusePublicRead(sdk,'same',60000,true,null,load);
  expect(load).toHaveBeenCalledTimes(3);
});
test('failures can retry and different filters/configuration cannot collide', async () => {
  const sdk={}; const load=jest.fn().mockRejectedValueOnce(new Error('failure')).mockResolvedValue(response(Date.now()));
  await expect(reusePublicRead(sdk,'same',60000,true,null,load)).rejects.toThrow('failure');
  await reusePublicRead(sdk,'same',60000,true,null,load);
  expect(load).toHaveBeenCalledTimes(2);
  expect(publicReadKey('search',{page:1},{})).not.toBe(publicReadKey('search',{page:2},{}));
  expect(publicReadKey('search',{},{})).not.toBe(publicReadKey('search',{}, {hostedAssets:{version:'new'}}));
});
test('SSR seed reconstructs related images and preserves one-item search arrays', () => {
  const id={uuid:'listing'}; const imageId={uuid:'image'};
  const listing={id,type:'listing',relationships:{images:{data:[{id:imageId,type:'image'}]}}};
  const image={id:imageId,type:'image',attributes:{variants:{}}};
  const state={marketplaceData:{entities:{listing:{listing},image:{image}}}};
  expect(responseFromEntities(state,[id],{},100).data.data).toEqual([listing]);
  expect(responseFromEntities(state,[id],{},100,true).data.data).toEqual(listing);
  expect(responseFromEntities(state,[id],{},100,true).data.included).toEqual([image]);
});
