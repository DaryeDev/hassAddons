# Changelog

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