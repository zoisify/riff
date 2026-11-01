# Riff+ 44.0.0-plus.4 — Windows x64

**Unofficial community fork** of [Riff by rootscripts](https://github.com/rootscripts/riff), distributed under the existing MIT licence. Not affiliated with or endorsed by the original author.

## Improvements since plus.3

- **Playlist sound presets:** choose a separate preset for every playlist entry (Nightcore, Speed up, Slowed + reverb, Distortion, or custom presets). Saved settings are applied automatically when the entry is played.
- **Local-first playback:** when a song has a matching completed download, play the local audio instead of an online stream. A larger, high-contrast downloaded checkmark appears beside the track.
- **Smarter Download All:** count and download only missing tracks; recheck the download folder before starting.
- **Preset-aware playlist exports:** batch exports apply each saved playlist audio preset to the exported audio file; normal and preset-processed versions are stored separately to avoid overwriting originals and unintended double effects.
- Retains YouTube playback/reliability improvements, search matching, and separate Riff+ branding from earlier releases.

## First install

Riff+ can import available data from an existing Riff installation without deleting the original data, replacing existing Riff+ files, or automatically uninstalling Riff. New installations default downloads to the Desktop/Music folder, and an existing Desktop/Music folder is preserved. This version does **not** install or configure Flacbox, iPhone sync or other personal automations. Login sessions and cookies are not imported.

Download **Setup.exe** to install or **Portable.exe** to run without an installer. Neither includes the developer's playlists, music, login credentials or personal settings. Both use a distinct Riff+ identity from upstream Riff.

These unsigned community builds may trigger Windows SmartScreen. Inspect the published source and SHA256SUMS.txt checksums before installing. Do not disable system security protections globally.