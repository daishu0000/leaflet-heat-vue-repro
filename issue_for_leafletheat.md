# Bug: `Cannot read properties of undefined (reading 'x')` when map uses a different Leaflet instance

## Environment

- **leaflet**: ^1.9.4  
- **leaflet.heat**: ^0.2.0  
- **Vue 3** + **@vue-leaflet/vue-leaflet** with `:use-global-leaflet="false"` (recommended for SSR/tree-shaking)

## Summary

When the map is created by a **different Leaflet instance** than the one leaflet.heat uses (e.g. vue-leaflet with `useGlobalLeaflet: false` bundles its own Leaflet), calling `L.heatLayer(...).addTo(map)` leads to:

```text
Cannot read properties of undefined (reading 'x')
```

in `_redraw` → `bounds.contains(p)`.

## Root cause

1. **Two Leaflet instances**
   - **Instance A**: used by the map (e.g. vue-leaflet’s internal Leaflet).
   - **Instance B**: the `L` we set on `window` and use to load leaflet.heat and call `L.heatLayer(...)`.

2. In **HeatLayer.js** `_redraw` (around lines 126–146):
   - `bounds` is built with **Instance B’s** `L.Bounds` and `L.point`.
   - `p = this._map.latLngToContainerPoint(...)` returns a **Point from Instance A** (because the map is from Instance A).
   - `bounds.contains(p)` is **Instance B’s** `Bounds.contains(p)`.

3. In **Leaflet’s Bounds.contains** (e.g. `leaflet/src/geometry/Bounds.js`):
   - The branch is chosen by `obj instanceof Point` (Point from **Instance B**).
   - **Instance A’s** Point is not `instanceof` Instance B’s Point, so the code treats `obj` as bounds and does `obj = toBounds(obj)`.
   - `toBounds(Point from A)` in Instance B builds a `Bounds` by iterating with `points.length`; a Point has no `length`, so the loop never runs and the Bounds ends up with **`min` / `max` undefined**.
   - Then `contains` does `min = obj.min` (undefined) and accesses **`min.x`** → **"Cannot read properties of undefined (reading 'x')"**.

So the failure is a **cross-instance** issue: heat uses one Leaflet, the map (and thus `latLngToContainerPoint`) uses another; `instanceof Point` and `toBounds` assume a single Leaflet world.

## Steps to reproduce

1. Vue 3 app with vue-leaflet and `:use-global-leaflet="false"`.
2. In the component: `import L from 'leaflet'`, set `window.L = L`, then `await import('leaflet.heat')`.
3. Get the map instance from vue-leaflet (its internal Leaflet).
4. Run: `L.heatLayer(latlngs, { radius: 25, blur: 15 }).addTo(map)`.
5. Open the browser console → the error appears when the heat layer redraws.

**Repro repository & live demo:**

- **Repository:** https://github.com/daishu0000/leaflet-heat-vue-repro  
- **Live demo:** https://daishu0000.github.io/leaflet-heat-vue-repro/

Minimal repro (Vue 3 + Vite):

```vue
<template>
  <l-map
    ref="mapRef"
    :zoom="5"
    :center="[35, 110]"
    :use-global-leaflet="false"
    @ready="onMapReady"
  >
    <l-tile-layer
      url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      layer-type="base"
      attribution="&copy; OpenStreetMap"
    />
  </l-map>
</template>

<script setup>
import { ref } from 'vue'
import { LMap, LTileLayer } from '@vue-leaflet/vue-leaflet'
import L from 'leaflet'

const mapRef = ref(null)

async function onMapReady(mapInstance) {
  const map = mapInstance ?? mapRef.value?.leafletObject?.value ?? mapRef.value?.leafletObject
  if (!map) return

  if (typeof window !== 'undefined') window.L = L
  await import('leaflet.heat')

  const heatData = [
    [30, 120, 1], [31, 121, 2], [32, 122, 3],
    [35, 110, 2], [36, 115, 1],
  ]

  L.heatLayer(heatData, { radius: 25, blur: 15 }).addTo(map)
}
</script>
```

## Suggested direction for a fix

Make heat layer robust when the map’s Leaflet is a different instance:

- **Option A**: In `_redraw`, normalize the container point so it’s a “plain” point before calling `bounds.contains(p)` (e.g. use `p.x` / `p.y` to build a point in the same `L` heat uses, or use a duck-typing check like `'x' in p && 'y' in p` and then compare coordinates instead of relying on `Bounds.contains` and `instanceof Point`).
- **Option B**: Use the **map’s** `L` (e.g. from `this._map` or from the map’s constructor) for creating `Bounds` and for `contains`, so that `latLngToContainerPoint` and `bounds.contains` share the same Leaflet instance. That might require leaflet.heat to accept an explicit `L` or to detect it from the map.

I can open a PR toward Option A (normalizing the point before `contains`) if that aligns with the maintainers’ preference.

## Expected behavior

When the map comes from another Leaflet instance (e.g. vue-leaflet with `useGlobalLeaflet: false`), the heat layer should still redraw without throwing; either by normalizing points by coordinates or by using the map’s Leaflet for bounds/point checks.
