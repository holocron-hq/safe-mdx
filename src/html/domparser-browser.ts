// Browser-specific DOMParser implementation
export function parseHTML(html: string) {
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');
    return { document: doc };
}