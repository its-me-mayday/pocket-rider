# Pocket Rider

Mobile-first MVP of a delivery rider game inspired by Chill Rider.

## MVP-0

- Single portrait game screen.
- Touch D-pad for phone play.
- Keyboard arrows/WASD for desktop testing.
- Shop pickup, house delivery, coins, move counter.
- PWA manifest and service worker for deploy/install experiments.

## Run locally

```sh
npm install
npm run dev
```

Open `http://localhost:5173/` on this computer.

To test on a phone, keep the dev server running and open the `Network` URL printed by Vite from a phone on the same Wi-Fi.

## Build

```sh
npm run build
```

The production app is generated in `dist/`.

## Deploy

This can deploy as a static site on Vercel, Netlify, Cloudflare Pages, or GitHub Pages. Use:

- Build command: `npm run build`
- Output directory: `dist`

After deploy, open the public URL from a phone. The app has the baseline PWA files needed for install/offline experiments.
