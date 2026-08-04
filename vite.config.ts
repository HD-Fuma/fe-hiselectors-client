import react from '@vitejs/plugin-react'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  base: '/fe-selectors-client/',
  plugins: [react()],
  test: {
    environment: 'jsdom',
  },
})
