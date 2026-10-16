# Changelog

All notable changes to this project are documented in this file.
The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and this project follows [Semantic Versioning](https://semver.org/).

## [0.1.0] - 2026-10-16

### Added

- Claude-style 3-line mascot above the prompt, right-aligned, in a fixed 10-cell column.
- Compact 5-hour limit remaining and time to reset (e.g. `93%/4h51m`) under the mascot.
- Click the number to toggle details: 5-hour limit with bar, weekly limit, context usage (labels in Japanese).
- Mood colors from the theme: normal under 60%, warning from 60%, error with half-closed eyes from 85%.
- Draws nothing when the pane is narrower than 10 cells, before the first measurement, or while a survey is shown.
- Tests for yielding cleanly at narrow widths before a measurement.
