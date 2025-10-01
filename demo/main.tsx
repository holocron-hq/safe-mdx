import React from 'react'
import ReactDOM from 'react-dom/client'
import { App } from './app'
import importMap from 'virtual:importmap'

function setupImportMap() {
    const mapScript = document.createElement('script')
    mapScript.type = 'importmap'
    mapScript.textContent = JSON.stringify(importMap, null, 2)
    console.log(mapScript.textContent)
    document.head.append(mapScript)
}
setupImportMap()

ReactDOM.createRoot(document.getElementById('root')!).render(<App />)
