# Riff+ — unofficial Windows build

**Based on [Riff](https://github.com/rootscripts/riff) 44.0.0** by rootscripts. The original project is licensed under MIT; see [LICENSE](LICENSE). This fork is **not affiliated with, endorsed by, or maintained by** the upstream author.

## Download

Open [Releases](https://github.com/zoisify/riff/releases) and select the latest **Riff+** release. Use the Windows x64 installer for normal installation, or the portable executable for a no-install option. Do not download executables from unverified mirror links. A SHA-256 checksum file accompanies published Windows assets.

**Windows warning:** Community installers may be unsigned, so Microsoft SmartScreen may show an unrecognised app warning. Review the [source](https://github.com/zoisify/riff/tree/main), compare the supplied SHA-256 checksum and decide whether you trust the publisher before running it. Never disable system security globally.

## What changed

- Fixed strong song-title searches, including when the uploader differs from the artist.
- Preserved named edits such as slowed + reverb, nightcore and hardstyle instead of treating them as duplicates or substituting the unedited recording.
- Fixed an artist parser that cut the name **Daft Punk** at the letters `ft`.
- Prioritised playable YouTube streams verified by requesting audio instead of accepting stream URLs that may return HTTP 403.
- Improved background stream prefetching and how incomplete or parallel-access YouTube cookie files are handled.

See the tests under [test/](test/) and the commit history for implementation details. The fixes are based on upstream `main` as of 30 October 2026, not a copy of anybody's installed app or user profile.

## Compatibility and safety

- **Independent installation**: it has its own app ID, display name, Start Menu shortcut and default data/config directory (`%LOCALAPPDATA%\RiffPlus` on Windows). It should not overwrite the official Riff installation or reuse its cookies or saved music.
- **Original author credited:** see [LICENSE](LICENSE). The design, most assets and much of the source code remain upstream work.
- **Not guaranteed:** YouTube can change extraction behaviour; age-restricted media and other platforms were not exhaustively verified. No high-GPU-use fix is claimed.
- **Release cadence:** updates are community-maintained; check the fork's releases page for newer builds.

## Build from source (Windows x64)

Requires Node.js 24 and npm. From the checked-out repository:

```powershell
npm ci
npm test
npx electron-builder --win nsis portable --publish never
```

Outputs appear in `dist`. No private cookies, user configuration or downloaded music files are included.

## Reporting issues

Please report fork-specific issues on [this fork's issue tracker](https://github.com/zoisify/riff/issues), with application version, selected source (YouTube versus YouTube Music), reproduction steps and sanitised logs. **Never post cookies or account tokens.**
