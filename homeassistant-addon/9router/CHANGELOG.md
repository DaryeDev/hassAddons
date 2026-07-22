# Changelog

## 1.0.9

Rewrote the Ingress proxy from scratch after root-causing why previous
patches kept missing routes.

- 9Router (prebuilt Next.js image) has no basePath/subpath support at all —
  Next.js inlines basePath at build time, so no runtime config can fix this
  upstream without recompiling the app with a hardcoded, dynamic-per-install
  Ingress token, which isn't feasible.
- Stopped text-rewriting JS bundles under `/_next/` (previous literal
  `sub_filter` allowlist only covered routes we'd already hit a 404 on, and
  broader literal matches risked corrupting unrelated JSON/string data).
  Static assets are now proxied byte-for-byte, gzip preserved.
- `ingress-bootstrap.js` now patches every browser API that can originate a
  request or navigation at runtime instead: `history.pushState/replaceState`,
  `location.assign/replace`, `fetch`, `XMLHttpRequest`, `EventSource` (SSE:
  usage/stream, translator console logs) and `WebSocket` (MITM tooling).
  This is more robust than rewriting bundle text because it intercepts the
  resulting network call regardless of how the URL was built inside the
  bundle.
- nginx now only rewrites HTML attributes (`href`/`src`/`action`/`content`)
  and CSS `url()` references — both are unambiguous resource references,
  safe to rewrite without risking data corruption.
- Added `X-Ingress-Path`-aware SSE handling (`proxy_buffering off`, longer
  read timeout) so usage/stream and console-log streams don't appear to hang.

## 1.0.8

- Fix navigation 404: intercept pushState/assign/clicks so /dashboard/* stays under Ingress path

## 1.0.7

- Fix Ingress navigation 404: patch Next.js client routing (history/fetch) for subpath

## 1.0.6

- Fix login EACCES: chown /data for node user and stop rewriting API JSON responses

## 1.0.5

- Fix Ingress assets 404: disable upstream gzip so nginx can rewrite Next.js paths

## 1.0.4

- Fix Ingress panel: add nginx proxy with URL rewriting for Next.js dashboard

## 1.0.3

- Added 9Router Dashboard as Panel and WebUI