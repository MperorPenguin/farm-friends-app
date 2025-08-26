# Farm Friends (Toddler Web App)

A toddler-friendly interactive farm with animal sounds and a simple matching game.
Works on phone, tablet, and desktop. PWA-enabled for offline use. No ads, no accounts.

## How to run locally
1. Put your animal images into `assets/img/` (e.g., `cow.png`) and sounds into `assets/audio/` (e.g., `cow.mp3`).
2. Open `index.html` in a modern browser for a quick test.
   - For full PWA/offline support, serve the folder via a local server (e.g., VS Code Live Server, `python3 -m http.server`, etc.).
3. Tap an animal to hear its sound (Explore). Try the matching game (Match).

## Deploy for free
- Push this folder to a GitHub repo and enable **GitHub Pages** (deploy from `main` root). 
- The app will be live and installable on phones (Add to Home Screen).

## Add your app icon (optional but recommended)
- Replace `assets/icons/icon-192.png` and `icon-512.png` with your own PNG icons.
- Update `manifest.webmanifest` if you change paths or sizes.

## Notes
- Mobile browsers require a user gesture before playing audio. The app handles this automatically (tap any element once to unlock).
- All sounds/images should be child-friendly (clear, not too loud). Consider CC0/royalty-free sources.
- You can extend animals via `animals.js` (add objects to the `ANIMALS` array).
