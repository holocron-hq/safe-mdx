import React from 'react'
import ReactDOM from 'react-dom/client'
import { App } from './app'

const [reactMod, reactDomMod, jsxRuntimeMod] = await Promise.all([
    import('./import-map/react'),
    import('./import-map/react-dom'),
    import('./import-map/react/jsx-runtime'),
])

const mapScript = document.createElement('script')
mapScript.type = 'importmap'
mapScript.textContent = JSON.stringify(
    {
        imports: {
            react: reactMod.url,
            'react-dom': reactDomMod.url,
            'react/jsx-runtime': jsxRuntimeMod.url,
            'framer-motion': 'https://esm.sh/framer-motion?external=react',
            '@motionone/dom': 'https://esm.sh/@motionone/dom?external=react',
            framer: 'https://esm.sh/unframer@latest/esm/framer.js?external=react',
        },
    },
    null,
    2,
)
document.head.append(mapScript)

ReactDOM.createRoot(document.getElementById('root')!).render(<App />)
