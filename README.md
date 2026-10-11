# Athevia Website

Public marketing and support website for Athevia — adaptive training for running, cycling and swimming.

## Pages

- `/` — product marketing website
- `/privacy/` — privacy policy for App Store Connect
- `/support/` — public support page for App Store Connect
- `/dashboard/` — internal analytics dashboard shell (demo data only until authenticated analytics access is wired)

## App Store download URL

The live App Store URL is intentionally configured in `docs/assets/site.js` (with an identical copy in `assets/site.js`):

```js
const APP_STORE_URL = "https://apps.apple.com/app/id6814065390";
```

Athevia is live on the App Store. Every download CTA on the site uses this URL automatically. Keep both copies of the file in sync.

## GitHub Pages

This repository publishes the live website from the `docs/` directory on the `main` branch using GitHub Pages.

1. Repository **Settings** → **Pages**
2. Source: **Deploy from a branch**
3. Branch: **main**
4. Folder: **/docs**

Expected site URL:

`https://m-scudder.github.io/athevia-website/`

Privacy URL:

`https://m-scudder.github.io/athevia-website/privacy/`

Support URL:

`https://m-scudder.github.io/athevia-website/support/`

## Custom domain later

A custom domain can be added later without changing the site structure. Good candidates would be `athevia.app`, `athevia.fit`, or another available brand domain.


## Content and screenshots

The homepage uses one autoplay carousel with five selected app screens. Slides advance every five seconds. Dots, keyboard navigation and horizontal swipes remain available, with a Play/Pause control. Autoplay pauses on hover, focus, touch, hidden tabs and when offscreen. Reduced-motion users start with autoplay paused. CSS crop viewports hide only the phone status bar, keeping the app’s bottom navigation visible without altering the original screenshot text or charts. All five screenshots retain the padded frame and show the complete bottom navigation bar.

`docs/` is the publishing source. The root homepage, assets, privacy and support pages mirror it so either Pages source serves a complete site. Keep both copies in sync when editing.

Preview with `python -m http.server 8000 --directory docs`, then open `http://localhost:8000/`.


## Analytics dashboard

The analytics dashboard lives at `/dashboard/` and is mirrored into `docs/dashboard/` for the current GitHub Pages layout.

The current implementation deliberately uses demo data. This repository and GitHub Pages deployment are public, so production analytics must not be exposed until server-side admin authorization is implemented. See [ANALYTICS_DASHBOARD.md](ANALYTICS_DASHBOARD.md) for the provider contract, event policy and Supabase integration plan.
