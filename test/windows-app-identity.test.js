'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const pkg = require(path.join(root, 'package.json'));
const main = fs.readFileSync(path.join(root, 'src/main/main.js'), 'utf8');
const launcher = fs.readFileSync(path.join(root, 'src/main/launcher.js'), 'utf8');

test('Windows app, NSIS package and launcher use one distinct Riff+ AppUserModelID', () => {
  const appId = pkg.build.appId;
  assert.equal(appId, 'io.github.zoisify.riffplus');
  assert.notEqual(appId, 'io.github.rootscripts.riff');
  assert.match(main, /app\.setAppUserModelId\(APP_ID\)/);
  assert.ok(main.includes(`const APP_ID = '${appId}';`));
  assert.ok(launcher.includes(`const APP_ID = '${appId}';`));
});
