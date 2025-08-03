import React from 'react'
import ReactDOM from 'react-dom/client'
import { App } from './app'

import reactMod from './import-map/react?url'
import reactDomMod from './import-map/react-dom?url'
import jsxRuntimeMod from './import-map/react/jsx-runtime?url'

function setupImportMap() {
    const mapScript = document.createElement('script')
    mapScript.type = 'importmap'
    mapScript.textContent = JSON.stringify(
        {
            imports: {
                react: new URL(reactMod, import.meta.url).href,
                'react-dom': new URL(reactDomMod, import.meta.url).href,
                'react/jsx-runtime': new URL(jsxRuntimeMod, import.meta.url)
                    .href,
                'framer-motion': 'https://esm.sh/framer-motion?external=react',
                '@motionone/dom':
                    'https://esm.sh/@motionone/dom?external=react',
                framer: 'https://esm.sh/unframer@latest/esm/framer.js?external=react',
            },
        },
        null,
        2,
    )
    console.log(mapScript.textContent)
    document.head.append(mapScript)
}
setupImportMap()

ReactDOM.createRoot(document.getElementById('root')!).render(<App />)
