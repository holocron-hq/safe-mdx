import type { Root, RootContent, PhrasingContent } from 'mdast'
import type { MdxJsxTextElement, MdxJsxFlowElement } from 'mdast-util-mdx-jsx'
import { visitParents } from 'unist-util-visit-parents'
import type { Node, Parent } from 'unist'

// Type definitions for MDX and MDAST content types
// type FlowContent = Blockquote | Code | Heading | Html | List | ThematicBreak | Content
// type PhrasingContent = Break | Emphasis | Html | Image | ImageReference | InlineCode | Link | LinkReference | Strong | Text
// type MdxJsxFlowContent = MdxJsxFlowElement | FlowContent
// type MdxJsxPhrasingContent = MdxJsxTextElement | PhrasingContent

/** Parents that require phrasing/inline children */
const PHRASE_CONTAINERS = new Set([
    'paragraph',
    'heading',
    'emphasis',
    'strong',
    'delete',
    'link',
    'linkReference',
    'tableCell',
    'mdxJsxTextElement', // MDX JSX text elements should contain phrasing
])

/** Parents that accept/expect flow (block) content */
const FLOW_CONTAINERS = new Set([
    'root',
    'listItem',
    'blockquote',
    'footnoteDefinition',
    'mdxJsxFlowElement', // MDX JSX flow elements should contain flow
])

/** Check if a node represents phrasing content */
function isPhrasing(node: Node): boolean {
    const phrasingTypes = new Set([
        'text',
        'emphasis',
        'strong',
        'delete',
        'html',
        'image',
        'imageReference',
        'inlineCode',
        'link',
        'linkReference',
        'break',
        'mdxJsxTextElement',
    ])
    return phrasingTypes.has(node.type)
}

/** Tags that are typically block-level elements */
const blockLevelTags = new Set([
    'div',
    'p',
    'blockquote',
    'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
    'ul', 'ol', 'li',
    'pre',
    'hr',
    'table', 'thead', 'tbody', 'tfoot', 'tr', 'th', 'td',
    'section', 'article', 'aside', 'nav', 'header', 'footer', 'main',
    'figure', 'figcaption',
    // Notion-specific block elements
    'callout',
    'columns', 'column',
    'page',
    'database',
    'data-source',
    'audio', 'video', 'file', 'pdf', 'embed',
    'synced_block', 'synced_block_reference',
    'meeting-notes', 'summary', 'notes', 'transcript',
    'table_of_contents',
    'unknown',
    'image', // Images can be block-level in Notion
])

/**
 * remark plugin: make mdxJsx* element kinds match their context.
 * - Inside phrasing parents → mdxJsxTextElement
 * - Inside flow parents → mdxJsxFlowElement
 * - Elements with block-level tag names → mdxJsxFlowElement
 * - Elements containing non-phrasing children → mdxJsxFlowElement
 */
export default function remarkMdxJsxNormalize() {
    return function transform(tree: Root) {
        visitParents(tree, isMdxJsx, (node, ancestors) => {
            const element = node as MdxJsxTextElement | MdxJsxFlowElement
            const parent = ancestors[ancestors.length - 1] as Parent | undefined
            if (!parent) return

            const parentType = parent.type
            const parentExpectsPhrasing = PHRASE_CONTAINERS.has(parentType)
            const parentExpectsFlow = FLOW_CONTAINERS.has(parentType)

            // Check element properties
            const hasBlockTag = element.name ? blockLevelTags.has(element.name.toLowerCase()) : false
            const children = (element.children || []) as RootContent[]
            const containsNonPhrasing = children.some((c) => !isPhrasing(c))

            // Determine desired type
            let desired: 'mdxJsxTextElement' | 'mdxJsxFlowElement' = element.type

            // Priority rules:
            // 1. If it has a block-level tag name, it should be flow
            // 2. If it contains non-phrasing children, it should be flow
            // 3. Otherwise, match parent context
            if (hasBlockTag || containsNonPhrasing) {
                desired = 'mdxJsxFlowElement'
            } else if (parentExpectsPhrasing) {
                desired = 'mdxJsxTextElement'
            } else if (parentExpectsFlow) {
                desired = 'mdxJsxFlowElement'
            }

            // Apply the change if needed
            if (element.type !== desired) {
                element.type = desired
            }
        })
    }
}

/** Check if a node is an MDX JSX element */
function isMdxJsx(node: Node): boolean {
    return node.type === 'mdxJsxTextElement' || node.type === 'mdxJsxFlowElement'
}