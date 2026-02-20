# leaflet-heat-vue-repro

Minimal reproduction for a [leaflet.heat](https://github.com/Leaflet/Leaflet.heat) bug: **`Cannot read properties of undefined (reading 'x')`** when the map uses a different Leaflet instance (e.g. **vue-leaflet** with `:use-global-leaflet="false"`).

## Links

- **Repository:** https://github.com/daishu0000/leaflet-heat-vue-repro  
- **Live demo:** https://daishu0000.github.io/leaflet-heat-vue-repro/

## Issue

Full issue text (environment, root cause, steps to reproduce, suggested fix): see [issue_for_leafletheat.md](./issue_for_leafletheat.md).

## Run locally

```bash
npm install
npm run dev
```

Then open the dev server URL (e.g. http://localhost:5173) and check the browser console for the error when the heat layer redraws.

## Stack

- Vue 3 + Vite  
- [@vue-leaflet/vue-leaflet](https://github.com/vue-leaflet/vue-leaflet) with `useGlobalLeaflet: false`  
- leaflet ^1.9.4  
- leaflet.heat ^0.2.0  

## Build & deploy

```bash
npm run build
npm run deploy   # deploys `dist` to GitHub Pages (gh-pages)
```
