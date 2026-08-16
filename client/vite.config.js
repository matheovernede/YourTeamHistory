import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import musicTracks from './vite-plugin-music.js'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), musicTracks()],
})
