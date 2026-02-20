<template>
  <div id="app">
    <div class="note">
      Repro: Vue 3 + vue-leaflet with
      <code>:use-global-leaflet="false"</code> (recommended for SSR/tree-shaking) + leaflet.heat.
      Open the browser console to see the error: Cannot read properties of undefined (reading 'x').
    </div>
    <div class="map-wrap">
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
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { LMap, LTileLayer } from '@vue-leaflet/vue-leaflet'
// Same as vue-leaflet recommendation: import L in component for plugins
import L from 'leaflet'

const mapRef = ref(null)
let heatLayer = null

async function onMapReady(mapInstance) {
  const map = mapInstance ?? mapRef.value?.leafletObject?.value ?? mapRef.value?.leafletObject
  if (!map) return

  // leaflet.heat expects global L; set on window then load (same as main project usage)
  if (typeof window !== 'undefined') window.L = L
  await import('leaflet.heat')

  const heatData = [
    [30, 120, 1],
    [31, 121, 2],
    [32, 122, 3],
    [35, 110, 2],
    [36, 115, 1],
  ]

  heatLayer = L.heatLayer(heatData, { radius: 25, blur: 15 }).addTo(map)
  // Heat layer is created with this component's L; the map uses another L from vue-leaflet.
  // In _redraw, map.latLngToContainerPoint() returns a Point from that other L;
  // when passed to L.Bounds.contains(), instanceof Point is false, toBounds path is taken → error.
}
</script>

<style scoped>
.map-wrap {
  width: 100%;
  height: 100%;
}
</style>
