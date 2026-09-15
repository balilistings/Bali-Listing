const test = require('node:test');
const assert = require('node:assert/strict');
const http = require('node:http');
const express = require('express');
const compression = require('compression');
const traffic = require('./requestTraffic');

test('real HTTP responses retain behavior and count encoded bytes without sensitive fields', async () => {
  const logs = [];
  const app = express();
  app.use(traffic({render: true, emit: line => logs.push(JSON.parse(line))}));
  app.use(compression());
  app.get('/empty', (req,res) => res.status(204).end());
  app.get('/stream', (req,res) => {res.write('hello'); res.end('world');});
  app.use((req,res) => res.type('text').send('hello world '.repeat(1000)));
  const server = app.listen(0, '127.0.0.1');
  await new Promise(resolve => server.once('listening',resolve));
  const request = (path, method='GET', extra={}) => new Promise((resolve,reject) => {
    http.get({host:'127.0.0.1',port:server.address().port,path,method,headers:{'accept-encoding':'gzip','x-forwarded-for':'198.51.100.23, 192.0.2.1',cookie:'secret-cookie',authorization:'Bearer secret-token',...extra}},res=>{
      const chunks=[]; res.on('data',c=>chunks.push(c));res.on('end',()=>resolve({status:res.statusCode,bytes:Buffer.concat(chunks).length}));
    }).on('error',reject);
  });
  try {
    for(const [path,method] of [['/page?token=private-query','GET'],['/page','HEAD'],['/empty','GET'],['/stream','GET'],['/password-reset/private-path-token','GET']]) {
      const response=await request(path,method);
      await new Promise(resolve=>setImmediate(resolve));
      const entry=logs.at(-1);
      assert.equal(entry.bodyBytes,response.bytes);
      assert.equal(entry.status,response.status);
      assert.equal(entry.ip,'198.51.100.23');
      assert.equal(entry.completed,true);
    }
    assert.equal(logs.length,5);
    assert.equal(logs[0].encoding,'gzip');
    assert(logs[0].bodyBytes < 12000);
    assert.equal(logs[1].bodyBytes,0);
    assert.equal(logs[2].bodyBytes,0);
    assert.equal(logs[3].bodyBytes,10);
    assert(!JSON.stringify(logs).match(/secret-cookie|secret-token|private-query|private-path-token/));
    await request('/test','GET',{'x-forwarded-for':'invalid','user-agent':'a'.repeat(1000)});
    assert.equal(logs.at(-1).ipSource,'socket');
    assert.equal(logs.at(-1).userAgent.length,256);
  } finally {server.closeAllConnections();await new Promise(resolve=>server.close(resolve));}
});
