import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { assistantServer } from './plugins/assistant.ts'

export default defineConfig({
  plugins: [react(), tailwindcss(), assistantServer()],
})