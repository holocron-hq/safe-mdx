import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { importMapPlugin } from 'importmap-vite-plugin'
import * as path from 'path'
import { defineConfig } from 'vite'

// Fix: Disable usage of top-level await in the output
export default defineConfig({
    plugins: [
        react(),
        tailwindcss(),
        importMapPlugin({
            imports: {
                react: './demo/import-map/react',
                'react-dom': './demo/import-map/react-dom',
                'react/jsx-runtime': './demo/import-map/react/jsx-runtime',
                'react/jsx-runtime-dev': './demo/import-map/react/jsx-runtime',
                'framer-motion': 'https://esm.sh/framer-motion?external=react',
                '@motionone/dom':
                    'https://esm.sh/@motionone/dom?external=react',
                framer: 'https://esm.sh/unframer@latest/esm/framer.js?external=react',
            },
        }),
    ],
    build: {
        target: ['esnext'],
        // any asset, regardless of size, will be emitted as a separate file
        assetsInlineLimit: 0,
    },
    esbuild: {
        supported: {
            'top-level-await': true,
        },
    },
})
