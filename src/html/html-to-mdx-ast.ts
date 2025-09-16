import type { Root, RootContent, Text } from 'mdast'
import type {
    MdxJsxAttribute,
    MdxJsxAttributeValueExpression,
    MdxJsxTextElement
} from 'mdast-util-mdx-jsx'
import type { DefaultTreeAdapterTypes as pt, Token } from 'parse5'
import { parseFragment } from 'parse5'
import type { Processor } from 'unified'
import { convertAttributeNameToJSX } from './convert-attributes'

// Re-export the normalize plugin
export { default as remarkMdxJsxNormalize } from './remark-mdx-jsx-normalize'

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

// Type guard functions
function isCommentNode(node: pt.ChildNode): node is pt.CommentNode {
    return node.nodeName === '#comment'
}

function isTextNode(node: pt.ChildNode): node is pt.TextNode {
    return node.nodeName === '#text'
}

function isDocumentType(node: pt.ChildNode): node is pt.DocumentType {
    return (
        node.nodeName === '#document' || node.nodeName === '#document-fragment'
    )
}

function isElementNode(node: pt.ChildNode): node is pt.Element {
    return 'tagName' in node
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
    value
}: {
    name: string
    value: string
    tagName: string
}): string {
    return value
}

// Convert HTML attribute to MDX JSX attribute
function convertAttribute(
    attr: Token.Attribute,
    tagName: string,
    options?: ParseHtmlToMdxAstOptions,
): MdxJsxAttribute {
    let jsxName = convertAttributeNameToJSX(attr.name)

    // Apply attribute value transformation
    const convertAttrValue = options?.convertAttributeValue || defaultConvertAttributeValue
    let value = convertAttrValue({ name: attr.name, value: attr.value, tagName })

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
    //         value: value,
    //     }
    // }

    // Default: string value
    return {
        type: 'mdxJsxAttribute',
        name: jsxName,
        value: value,
    }
}



// Convert parse5 HTML node to MDX AST nodes
function htmlNodeToMdxAst(
    node: pt.ChildNode,
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
        // If we have a processor, parse the text as markdown
        if (options?.processor && node.value.trim()) {
            try {
                // Apply text transformation before parsing markdown
                const textToMdast = options.textToMdast || defaultTextToMdast
                const preprocessed = textToMdast({ text: node.value })
                const mdast = options.processor.parse(preprocessed) as Root
                options.processor.runSync(mdast)
                // Return the children of the root node, which are the actual content nodes
                return mdast.children as RootContent[]
            } catch (error) {
                // Call onError callback if provided, otherwise log
                if (options.onError) {
                    options.onError(error, node.value)
                } else {
                    console.error('Failed to parse markdown in HTML text node:', error)
                    console.error('Text content:', node.value)
                }
                return {
                    type: 'text',
                    value: node.value,
                } satisfies Text
            }
        }
        return {
            type: 'text',
            value: node.value,
        } satisfies Text
    }

    if (isDocumentType(node)) {
        throw new Error('Document type nodes cannot be processed')
    }

    if (!isElementNode(node)) {
        return []
    }

    const convertTagNameFn = options?.convertTagName || defaultConvertTagName
    const componentName = convertTagNameFn({ tagName: node.tagName })

    // Convert attributes
    const attributes: MdxJsxAttribute[] = node.attrs.map((attr) =>
        convertAttribute(attr, node.tagName, options),
    )

    // Process children
    const children: RootContent[] = node.childNodes.flatMap((child) => {
        const result = htmlNodeToMdxAst(child, options)
        return Array.isArray(result) ? result : [result]
    })

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
    // Parse HTML with parse5
    const htmlAst = parseFragment(options.html.trim())

    if (htmlAst.childNodes.length === 0) {
        return []
    }

    if (htmlAst.childNodes.length === 1) {
        return htmlNodeToMdxAst(htmlAst.childNodes[0]!, options)
    }

    // Multiple nodes - return as array
    const results = htmlAst.childNodes.flatMap((node) => {
        const result = htmlNodeToMdxAst(node, options)
        return Array.isArray(result) ? result : [result]
    })

    return results
}

// Export a wrapper that always returns an array for consistency
export function parseHtmlToMdxAst(
    options: ParseHtmlToMdxAstOptions,
): RootContent[] {
    const result = htmlToMdxAst(options)
    return Array.isArray(result) ? result : [result]
}
