import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig } from 'vite'

// Served from https://sheedosa.github.io/arwa-fashion/ — every asset URL and the
// router's basename derive from this. Change it here (and in the router, which reads
// import.meta.env.BASE_URL) if the repo is ever renamed or moved to a custom domain.
export default defineConfig({
  base: '/arwa-fashion/',
  plugins: [react(), tailwindcss()],
})
