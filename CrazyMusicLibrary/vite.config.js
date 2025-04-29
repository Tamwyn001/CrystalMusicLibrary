import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0',
    port: 5174, // Your frontend development server port
  },
  resolve: {
    alias: {
      ...{
        // See https://github.com/mantinedev/ui.mantine.dev/issues/113
        '@tabler/icons-react': '@tabler/icons-react/dist/esm/icons/index.mjs'
      },
    }
  },
  build: {
    outDir: '../backend/dist',
    emptyOutDir: true, // also necessary
  }
})
