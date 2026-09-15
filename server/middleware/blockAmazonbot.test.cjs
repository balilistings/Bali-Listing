const test = require('node:test');
const assert = require('node:assert/strict');
const http = require('node:http');
const express = require('express');
const block = require('./blockAmazonbot');
const tracking = require('./requestTraffic');

test('Blocked crawlers stop before routes, remain logged, and do not affect other clients', async () => {
  const logs=[];
  let routed=0;
  const app=express();
  app.use(tracking({emit:line=>logs.push(JSON.parse(line))}));
  app.use(block);
  app.use((req,res)=>{routed++;res.send('normal page');});
  const server=app.listen(0,'127.0.0.1');
  await new Promise(resolve=>server.once('listening',resolve));
  const request=(ua,method='GET')=>new Promise((resolve,reject)=>{
    http.get({host:'127.0.0.1',port:server.address().port,path:'/listing',method,headers:{'user-agent':ua}},res=>{
      let body='';res.on('data',c=>body+=c);res.on('end',()=>resolve({status:res.statusCode,headers:res.headers,body}));
    }).on('error',reject);
  });
  try {
    for(const ua of ['meta-externalagent/1.1','META-EXTERNALAGENT','Mozilla/5.0 (compatible; meta-externalagent/1.1 (+https://developers.facebook.com/docs/sharing/webmasters/crawler))','GPTBot/1.4','gptbot','Mozilla/5.0 (compatible; GPTBot/1.4; +https://openai.com/gptbot)','Amazonbot/0.1','Mozilla/5.0 (compatible; Amazonbot/0.1; +https://developer.amazon.com/support/amazonbot)','amazonbot','PetalBot','petalbot/1.0','Mozilla/5.0 (compatible; PetalBot;+https://webmaster.petalsearch.com/site/petalbot)']) {
      const r=await request(ua);assert.equal(r.status,403);assert.equal(r.body,'Forbidden\n');
      assert.equal(r.headers['cache-control'],'private, no-store');assert.equal(r.headers.vary,'User-Agent');
      assert.equal(logs.at(-1).bodyBytes,10);
    }
    assert.equal(routed,0);
    assert.equal((await request('Amazonbot/0.1','HEAD')).body,'');
    for(const ua of ['facebookexternalhit/1.1','Facebot','meta-externalfetcher/1.1','Notmeta-externalagent','OAI-SearchBot/1.4','ChatGPT-User/1.0','NotGPTBot','Mozilla/5.0','Googlebot/2.1','bingbot/2.0','NotPetalBot','NotAmazonbot','']) assert.equal((await request(ua)).status,200);
    assert.equal(routed,13);assert.equal(logs.length,26);
  } finally {server.closeAllConnections();await new Promise(resolve=>server.close(resolve));}
});
