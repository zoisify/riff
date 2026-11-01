'use strict';

// Never substitute an original for a nightcore/slowed/hardstyle version.
function downloadKey(title, artist, presetId = '') {
  if (!String(title || '').trim() || !String(artist || '').trim()) return '';
  const clean = s => String(s).replace(/[<>:"/\\|?*]/g, '').replace(/\s+/g, ' ').trim().toLowerCase();
  const suffix = presetId && presetId !== 'p_default' ? ` [Riff preset ${String(presetId).replace(/[^a-zA-Z0-9_-]/g, '')}]` : '';
  return `${clean(artist)} - ${clean(title + suffix)}`;
}
module.exports = { downloadKey };
