// List of valid HTML elements that should be preserved
// All other elements will be filtered out (return empty string)
export const validHtmlElements = new Set([
    // Document metadata
    'base', 'head', 'link', 'meta', 'style', 'title',
    
    // Content sectioning
    'address', 'article', 'aside', 'footer', 'header', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
    'main', 'nav', 'section',
    
    // Text content
    'blockquote', 'dd', 'div', 'dl', 'dt', 'figcaption', 'figure', 'hr', 'li', 'ol', 'p', 'pre', 'ul',
    
    // Inline text semantics
    'a', 'abbr', 'b', 'bdi', 'bdo', 'br', 'cite', 'code', 'data', 'dfn', 'em', 'i', 'kbd',
    'mark', 'q', 'rp', 'rt', 'ruby', 's', 'samp', 'small', 'span', 'strong', 'sub', 'sup',
    'time', 'u', 'var', 'wbr',
    
    // Image and multimedia
    'area', 'audio', 'img', 'map', 'track', 'video',
    
    // Embedded content
    'embed', 'iframe', 'object', 'param', 'picture', 'portal', 'source',
    
    // SVG and MathML
    'svg', 'math', 'path', // Added 'path' from nativeTags
    
    // Scripting
    'canvas', 'noscript', 'script',
    
    // Demarcating edits
    'del', 'ins',
    
    // Table content
    'caption', 'col', 'colgroup', 'table', 'tbody', 'td', 'tfoot', 'th', 'thead', 'tr',
    
    // Forms
    'button', 'datalist', 'fieldset', 'form', 'input', 'label', 'legend', 'meter', 'optgroup',
    'option', 'output', 'progress', 'select', 'textarea',
    
    // Interactive elements
    'details', 'dialog', 'menu', 'summary',
    
    // Web Components
    'slot', 'template',
])

// Export as an array for backward compatibility with nativeTags
export const nativeTags = Array.from(validHtmlElements) as readonly string[]

/**
 * Convert HTML tag name to JSX component name
 * Returns empty string if the tag is not a valid HTML element
 */
export function htmlTagNameConverter({ tagName }: { tagName: string }): string {
    const lowerTag = tagName.toLowerCase()
    
    // Check if it's a valid HTML element
    if (validHtmlElements.has(lowerTag)) {
        return lowerTag
    }
    
    // Return empty string for non-HTML elements
    return ''
}