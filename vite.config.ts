import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

const githubPagesBase = '/Al-Falah-District-Dashboard/'

export default defineConfig(({ mode }) => ({
  plugins: [react()],
  base: mode === 'production' ? githubPagesBase : '/',
  resolve: {
    preserveSymlinks: true,
  },
  // Network/mapped drives (e.g. G:) don't support native fs.watch on Windows.
  watch: {
    usePolling: true,
    interval: 1000,
  },
  server: {
    watch: {
      usePolling: true,
      interval: 1000,
    },
  },
}))
