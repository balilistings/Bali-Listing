jest.mock('../api-util/sdk', () => ({ getSdk: jest.fn(), isLoginAsSession: jest.fn() }));
const { getSdk, isLoginAsSession } = require('../api-util/sdk');
const { recordActivity, confirmAvailability } = require('./provider-activity');
const id = '11111111-1111-4111-8111-111111111111';
const response = () => { const r = {}; ['set','status','json'].forEach(k=>r[k]=jest.fn().mockReturnValue(r)); return r; };
let sdk;
beforeEach(() => {
  jest.clearAllMocks(); isLoginAsSession.mockReturnValue(false);
  sdk = { currentUser: { show: jest.fn().mockResolvedValue({data:{data:{attributes:{profile:{privateData:{favorites:['kept']}}}}}}), updateProfile: jest.fn().mockResolvedValue({}) }, ownListings: { show: jest.fn().mockResolvedValue({data:{data:{attributes:{state:'published'}}}}), update: jest.fn().mockResolvedValue({}) } };
  getSdk.mockReturnValue(sdk);
});
const req = body => ({body, get:()=> 'same-origin'});
test('activity uses server time and merges only its private field',async()=>{
 const r=response(); await recordActivity(req({lastActiveAt:'2099-01-01',userId:'someone-else'}),r);
 const data=sdk.currentUser.updateProfile.mock.calls[0][0];
 expect(Object.keys(data.privateData)).toEqual(['blLastActiveAt']);
 expect(Math.abs(Date.now()-Date.parse(data.privateData.blLastActiveAt))).toBeLessThan(1000);
 expect(r.set).toHaveBeenCalledWith('Cache-Control','private, no-store');
});
test('activity within 24 hours causes no write',async()=>{
 sdk.currentUser.show.mockResolvedValue({data:{data:{attributes:{profile:{privateData:{blLastActiveAt:new Date().toISOString()}}}}}});
 await recordActivity(req({}),response()); expect(sdk.currentUser.updateProfile).not.toHaveBeenCalled();
});
test('anonymous activity fails without a write',async()=>{
 sdk.currentUser.show.mockRejectedValue({status:401}); const r=response(); await recordActivity(req({}),r);
 expect(r.status).toHaveBeenCalledWith(401); expect(sdk.currentUser.updateProfile).not.toHaveBeenCalled();
});
test('impersonation is excluded for activity and confirmations',async()=>{
 isLoginAsSession.mockReturnValue(true); await recordActivity(req({}),response()); await confirmAvailability(req({listingId:id}),response()); expect(getSdk).not.toHaveBeenCalled();
});
test('cross-site requests cannot change tracking',async()=>{
 const r=response(); await recordActivity({get:()=> 'cross-site'},r); expect(r.status).toHaveBeenCalledWith(403); expect(getSdk).not.toHaveBeenCalled();
});
test('confirmation requires ownership and ignores client timestamps',async()=>{
 const r=response();await confirmAvailability(req({listingId:id,confirmedAvailableAt:'2099-01-01'}),r);
 expect(sdk.ownListings.show).toHaveBeenCalledWith({id});
 const update=sdk.ownListings.update.mock.calls[0][0]; expect(Object.keys(update)).toEqual(['id','privateData']);
 expect(Math.abs(Date.now()-Date.parse(update.privateData.blAvailabilityConfirmedAt))).toBeLessThan(1000);
});
test('another providers listing cannot be confirmed',async()=>{
 sdk.ownListings.show.mockRejectedValue({status:404}); const r=response(); await confirmAvailability(req({listingId:id}),r);
 expect(r.status).toHaveBeenCalledWith(404); expect(sdk.ownListings.update).not.toHaveBeenCalled();
});
test.each(['draft','closed','pendingApproval'])('%s listings are not changed',async state=>{
 sdk.ownListings.show.mockResolvedValue({data:{data:{attributes:{state}}}}); const r=response();await confirmAvailability(req({listingId:id}),r);expect(r.status).toHaveBeenCalledWith(409);expect(sdk.ownListings.update).not.toHaveBeenCalled();
});
test('invalid listing IDs fail before SDK calls',async()=>{const r=response();await confirmAvailability(req({listingId:'bad'}),r);expect(r.status).toHaveBeenCalledWith(400);expect(getSdk).not.toHaveBeenCalled();});
test('save failures never report success',async()=>{sdk.ownListings.update.mockRejectedValue({status:500});const r=response();await confirmAvailability(req({listingId:id}),r);expect(r.status).toHaveBeenCalledWith(500);expect(r.json).not.toHaveBeenCalledWith(expect.objectContaining({confirmedAvailableAt:expect.anything()}));});
