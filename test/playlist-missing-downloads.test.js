'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { downloadKey } = require('../src/shared/download-match');
const app = fs.readFileSync(path.join(__dirname, '../src/renderer/app.js'), 'utf8');
const server = fs.readFileSync(path.join(__dirname, '../src/server/server.js'), 'utf8');

test('six playlist entries with five downloaded files yield a single missing download', () => {
  const playlist = Array.from({length:6}, (_,i) => ({ artist:'Artist', title:`Track ${i+1}`, platform:'youtube' }));
  const downloaded = new Set(playlist.slice(0,5).map(t=>downloadKey(t.title,t.artist)));
  const missing = playlist.filter(t => !downloaded.has(downloadKey(t.title,t.artist)));
  assert.deepEqual(missing.map(t=>t.title), ['Track 6']);
});

test('download modal and confirmation both filter against the verified download index', () => {
  assert.match(app, /const missing = tracks\.filter\(t => !downloaded\.has\(downloadedTrackKey\(t\)\)\)/);
  assert.match(app, /downloadBatch = \{ name: playlist\.name \|\| 'Playlist', tracks: missing \}/);
  assert.match(app, /const tracks = downloadBatch\.tracks\.filter\(t => !downloaded\.has\(downloadedTrackKey\(t\)\)\)/);
  assert.match(app, /loadDownloadedKeys\(true\)/);
});

test('download status refreshes disk and excludes empty audio artifacts', () => {
  assert.match(server, /parsedUrl\.query\.refresh === '1'/);
  assert.match(server, /stat\.size === 0/);
});
