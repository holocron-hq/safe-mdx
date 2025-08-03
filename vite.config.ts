import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

import type { Plugin, UserConfig } from 'vite'

export default defineConfig({
    // resolve: {
    //     alias: {
    //         react: 'https://esm.sh/react',
    //         'react/jsx-runtime': 'https://esm.sh/react/jsx-runtime',
    //         'react/jsx-dev-runtime': 'https://esm.sh/react/jsx-dev-runtime',
    //     },
    // },
    // build: {
    //     rollupOptions: {
    //         external: ['react', 'react/jsx-runtime', 'react/jsx-dev-runtime'],
    //     },
    // },
    plugins: [react(), tailwindcss()],
})
