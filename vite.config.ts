import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

const githubPagesBase = '/Al-Falah-District-Dashboard/'

export default defineConfig(({ mode }) => ({
  plugins: [react()],
  base: mode === 'production' ? githubPagesBase : '/',
  resolve: {
    preserveSymlinks: true,
  },
}))
