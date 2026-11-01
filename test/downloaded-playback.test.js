'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { downloadKey } = require('../src/shared/download-match');

const server = fs.readFileSync(path.join(__dirname, '../src/server/server.js'), 'utf8');
const renderer = fs.readFileSync(path.join(__dirname, '../src/renderer/app.js'), 'utf8');

test('exact artist and full title resolve the existing hardstyle download', () => {
  const filename = 'V2 - SO PERFECT - HARDSTYLE REMIX (SUPER SLOWED).mp3';
  const key = filename.slice(0, -4).toLowerCase();
  assert.equal(downloadKey('SO PERFECT - HARDSTYLE REMIX (SUPER SLOWED)', 'V2'), key);
  assert.notEqual(downloadKey('SO PERFECT', 'V2'), key);
  assert.notEqual(downloadKey('SO PERFECT - HARDSTYLE REMIX', 'V2'), key);
  assert.notEqual(downloadKey('SO PERFECT - HARDSTYLE REMIX (SUPER SLOWED)', 'Other Artist'), key);
});

test('matches existing filename sanitisation for names and variants', () => {
  assert.equal(downloadKey('Song: Nightcore? [sped up]', 'Artist/Name'), 'artistname - song nightcore [sped up]');
  assert.equal(downloadKey('  Song   (slowed) ', ' ARTIST '), 'artist - song (slowed)');
  assert.equal(downloadKey('a', ''), '');
});

test('online stream handler checks downloaded file before network extraction', () => {
  assert.match(server, /const \[cachedFile, downloadedName\] = await Promise\.all/);
  assert.match(server, /if \(!forShare && downloadedName\)/);
  assert.match(server, /\/api\/downloaded-match/);
  assert.match(server, /\/api\/downloaded-index/);
  assert.ok(!server.includes('sTitle.includes(k)'), 'Fuzzy substring matching must not return other songs');
});

test('playlist and search playback check local downloads before preloaded streams', () => {
  const playStart = renderer.indexOf('async function playTrack(');
  const localCheck = renderer.indexOf('/api/downloaded-match?', playStart);
  const preloaded = renderer.indexOf("if (track._preloadedStreamUrl &&", playStart);
  assert.ok(playStart > 0 && localCheck > playStart && preloaded > localCheck);
  assert.match(renderer, /\.riff-downloaded-tick/);
  assert.match(renderer, /refreshDownloadedTicks\(\)/);
});
