'use strict';

// Deliberately runs before the main process imports shared/platform or starts Chromium.
// Never deletes source files, follows symlinks, copies saved sessions or overwrites data.
const fs = require('fs');
const path = require('path');
const os = require('os');

const LOCAL_FILES = ['metadata.json', 'library.json'];
const LOCAL_DIRS = ['library', 'plugins', 'custom-lyrics', 'lyrics', 'thumbnails', 'i18n', 'tracks'];
const ROAMING_FILES = ['storage.json', 'window-state.json'];
const ROAMING_DIRS = ['local-covers'];
const MARKER = '.riff-plus-import-v1.json';

function isRealDirectory(dir) {
  try { const st = fs.lstatSync(dir); return st.isDirectory() && !st.isSymbolicLink(); }
  catch (_) { return false; }
}
function isRealFile(file) {
  try { const st = fs.lstatSync(file); return st.isFile() && !st.isSymbolicLink(); }
  catch (_) { return false; }
}
function copyFileMissing(src, dest, log) {
  if (!isRealFile(src) || fs.existsSync(dest)) return;
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  try { fs.copyFileSync(src, dest, fs.constants.COPYFILE_EXCL); log.push(dest); }
  catch (e) { if (e.code !== 'EEXIST') throw e; }
}
function copyTreeMissing(src, dest, log) {
  if (!isRealDirectory(src)) return;
  fs.mkdirSync(dest, { recursive: true });
  for (const item of fs.readdirSync(src, { withFileTypes: true })) {
    if (item.isSymbolicLink()) continue;
    if (item.isDirectory()) copyTreeMissing(path.join(src, item.name), path.join(dest, item.name), log);
    else if (item.isFile()) copyFileMissing(path.join(src, item.name), path.join(dest, item.name), log);
  }
}
function copyAllowlist(src, dest, files, dirs, log) {
  if (!isRealDirectory(src)) return;
  for (const file of files) copyFileMissing(path.join(src, file), path.join(dest, file), log);
  for (const dir of dirs) copyTreeMissing(path.join(src, dir), path.join(dest, dir), log);
}
function readJSON(file) {
  try { const obj = JSON.parse(fs.readFileSync(file, 'utf8')); return obj && typeof obj === 'object' && !Array.isArray(obj) ? obj : {}; }
  catch (_) { return {}; }
}
function isRealConfigFile(file) { return isRealFile(file) && path.extname(file) === '.json'; }
function firstRunMigration({ localAppData, roamingAppData, desktop, home } = {}) {
  if (process.platform !== 'win32' && !localAppData) return { skipped: 'not-windows' };
  home = home || os.homedir();
  localAppData = localAppData || process.env.LOCALAPPDATA || path.join(home, 'AppData', 'Local');
  roamingAppData = roamingAppData || process.env.APPDATA || path.join(home, 'AppData', 'Roaming');
  desktop = desktop || path.join(home, 'Desktop');
  const oldLocal = path.join(localAppData, 'Riff');
  const newLocal = path.join(localAppData, 'RiffPlus');
  const oldRoaming = path.join(roamingAppData, 'Riff');
  const newRoaming = path.join(roamingAppData, 'Riff+');
  const marker = path.join(newLocal, MARKER);
  // Do not trigger on subsequent launches: users may intentionally alter their data.
  if (fs.existsSync(marker)) return { skipped: 'already-migrated' };
  const copied = [];
  const errors = [];
  let imported = false;
  if (isRealDirectory(oldLocal) || isRealDirectory(oldRoaming)) {
    try { copyAllowlist(oldLocal, newLocal, LOCAL_FILES, LOCAL_DIRS, copied); }
    catch (e) { errors.push('local: ' + e.message); }
    try { copyAllowlist(oldRoaming, newRoaming, ROAMING_FILES, ROAMING_DIRS, copied); }
    catch (e) { errors.push('roaming: ' + e.message); }
    imported = copied.length > 0;
  }
  // Downloads preference: new installations always get Desktop/Music, but never
  // replace an existing explicit Riff+ download directory.
  const cfgPath = path.join(newLocal, 'config.json');
  const config = isRealConfigFile(cfgPath) ? readJSON(cfgPath) : {};
  if (!config.downloadDir) {
    const musicDir = path.join(desktop, 'Music');
    try {
      fs.mkdirSync(musicDir, { recursive: true });
      // Honor other saved preferences, but do not carry over the old dataDir.
      let oldCfg = readJSON(path.join(oldLocal, 'config.json'));
      for (const [key, value] of Object.entries(oldCfg)) {
        if (key !== 'dataDir' && key !== 'downloadDir' && !Object.prototype.hasOwnProperty.call(config, key)) config[key] = value;
      }
      config.downloadDir = musicDir;
      fs.mkdirSync(newLocal, { recursive: true });
      fs.writeFileSync(cfgPath, JSON.stringify(config, null, 2), { flag: isRealFile(cfgPath) ? 'w' : 'wx' });
    } catch (e) { errors.push('download-folder: ' + e.message); }
  }
  // If any copy failed, leave no marker so the next launch can retry missing files.
  if (!errors.length) {
    try { fs.mkdirSync(newLocal, { recursive: true }); fs.writeFileSync(marker, JSON.stringify({ imported, copiedCount: copied.length, at: new Date().toISOString(), note: 'Original Riff user data retained. No cookies, sessions or executables copied.' }, null, 2), { flag: 'wx' }); }
    catch (e) { if (e.code !== 'EEXIST') errors.push('marker: ' + e.message); }
  }
  return { imported, copiedCount: copied.length, errors };
}
module.exports = { firstRunMigration };
