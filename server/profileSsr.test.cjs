const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const parser = require('@babel/parser');
const traverse = require('@babel/traverse').default;
test('profile rendering uses router location, never a browser-only global', () => {
  const source = fs.readFileSync(require.resolve('../src/containers/ProfilePage/ProfilePage'), 'utf8');
  const ast = parser.parse(source, { sourceType: 'module', plugins: ['jsx'] });
  let references = 0;
  traverse(ast, { ReferencedIdentifier(path) {
    if (path.node.name !== 'location') return;
    references++;
    assert.ok(path.scope.getBinding('location'), 'location must be bound for server rendering');
  } });
  assert.ok(references >= 2);
});
