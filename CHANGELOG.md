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
# Changelog
All notable changes to **Farm Friends** will be documented here.  
This project adheres to [Semantic Versioning](https://semver.org/).

---

## [0.4.2-beta] - 2025-08-27
### Added
- **Feed the Animal – Food Images**
  - Introduced real **PNG food images** for all animals.  
  - Images stored in `assets/img/animal-food/`.  
  - Each round now shows 1 correct food + 2 decoy foods.  

### Changed
- **Feed Game UI**
  - Replaced emoji placeholders with **food image + label** cards.  
  - Labels now appear beneath images for better readability.  
  - Updated `.food-choice` CSS with consistent rounded design.  
- **Feedback Messages**
  - Simplified phrasing (“Yum!” / “Not quite!”) with clearer, friendlier tone.

### Removed
- Old `FOOD` object + emoji system no longer used.  
- `.food-emoji` CSS class removed (replaced by `.food-img`).  

---

## [0.4.1-beta] - 2025-08-27
### Added
- **Auto-play sounds**
  - Animal sounds in **Guess the Sound** and **Feed the Animal** now play automatically when the round starts (after first user interaction).  
  - Replay option still available with the **Play Sound** button.
- **Feed entrance animation**
  - Animal walks/waddles in, enlarges, and food choices appear with a smooth transition.
- **Feedback popups**
  - Larger, rounded popups with kid-friendly fonts.
  - **Confetti burst** animation on correct answers 🎉

---

## [0.4.0-beta] - 2025-08-26
### Added
- **Feed the Animal game (prototype)**
  - Basic gameplay loop: select correct food for animal.
  - Integrated into existing repo with routing (`btn-feed`).
- New section `<section id="feed" class="feed">` in `index.html`.

---

## [0.3.0-alpha] - 2025-08-25
### Added
- **Guess the Sound game**
  - Animal sound plays, player chooses from 3 animal tiles.
  - Correct/wrong answers trigger feedback messages.

---

## [0.2.x-alpha] - 2025-08-20
### Changed
- General UI polish: rounded buttons, pastel color scheme, wobble/hover states.
- Modal popups for animal facts.

---

## [0.1.0-alpha] - 2025-08-18
### Added
- Initial build with:
  - Home / Explore (tappable animals).
  - Animal sounds + facts modal.
  - Offline support via Service Worker.
