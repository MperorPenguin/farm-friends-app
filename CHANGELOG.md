# Farm Friends — Changelog

All notable changes to this project will be documented here.  
This file follows [Keep a Changelog](https://keepachangelog.com/en/1.0.0/) style.  
Versions use **Semantic Versioning** (MAJOR.MINOR.PATCH).

---

## [0.2.0-alpha] – 2025-08-26
### Added
- 🎨 New **Landing / Start Menu** with fun, pastel menu cards:
  - Animal Sounds & Facts
  - Guess the Sound! (renamed from “Guess the Animal by its Sound”)
  - Story Time (coming soon placeholder)
  - Find the Animal (coming soon placeholder)
  - Feed the Animal (coming soon placeholder)
- 🐄 **Explore mode**:
  - Animal tiles now have wobble on hover, stronger selected hue, and spark burst effect.
  - Tapping a tile opens a **big modal info card** with image, facts, and sound button.
- 🐥 **Guess the Sound! game**:
  - Randomised 3-choice guessing rounds.
  - Automatic sound prompt playback.
  - Visual feedback for correct/incorrect.
- 🔊 **Exclusive audio playback**:
  - Smooth cross-fade between animal sounds.
  - Stops previous audio if new animal is tapped quickly.
- 📱 **Responsiveness**:
  - Works on phones & tablets, portrait and landscape.
  - Larger buttons and modal close icon for toddler use.
- 📦 **Service worker v6**:
  - Offline caching updated for new assets.
- 🛠️ Convenience scripts:
  - `start_server.bat` (Windows) and `start_server.sh` (Mac/Linux) for local testing.

### Removed
- ❌ Old header bar with Explore/Match/Mute buttons.
- ❌ Redundant footer info panel.

---

## [0.1.0-alpha] – 2025-08-25
### Added
- First working prototype with:
  - 8 animals (cow, pig, chicken, duck, sheep, goat, horse, donkey).
  - Explore mode with 4×4 grid of tappable animal tiles.
  - Simple modal card with basic animal info.
  - Service worker with offline caching (v4).
- Basic styling, hover wobble, and responsive grid.
- Audio preload and play on tap.

---
