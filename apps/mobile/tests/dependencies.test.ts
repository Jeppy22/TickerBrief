import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { test } from 'node:test';

const require = createRequire(import.meta.url);
test('patched query-string keeps the Router CommonJS API and handles malformed input', () => {
  const query = require('query-string');
  assert.equal(query.parse('company=Apple%20Inc.&ticker=AAPL').company, 'Apple Inc.');
  assert.equal(
    query.stringify({ ticker: 'BRK.B', period: 'annual' }),
    'period=annual&ticker=BRK.B',
  );
  assert.equal(typeof query.parse('q=%E0%A4%A').q, 'string');
  const start = performance.now();
  query.parse(`q=${'%FE%FF'.repeat(1000)}`);
  assert.ok(performance.now() - start < 1000, 'Malformed URI decoding should remain bounded');
});
test('patched xcode uuid dependency preserves native-project ID generation', () => {
  const xcode = require('xcode');
  const project = xcode.project('not-written.pbxproj');
  project.hash = { project: { objects: {} } };
  const first = project.generateUuid();
  assert.match(first, /^[A-F0-9]{24}$/);
  assert.notEqual(project.generateUuid(), first);
});
