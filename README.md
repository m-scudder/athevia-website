# Athevia Website

Public marketing and support website for Athevia — adaptive training for running, cycling and swimming.

## Pages

- `/` — product marketing website
- `/privacy/` — privacy policy for App Store Connect
- `/support/` — public support page for App Store Connect

## App Store download URL

The live App Store URL is intentionally centralized in `assets/site.js`:

```js
const APP_STORE_URL = "";
```

Once Apple creates Athevia's public App Store URL, replace the empty string with the URL. Every download CTA on the site updates automatically.

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
