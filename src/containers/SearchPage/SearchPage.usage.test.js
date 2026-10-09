import reducer, { searchListings } from './SearchPage.duck';
import { post } from '../../util/api';
jest.mock('../../util/api', () => ({ post: jest.fn() }));
test('search hydration and back navigation reuse results while changed filters fetch again', async () => {
  const listing={id:{uuid:'listing'},type:'listing',attributes:{state:'published',deleted:false}};
  const config={accessControl:{marketplace:{private:false}},currency:'IDR',search:{defaultFilters:[],sortConfig:{}},listing:{listingTypes:[],enforceValidListingType:false},categoryConfiguration:{categories:[]}};
  const state={SearchPage:reducer(undefined,{}),auth:{isAuthenticated:false},user:{},marketplaceData:{entities:{listing:{listing}}}};
  const dispatch=action=>{state.SearchPage=reducer(state.SearchPage,action);};
  post.mockResolvedValue({data:[listing],meta:{totalItems:1,totalPages:1,page:1,perPage:24}});
  await searchListings({page:1,perPage:24},config)(dispatch,()=>state,{});
  const hydrated=await searchListings({page:1,perPage:24},config)(dispatch,()=>state,{});
  expect(post).toHaveBeenCalledTimes(1);
  expect(hydrated.data.data).toEqual([listing]);
  await searchListings({page:2,perPage:24},config)(dispatch,()=>state,{});
  expect(post).toHaveBeenCalledTimes(2);
});
