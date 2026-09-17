const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const parser = require('@babel/parser');
const traverse = require('@babel/traverse').default;
const generate = require('@babel/generator').default;

// Exercise the actual component handler without mounting the map/payment UI.
const source = fs.readFileSync(require.resolve('../src/components/OrderPanel/OrderPanel.js'), 'utf8');
const ast = parser.parse(source, { sourceType: 'module', plugins: ['jsx'] });
let handler;
traverse(ast, { VariableDeclarator(path) {
  if (path.node.id.name === 'handleWhatsappClick') handler = generate(path.node.init).code;
} });
for (const favorite of [true, false]) {
  test(`rapid contact clicks produce one request/event (favorite=${favorite})`, async () => {
    let finish;
    const pending = new Promise(resolve => { finish = resolve; });
    const events = []; let requests = 0; let opens = 0;
    const context = {
      contactInProgress: { current: false }, setContacting() {},
      currentUser: { attributes: { email: 'never-send@example.test' } },
      listing: { id: { uuid: 'listing' }, attributes: { title: 'Villa' } },
      author: { id: { uuid: 'owner' } }, isFavorite: () => favorite,
      phonenumber: '123456789', history: {}, location: {}, routes: [],
      handleToggleFavorites: () => () => {}, dispatch() {}, updateProfile() {},
      createShortUrl: () => { requests++; return pending; },
      setTimeout: callback => callback(), encodeURIComponent,
      window: { location: { href: 'https://balilistings.com/l/listing', protocol:'https:', host:'balilistings.com' },
        open() { opens++; }, gtag(...args) { events.push(args); } },
    };
    const click = vm.runInNewContext(`(${handler})`, context);
    await click(); await click();
    assert.equal(requests, 1);
    finish({ shortUrl:'https://balilistings.com/sh/test' });
    await new Promise(resolve => setImmediate(resolve));
    assert.equal(opens, 1); assert.equal(events.length, 1);
    assert.equal(events[0][1], 'click_contact_owner');
    assert.equal(events[0][2].contact_method, 'whatsapp');
    assert.equal(JSON.stringify(events).includes('never-send'), false);
    assert.equal(context.contactInProgress.current, false);
  });
}
