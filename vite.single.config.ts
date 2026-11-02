import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { viteSingleFile } from 'vite-plugin-singlefile'

// Builds one self-contained HTML file that can be opened by double-click (file://), no server needed.
export default defineConfig({
  base: './',
  plugins: [react(), tailwindcss(), viteSingleFile()],
  build: { outDir: 'standalone-build', chunkSizeWarningLimit: 5000, assetsInlineLimit: 100000000 },
})
