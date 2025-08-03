import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

import type { Plugin, UserConfig } from 'vite'

export default defineConfig({
    plugins: [react(), tailwindcss()],
})
