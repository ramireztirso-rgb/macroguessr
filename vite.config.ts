import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig(({ command }) => ({
  // GitHub Pages serves this project at /macroguessr/, so production asset
  // URLs need that prefix. Dev server stays at root.
  base: command === 'build' ? '/macroguessr/' : '/',
  plugins: [react(), tailwindcss()],
}))
