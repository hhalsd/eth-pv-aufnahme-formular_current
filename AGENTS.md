# AGENTS.md

## Purpose

This repository contains a static, offline-capable PWA for on-site PV intake. The app runs entirely in the browser, persists drafts in `localStorage`, and exports one JSON record per intake.

## Project Shape

- `index.html`: complete form markup and all visible UX text.
- `styles/main.css`: all styling and responsive layout rules.
- `scripts/app.js`: client-side logic for draft storage, preview, export, CSV import, GPS lookup, and PWA registration.
- `manifest.webmanifest`: install metadata and icon declarations.
- `sw.js`: service worker cache list and offline behavior.
- `deploy_github_pages.sh`: GitHub Pages deployment script.
- `deploy_termux_github_pages.sh`: same deployment flow, named for Termux usage.
- `assets/` and `icons/`: branding and PWA icons.

There is no build step, package manager, backend, or test framework in this repo. Treat it as a plain static web app.

## Working Rules

- Read the affected HTML, CSS, JS, manifest, and service worker before changing behavior.
- Keep changes small and reviewable. Avoid refactors unless required by the task.
- Preserve the current no-build setup. Do not add frameworks, bundlers, or dependencies unless explicitly requested.
- Keep all user-facing text, field labels, export semantics, and deployment instructions aligned with the actual code.
- Use UTF-8 text and avoid reintroducing mojibake in German copy.

## Data And Compatibility

- Drafts are stored in browser `localStorage` under keys defined in `scripts/app.js`.
- Export shape is created in `collectData()` in `scripts/app.js`.
- If the exported JSON schema changes, update all relevant version markers together:
  - `APP_VERSION` in `scripts/app.js`
  - `schema.version` in exported data
  - `DRAFT_KEY` and/or `RECORDS_KEY` if old stored data should not be reused
  - `README.md` documentation for export format and behavior
- Do not change field names lightly. They are the contract for downstream JSON consumers.

## Offline And PWA Rules

- Any change to cached assets or offline loading expectations must be reflected in `sw.js`.
- When cached asset contents or cache behavior changes, bump `CACHE_NAME` in `sw.js`.
- When install metadata or icons change, update `manifest.webmanifest` and verify referenced files exist.
- When app behavior materially changes, consider bumping `APP_VERSION` in `scripts/app.js`.

## Network And Privacy Notes

- The app is local-first. There is no backend upload in the current implementation.
- Network access is only needed for:
  - loading the hosted static site
  - optional reverse geocoding via OpenStreetMap Nominatim during GPS address lookup
- Keep privacy statements in `README.md` accurate if network behavior changes.

## Deployment Notes

- GitHub Pages deployment is handled by the provided shell scripts.
- Both deployment scripts are currently functionally identical. If one changes, keep the other aligned unless the repo is intentionally being simplified.
- `.nojekyll` is part of the published static site setup and should remain unless deployment strategy changes.

## Verification Expectations

After non-trivial changes, verify as much as applies:

- open the app through a local static server, not directly as a `file://` URL
- confirm form entry still autosaves locally
- confirm JSON preview updates
- confirm JSON export still downloads a valid file
- confirm service worker registration still succeeds
- if GPS or manifest/service-worker files changed, verify those flows specifically

If a check cannot be run locally, state exactly what was not verified.
