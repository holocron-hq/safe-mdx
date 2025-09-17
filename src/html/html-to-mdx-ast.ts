import type { Root, RootContent, Text as MdastText } from 'mdast'
import type {
    MdxJsxAttribute,
    MdxJsxAttributeValueExpression,
    MdxJsxTextElement,
} from 'mdast-util-mdx-jsx'
import type { Processor } from 'unified'
import { convertAttributeNameToJSX } from './convert-attributes.js'
import { parseHTML } from './domparser.js'

// Re-export the normalize plugin
export { default as remarkMdxJsxNormalize } from './remark-mdx-jsx-normalize.js'

// Type for processor that can parse markdown to AST
type MarkdownProcessor = Processor<Root, Root, Root, undefined, undefined>

// Type for converting tag names
export type ConvertTagName = (args: { tagName: string }) => string

// Type for converting text to mdast nodes
export type TextToMdast = (args: { text: string }) => string

// Type for converting attribute values
export type ConvertAttributeValue = (args: {
    name: string
    value: string
    tagName: string
}) => string

// Options for parsing HTML to MDX AST
export interface ParseHtmlToMdxAstOptions {
    html: string
    processor?: MarkdownProcessor
    onError?: (error: unknown, text: string) => void
    convertTagName?: ConvertTagName
    textToMdast?: TextToMdast
    convertAttributeValue?: ConvertAttributeValue
}

// Type guard functions for DOM nodes
function isCommentNode(node: Node): node is Comment {
    return node.nodeType === 8 // Node.COMMENT_NODE
}

function isTextNode(node: Node): node is Text {
    return node.nodeType === 3 // Node.TEXT_NODE
}

function isElementNode(node: Node): node is Element {
    return node.nodeType === 1 // Node.ELEMENT_NODE
}

// Default tag name converter (no transformation)
function defaultConvertTagName({ tagName }: { tagName: string }): string {
    return tagName.toLowerCase()
}

// Default text to mdast converter (no transformation)
function defaultTextToMdast({ text }: { text: string }): string {
    return text
}

// Default attribute value converter (no transformation)
function defaultConvertAttributeValue({
    value,
}: {
    name: string
    value: string
    tagName: string
}): string {
    return value
}

// Convert HTML attribute to MDX JSX attribute
function convertAttribute(
    attr: Attr,
    tagName: string,
    options?: ParseHtmlToMdxAstOptions,
): MdxJsxAttribute {
    let jsxName = convertAttributeNameToJSX(attr.name)

    // Apply attribute value transformation
    const convertAttrValue =
        options?.convertAttributeValue || defaultConvertAttributeValue
    let value = convertAttrValue({
        name: attr.name,
        value: attr.value,
        tagName,
    })

    // Handle boolean attributes
    if (value === '' || value === attr.name) {
        return {
            type: 'mdxJsxAttribute',
            name: jsxName,
            value: null, // boolean true
        }
    }

    // Handle special number attributes
    const numberAttrs = [
        'tabIndex',
        'cols',
        'rows',
        'size',
        'span',
        'colSpan',
        'rowSpan',
        'border',
    ]
    if (numberAttrs.includes(jsxName) && value && !isNaN(Number(value))) {
        return {
            type: 'mdxJsxAttribute',
            name: jsxName,
            value: {
                type: 'mdxJsxAttributeValueExpression',
                value: value,
                data: {
                    estree: {
                        type: 'Program',
                        sourceType: 'module',
                        body: [
                            {
                                type: 'ExpressionStatement',
                                expression: {
                                    type: 'Literal',
                                    value: Number(value),
                                },
                            },
                        ],
                    },
                },
            } satisfies MdxJsxAttributeValueExpression,
        }
    }

    // Handle style attribute - for now keep as string
    // if (jsxName === 'style' && value.includes(':')) {
    //     // Could enhance to parse CSS to object
    //     return {
    //         type: 'mdxJsxAttribute',
    //         name: jsxName,
    //         value: {
    //             type: 'mdxJsxAttributeValueExpression',
    //             value: `{${JSON.stringify(parseStyleString(value))}}`,
    //             data: {
    //                 estree: parseExpression(JSON.stringify(parseStyleString(value))),
    //             },
    //         },
    //     }
    // }

    // String value
    return {
        type: 'mdxJsxAttribute',
        name: jsxName,
        value: value,
    }
}

// Convert DOM node to MDX AST nodes
function htmlNodeToMdxAst(
    node: Node,
    options?: ParseHtmlToMdxAstOptions,
): RootContent | RootContent[] {
    if (isCommentNode(node)) {
        // Convert comments to MDX JSX expression with comment
        // For now, return as HTML node
        // return {
        //     type: 'html',
        //     value: `<!-- ${node.data} -->`
        // } as Html
        return []
    }

    if (isTextNode(node)) {
        const textValue = node.textContent || ''
        // If we have a processor, parse the text as markdown
        if (options?.processor && textValue.trim()) {
            try {
                // Apply text transformation before parsing markdown
                const textToMdast = options.textToMdast || defaultTextToMdast
                const preprocessed = textToMdast({ text: textValue })
                const mdast = options.processor.parse(preprocessed) as Root
                options.processor.runSync(mdast)
                // Return the children of the root node, which are the actual content nodes
                return mdast.children as RootContent[]
            } catch (error) {
                // Call onError callback if provided, otherwise log
                if (options.onError) {
                    options.onError(error, textValue)
                } else {
                    console.error(
                        'Failed to parse markdown in HTML text node:',
                        error,
                    )
                    console.error('Text content:', textValue)
                }
                return {
                    type: 'text',
                    value: textValue,
                } satisfies MdastText
            }
        }
        return {
            type: 'text',
            value: textValue,
        } satisfies MdastText
    }

    if (!isElementNode(node)) {
        return []
    }

    const convertTagNameFn = options?.convertTagName || defaultConvertTagName
    // DOM API returns uppercase tagName, but we want lowercase for consistency
    const componentName = convertTagNameFn({ tagName: node.tagName.toLowerCase() })

    // If convertTagName returns empty string, skip this element and only return its children
    if (componentName === '') {
        // Process children but skip the element wrapper
        const children: RootContent[] = []
        for (const child of Array.from(node.childNodes)) {
            const result = htmlNodeToMdxAst(child, options)
            if (Array.isArray(result)) {
                children.push(...result)
            } else {
                children.push(result)
            }
        }
        return children
    }

    // Convert attributes
    const attributes: MdxJsxAttribute[] = []
    for (const attr of Array.from(node.attributes)) {
        attributes.push(convertAttribute(attr, node.tagName, options))
    }

    // Process children
    const children: RootContent[] = []
    for (const child of Array.from(node.childNodes)) {
        const result = htmlNodeToMdxAst(child, options)
        if (Array.isArray(result)) {
            children.push(...result)
        } else {
            children.push(result)
        }
    }

    // Always create MdxJsxTextElement initially
    // The conversion to MdxJsxFlowElement will be handled by a separate plugin
    const element: MdxJsxTextElement = {
        type: 'mdxJsxTextElement',
        name: componentName,
        attributes,
        children: children as any,
    }
    return element
}

// Main function to parse HTML and return MDX AST
export function htmlToMdxAst(
    options: ParseHtmlToMdxAstOptions,
): RootContent | RootContent[] {
    // Parse HTML with linkedom
    const { document } = parseHTML(options.html.trim())

    // linkedom behavior:
    // - If input is a fragment (like "<div>Hello</div>"), the content becomes direct children of document
    // - If input has body tag, it creates proper body element
    // - We need to handle both cases
    
    // linkedom behavior: 
    // - When parsing fragments, content becomes direct children of document
    // - Accessing document.body on fragments auto-creates HEAD and BODY as children
    // - We must avoid accessing document.body to prevent this
    
    // Just use document's direct children and filter for relevant nodes
    const childNodes = Array.from(document.childNodes).filter(node => 
        node.nodeType === 1 || // Element nodes
        node.nodeType === 3 || // Text nodes
        node.nodeType === 8    // Comment nodes
    )
    
    if (childNodes.length === 0) {
        return []
    }

    if (childNodes.length === 1) {
        return htmlNodeToMdxAst(childNodes[0]!, options)
    }

    // Multiple nodes - return as array
    const results: RootContent[] = []
    for (const node of childNodes) {
        const result = htmlNodeToMdxAst(node, options)
        if (Array.isArray(result)) {
            results.push(...result)
        } else {
            results.push(result)
        }
    }

    return results
}

// Export a wrapper that always returns an array for consistency
export function parseHtmlToMdxAst(
    options: ParseHtmlToMdxAstOptions,
): RootContent[] {
    const result = htmlToMdxAst(options)
    return Array.isArray(result) ? result : [result]
}
