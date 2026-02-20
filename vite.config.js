import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  base: '/leaflet-heat-vue-repro/',
  plugins: [vue()],
})
