---
'safe-mdx': patch
---

Add React resource hints for dynamic ESM component URLs to improve loading performance. The DynamicEsmComponent now uses React's prefetchDNS and preconnect APIs to establish early connections to ESM CDN domains (like esm.sh), reducing latency when components are dynamically imported on the client side. This optimization happens automatically when using allowClientEsmImports and helps improve the user experience by starting the DNS lookup and connection handshake before the actual component import is triggered.
