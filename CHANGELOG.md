# Changelog

All notable changes to this integration are documented in this file. The format
follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/) and the project
uses [semantic versioning](https://semver.org/).

Describe each change under `## [Unreleased]` as you make it. The Release
workflow moves that section under the version it ships, and the section becomes
the notes of the version's GitHub Release.

## [Unreleased]

## [1.0.1] - 2026-10-22

### Security

- Rebuilt on Node.js 24.22.1, the October 2026 security release (remote code
  execution in the Brotli decoder, CVE-2026-111497; TLS hostname and DNS
  fixes).

## [1.0.0] - 2026-10-20

### Added

- The Hebrew calendar of the house, computed locally with `@hebcal/core` (the engine of hebcal.com): no
  account, no network.
- A "Hebrew calendar" device: Hebrew date (changes at sunset), holiday of the day, Shabbat or holiday now
  and tomorrow, next candle lighting, next havdalah, weekly Torah portion, Omer count, days until the next
  holiday.
- Scene triggers: candle lighting (at the time or 10, 15, 30 minutes, 1 or 2 hours before), Shabbat or
  holiday begins, Shabbat or holiday ends.
- Scene action "Day information" for today or tomorrow, and a "Hebrew calendar" dashboard widget with the
  zmanim of the day.
- Settings: Israel or diaspora, candle lighting minutes, end of Shabbat (8.5° or 42, 50, 72 minutes),
  names in the local language, transliterated or in Hebrew script; texts in English, French, German and
  Spanish.

[Unreleased]: https://github.com/guim31/gladys-hebcal/compare/v1.0.1...HEAD
[1.0.1]: https://github.com/guim31/gladys-hebcal/compare/v1.0.0...v1.0.1
[1.0.0]: https://github.com/guim31/gladys-hebcal/releases/tag/v1.0.0
