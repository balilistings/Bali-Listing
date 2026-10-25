const {parseCSV,fromExports}=require('./provider-csv');
test('quoted JSON, commas, doubled quotes and multiline fields survive CSV parsing',()=>{
 const text='Id,Title,PrivateData\r\n1,"Villa, with\nspace","{""date"":""2026-10-25""}"\r\n';
 expect(parseCSV(text)[0]).toEqual({Id:'1',Title:'Villa, with\nspace',PrivateData:'{"date":"2026-10-25"}'});
});
test('malformed exports fail instead of silently producing incomplete data',()=>{
 expect(()=>parseCSV('Id,PrivateData\n1,"unfinished')).toThrow('unclosed');
 expect(()=>parseCSV('Title\nVilla')).toThrow('Expected');
 expect(()=>parseCSV('Id,PrivateData\n1')).toThrow('row');
});
test('Sharetribe exports map private dates and author identities',()=>{
 const r=fromExports('Id,DisplayName,PrivateData,EmailAddress\nu,Owner,{},owner@example.com','Id,Title,PrivateData,State,AuthorId\nl,Villa,{},published,u');
 expect(r.users[0].attributes.profile.displayName).toBe('Owner');
 expect(r.listings[0].relationships.author.data.id).toBe('u');
});
