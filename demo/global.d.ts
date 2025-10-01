declare module '*?url' {
    const url: string
    export default url
}

declare module 'virtual:importmap' {
    const importmap: Record<string, any>
    export default importmap
}
