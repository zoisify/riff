'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { firstRunMigration } = require('../src/shared/first-run-migration');
function sandbox(t) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'riffplus-migrate-'));
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  const args = {localAppData:path.join(root,'Local'),roamingAppData:path.join(root,'Roaming'), desktop:path.join(root,'Desktop'),home:root};
  return {args, original:path.join(args.localAppData,'Riff'),plus:path.join(args.localAppData,'RiffPlus'),roaming:path.join(args.roamingAppData,'Riff'),newRoaming:path.join(args.roamingAppData,'Riff+')};
}
function put(file, contents) { fs.mkdirSync(path.dirname(file), { recursive:true }); fs.writeFileSync(file, contents); }
function conf(file) { return JSON.parse(fs.readFileSync(file, 'utf8')); }
test('fresh install imports user data, playlists, saved storage and media without importing credentials', (t) => {
 const x=sandbox(t);
 put(path.join(x.original,'metadata.json'),'{"tracks":2}');
 put(path.join(x.original,'library','song.mp3'),'audio');
 put(path.join(x.original,'tracks','offline.mp3'),'audio');
 put(path.join(x.original,'plugins','theme.js'),'theme');
 put(path.join(x.original,'yt-cookies.txt'),'PRIVATE');
 put(path.join(x.original,'bin','yt-dlp.exe'),'EXE');
 put(path.join(x.original,'config.json'),JSON.stringify({downloadDir:'C:\\Old',theme:'purple', dataDir:'C:\\Riff'}));
 put(path.join(x.roaming,'storage.json'),'{"playlists":[1]}');
 put(path.join(x.roaming,'Network','Cookies'),'SECRET');
 const result=firstRunMigration(x.args);
 assert.equal(result.imported,true);assert.deepEqual(result.errors,[]);
 assert.equal(fs.readFileSync(path.join(x.plus,'library','song.mp3'),'utf8'),'audio');
 assert.equal(fs.readFileSync(path.join(x.plus,'tracks','offline.mp3'),'utf8'),'audio');
 assert.equal(fs.readFileSync(path.join(x.newRoaming,'storage.json'),'utf8'),'{"playlists":[1]}');
 assert.equal(fs.existsSync(path.join(x.plus,'yt-cookies.txt')),false);
 assert.equal(fs.existsSync(path.join(x.plus,'bin','yt-dlp.exe')),false);
 assert.equal(fs.existsSync(path.join(x.newRoaming,'Network','Cookies')),false);
 assert.equal(fs.existsSync(path.join(x.original,'library','song.mp3')),true);
 assert.equal(conf(path.join(x.plus,'config.json')).downloadDir,path.join(x.args.desktop,'Music'));
 assert.equal(conf(path.join(x.plus,'config.json')).theme,'purple');
 assert.equal(conf(path.join(x.plus,'config.json')).dataDir,undefined);
 assert.equal(fs.existsSync(path.join(x.args.desktop,'Music')),true);
});
test('existing Riff+ playlists, library files and download preference are never overwritten', (t)=>{
 const x=sandbox(t); put(path.join(x.original,'metadata.json'),'old');put(path.join(x.roaming,'storage.json'),'old');
 put(path.join(x.plus,'metadata.json'),'new');put(path.join(x.newRoaming,'storage.json'),'new');
 put(path.join(x.plus,'config.json'),JSON.stringify({downloadDir:'D:\\Audio'}));
 firstRunMigration(x.args);
 assert.equal(fs.readFileSync(path.join(x.plus,'metadata.json'),'utf8'),'new');
 assert.equal(fs.readFileSync(path.join(x.newRoaming,'storage.json'),'utf8'),'new');
 assert.equal(conf(path.join(x.plus,'config.json')).downloadDir,'D:\\Audio');
});
test('new user with no original Riff automatically gets Desktop Music, and reruns do nothing', (t)=>{
 const x=sandbox(t);const first=firstRunMigration(x.args);
 assert.equal(first.imported,false); assert.equal(first.errors.length,0);
 const cfg=path.join(x.plus,'config.json');assert.equal(conf(cfg).downloadDir,path.join(x.args.desktop,'Music'));
 put(cfg,JSON.stringify({downloadDir:'D:\\Music'}));
 assert.equal(firstRunMigration(x.args).skipped,'already-migrated');
 assert.equal(conf(cfg).downloadDir,'D:\\Music');
});
test('pre-existing Desktop Music folder and its songs remain untouched', (t)=>{
 const x=sandbox(t);
 const song=path.join(x.args.desktop,'Music','existing-track.mp3');
 const folder=path.join(x.args.desktop,'Music','Albums');
 put(song,'original bytes');
 put(path.join(folder,'album.flac'),'original album');
 put(path.join(x.original,'metadata.json'),'{}');
 const first=firstRunMigration(x.args);
 assert.deepEqual(first.errors,[]);
 assert.equal(conf(path.join(x.plus,'config.json')).downloadDir,path.join(x.args.desktop,'Music'));
 assert.equal(fs.readFileSync(song,'utf8'),'original bytes');
 assert.equal(fs.readFileSync(path.join(folder,'album.flac'),'utf8'),'original album');
 const second=firstRunMigration(x.args);
 assert.equal(second.skipped,'already-migrated');
 assert.equal(fs.readFileSync(song,'utf8'),'original bytes');
});
test('blocked Desktop Music path is reported without touching the existing file', (t)=>{
 const x=sandbox(t);
 const blocker=path.join(x.args.desktop,'Music');
 put(blocker,'not a folder');
 const result=firstRunMigration(x.args);
 assert.ok(result.errors.some(err=>err.startsWith('download-folder:')));
 assert.equal(fs.readFileSync(blocker,'utf8'),'not a folder');
 assert.equal(fs.existsSync(path.join(x.plus,'.riff-plus-import-v1.json')),false);
});
test('symlink to outside source folder is ignored', (t)=>{
 const x=sandbox(t);put(path.join(x.original,'library','safe.mp3'),'ok');
 const external=path.join(x.args.home,'external-secret.txt');put(external,'secret');
 try{fs.symlinkSync(external,path.join(x.original,'library','secret.mp3'),'file')}catch(e){t.diagnostic('Symlink privileges unavailable');return}
 firstRunMigration(x.args);
 assert.equal(fs.existsSync(path.join(x.plus,'library','secret.mp3')),false);
});
