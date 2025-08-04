import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import * as path from 'path'
import { defineConfig } from 'vite'

import type { Plugin } from 'vite'

interface ImportMapPluginOptions {
    imports: Record<string, string>
}

export function importMapPlugin({ imports = {} }: ImportMapPluginOptions): Plugin {
    const VIRTUAL_IMPORTMAP_ID = 'virtual:importmap'
    const RESOLVED_VIRTUAL_IMPORTMAP_ID = '\0' + VIRTUAL_IMPORTMAP_ID

    const chunkReferenceMap = new Map<string, string>()

    return {
        name: 'importmaps',

        resolveId(id) {
            if (id === VIRTUAL_IMPORTMAP_ID) {
                return RESOLVED_VIRTUAL_IMPORTMAP_ID
            }
        },

        buildStart() {
            // Emit chunks for local imports during build
            if (!this.meta.watchMode) {
                for (const [key, value] of Object.entries(imports)) {
                    if (value.startsWith('./') || value.startsWith('../')) {
                        const resolvedPath = path.resolve(value)
                        const fileRef = this.emitFile({
                            type: 'chunk',
                            id: resolvedPath,
                            preserveSignature: 'strict'
                        })
                        chunkReferenceMap.set(key, fileRef)
                    }
                }
            }
        },

        load(id) {
            if (id === RESOLVED_VIRTUAL_IMPORTMAP_ID) {
                const importMapEntries: string[] = []

                if (this.meta.watchMode) {
                    // Dev mode: use ?url imports
                    const importStatements: string[] = []
                    let importIndex = 0

                    for (const [key, value] of Object.entries(imports)) {
                        if (value.startsWith('./') || value.startsWith('../')) {
                            const varName = `import_${importIndex++}`
                            importStatements.push(`import ${varName} from '${value}?url'`)
                            importMapEntries.push(`'${key}': new URL(${varName}, import.meta.url).href`)
                        } else {
                            importMapEntries.push(`'${key}': ${JSON.stringify(value)}`)
                        }
                    }

                    return `
${importStatements.join('\n')}

export default {
  imports: {
    ${importMapEntries.join(',\n    ')}
  }
}`
                } else {
                    // Build mode: use emitted chunk references
                    for (const [key, value] of Object.entries(imports)) {
                        const chunkRef = chunkReferenceMap.get(key)
                        if (chunkRef) {
                            // Use import.meta.ROLLUP_FILE_URL_ for chunk references
                            importMapEntries.push(`'${key}': new URL(import.meta.ROLLUP_FILE_URL_${chunkRef}, import.meta.url).href`)
                        } else {
                            importMapEntries.push(`'${key}': ${JSON.stringify(value)}`)
                        }
                    }

                    return `
export default {
  imports: {
    ${importMapEntries.join(',\n    ')}
  }
}`
                }
            }
        }
    }
}

// Fix: Disable usage of top-level await in the output
export default defineConfig({
    plugins: [
        react(),
        tailwindcss(),
        importMapPlugin({
            imports: {
                'react': './demo/import-map/react',
                'react-dom': './demo/import-map/react-dom',
                'react/jsx-runtime': './demo/import-map/react/jsx-runtime',
                'react/jsx-runtime-dev': './demo/import-map/react/jsx-runtime',
                'framer-motion': 'https://esm.sh/framer-motion?external=react',
                '@motionone/dom': 'https://esm.sh/@motionone/dom?external=react',
                'framer': 'https://esm.sh/unframer@latest/esm/framer.js?external=react',
            }
        })
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
