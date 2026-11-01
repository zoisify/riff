'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { downloadKey } = require('../src/shared/download-match');
const app = fs.readFileSync(path.join(__dirname, '../src/renderer/app.js'), 'utf8');
const server = fs.readFileSync(path.join(__dirname, '../src/server/server.js'), 'utf8');

test('effect exports use separate filenames and do not replace normal downloads', () => {
  const normal = downloadKey('SO PERFECT - HARDSTYLE REMIX (SUPER SLOWED)', 'V2');
  const nightcore = downloadKey('SO PERFECT - HARDSTYLE REMIX (SUPER SLOWED)', 'V2', 'p_nightcore');
  const slowed = downloadKey('SO PERFECT - HARDSTYLE REMIX (SUPER SLOWED)', 'V2', 'p_slowed');
  assert.notEqual(normal, nightcore);
  assert.notEqual(normal, slowed);
  assert.notEqual(slowed, nightcore);
  assert.equal(downloadKey('Title', 'Artist', 'p_default'), downloadKey('Title', 'Artist'));
});

test('batch download always uses saved preset offline renderer and encoder', () => {
  const start = app.indexOf('if (downloadBatch) {', app.indexOf('el.btnConfirmDownload.addEventListener'));
  const end = app.indexOf('if (!trackToDownload) return;', start);
  const batch = app.slice(start, end);
  assert.match(batch, /t\.playlistAudioPreset\?\.settings/);
  assert.match(batch, /audioEngine\.renderOffline\(originalAudio, settings\)/);
  assert.match(batch, /audioBufferToWav\(processedAudio\)/);
  assert.match(batch, /playlistPreset=\$\{encodeURIComponent/);
  assert.doesNotMatch(batch, /\/api\/download\?/);
  assert.match(server, /parsedUrl\.query\.playlistPreset/);
});

test('playlist-specific file is preferred and effects are not applied twice', () => {
  assert.match(app, /api\/downloaded-match\?artist=\$\{encodeURIComponent\(track\.artist\)\}&title=\$\{encodeURIComponent\(track\.title\)\}&preset=/);
  assert.match(app, /if \(track\.playlistAudioPreset\?\.id && track\.playlistAudioPreset\.id !== 'p_default'\)/);
  assert.match(app, /downloadedTrackKey\(track\)/);
});
