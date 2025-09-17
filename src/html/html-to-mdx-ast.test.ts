import { test, expect, describe } from 'vitest'
import React from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import {
    parseHtmlToMdxAst,
    htmlToMdxAst,
    remarkMdxJsxNormalize,
} from './html-to-mdx-ast.js'
import { unified } from 'unified'
import remarkMdx from 'remark-mdx'
import remarkStringify from 'remark-stringify'
import remarkParse from 'remark-parse'
import type { RootContent } from 'mdast'
import { mdxParse } from '../parse.js'
import { MdastToJsx } from '../safe-mdx.js'

// Default components for testing
const components = {
    Heading({ level, children, ...props }) {
        return React.createElement('h1', props, children)
    },
    Cards({ level, children, ...props }) {
        return React.createElement('div', props, children)
    },
}

// Helper to convert HTML to MDX string and rendered HTML
async function htmlToMdxString({
    html,
    withProcessor = false,
    onError,
    convertTagName,
    convertAttributeValue,
}: {
    html: string
    withProcessor?: boolean
    onError?: (error: unknown, text: string) => void
    convertTagName?: (args: { tagName: string }) => string
    convertAttributeValue?: (args: {
        name: string
        value: string
        tagName: string
    }) => string
}): Promise<{ mdx: string; html: string }> {
    // If withProcessor is true, create a textToMdast that parses markdown
    const textToMdast = withProcessor
        ? ({ text }: { text: string }) => {
              const markdownProcessor = unified()
                  .use(remarkParse)
                  .use(remarkMdx)
              const mdast = markdownProcessor.parse(text) as any
              markdownProcessor.runSync(mdast)
              // Return the children of the root node
              return mdast.children || []
          }
        : undefined

    const mdxAst = parseHtmlToMdxAst({
        html,
        textToMdast,
        onError,
        convertTagName,
        convertAttributeValue,
    })

    // Generate MDX string
    const processor = unified().use(remarkMdx).use(remarkStringify, {
        // bullet: '-',
        // fence: '`',
        // fences: true
    })

    // Create a root node with the content
    const root = {
        type: 'root',
        children: mdxAst,
    }

    const mdx = processor.stringify(root as any)

    // Generate HTML using MdastToJsx like in safe-mdx.test.tsx
    // First parse the MDX to get the full AST
    const mdast = mdxParse(mdx)
    const visitor = new MdastToJsx({ markdown: mdx, mdast, components })
    const jsx = visitor.run()
    const renderedHtml = renderToStaticMarkup(jsx)

    return { mdx, html: renderedHtml }
}

describe('parseHtmlToMdxAst', () => {
    test('parses simple HTML element', () => {
        const result = parseHtmlToMdxAst({ html: '<div>Hello</div>' })
        expect(result).toMatchInlineSnapshot(`
          [
            {
              "attributes": [],
              "children": [
                {
                  "type": "text",
                  "value": "Hello",
                },
              ],
              "name": "div",
              "type": "mdxJsxTextElement",
            },
          ]
        `)
    })

    test('filters out non-HTML elements when convertTagName returns empty string', () => {
        const result = parseHtmlToMdxAst({
            html: '<custom-element>Hello <span>world</span></custom-element>',
            convertTagName: ({ tagName }) => {
                // Only keep span, filter out custom-element
                if (tagName === 'span') return 'span'
                return tagName
            },
        })
        expect(result).toMatchInlineSnapshot(`
          [
            {
              "attributes": [],
              "children": [
                {
                  "type": "text",
                  "value": "Hello ",
                },
                {
                  "attributes": [],
                  "children": [
                    {
                      "type": "text",
                      "value": "world",
                    },
                  ],
                  "name": "span",
                  "type": "mdxJsxTextElement",
                },
              ],
              "name": "custom-element",
              "type": "mdxJsxTextElement",
            },
          ]
        `)
    })

    test('handles self-closing tags', () => {
        const result = parseHtmlToMdxAst({
            html: '<img src="https://example.com/img.jpg" />',
        })
        expect(result).toMatchInlineSnapshot(`
          [
            {
              "attributes": [
                {
                  "name": "src",
                  "type": "mdxJsxAttribute",
                  "value": "https://example.com/img.jpg",
                },
              ],
              "children": [],
              "name": "img",
              "type": "mdxJsxTextElement",
            },
          ]
        `)
    })

    test('handles span with attributes', () => {
        const result = parseHtmlToMdxAst({
            html: '<span color="blue">colored text</span>',
        })
        expect(result).toMatchInlineSnapshot(`
          [
            {
              "attributes": [
                {
                  "name": "color",
                  "type": "mdxJsxAttribute",
                  "value": "blue",
                },
              ],
              "children": [
                {
                  "type": "text",
                  "value": "colored text",
                },
              ],
              "name": "span",
              "type": "mdxJsxTextElement",
            },
          ]
        `)
    })

    test('handles mixed content', () => {
        const result = parseHtmlToMdxAst({
            html: 'Some text <strong>bold</strong> more text',
        })
        expect(result).toMatchInlineSnapshot(`
          [
            {
              "type": "text",
              "value": "Some text ",
            },
            {
              "attributes": [],
              "children": [
                {
                  "type": "text",
                  "value": "bold",
                },
              ],
              "name": "strong",
              "type": "mdxJsxTextElement",
            },
            {
              "type": "text",
              "value": " more text",
            },
          ]
        `)
    })

    test('handles comments', () => {
        const result = parseHtmlToMdxAst({ html: '<!-- This is a comment -->' })
        expect(result).toMatchInlineSnapshot(`[]`)
    })

    test('handles table with attributes', () => {
        const result = parseHtmlToMdxAst({
            html: '<table class="data-table"><tr><td>Cell</td></tr></table>',
        })
        expect(result).toMatchInlineSnapshot(`
          [
            {
              "attributes": [
                {
                  "name": "className",
                  "type": "mdxJsxAttribute",
                  "value": "data-table",
                },
              ],
              "children": [
                {
                  "attributes": [],
                  "children": [
                    {
                      "attributes": [],
                      "children": [
                        {
                          "type": "text",
                          "value": "Cell",
                        },
                      ],
                      "name": "td",
                      "type": "mdxJsxTextElement",
                    },
                  ],
                  "name": "tr",
                  "type": "mdxJsxTextElement",
                },
              ],
              "name": "table",
              "type": "mdxJsxTextElement",
            },
          ]
        `)
    })
})

describe('parseHtmlToMdxAst with markdown processor', () => {
    test('parses markdown inside HTML tags', async () => {
        const htmlToConvert = '<div>This is **bold** text</div>'
        const result = await htmlToMdxString({
            html: htmlToConvert,
            withProcessor: true,
            onError: (e) => {
                throw e
            },
        })
        expect(result).toMatchInlineSnapshot(`
          {
            "html": "<div>This is <strong>bold</strong> text</div>",
            "mdx": "<div>This is **bold** text</div>
          ",
          }
        `)
    })

    test('handles mixed markdown and HTML inside tags', async () => {
        const htmlToConvert = '<div>**Bold text:** <a href="#">link</a></div>'
        const result = await htmlToMdxString({
            html: htmlToConvert,
            withProcessor: true,
            onError: (e) => {
                throw e
            },
        })
        expect(result).toMatchInlineSnapshot(`
          {
            "html": "<div><strong>Bold text:</strong><a href="#">link</a></div>",
            "mdx": "<div>**Bold text:**<a href="#">link</a></div>
          ",
          }
        `)
    })

    test('handles markdown inside table cells', async () => {
        const htmlToConvert =
            '<table><tr><td>**Bold** text and [link](http://example.com)</td></tr></table>'
        const result = await htmlToMdxString({
            html: htmlToConvert,
            withProcessor: true,
            onError: (e) => {
                throw e
            },
        })
        expect(result).toMatchInlineSnapshot(`
          {
            "html": "<table><tr><td><strong>Bold</strong> text and <a href="http://example.com" title="">link</a></td></tr></table>",
            "mdx": "<table><tr><td>**Bold** text and [link](http://example.com)</td></tr></table>
          ",
          }
        `)
    })

    test('preserves plain text when no markdown', async () => {
        const htmlToConvert = '<div>Plain text without markdown</div>'
        const result = await htmlToMdxString({
            html: htmlToConvert,
            withProcessor: true,
            onError: (e) => {
                throw e
            },
        })
        expect(result).toMatchInlineSnapshot(`
          {
            "html": "<div>Plain text without markdown</div>",
            "mdx": "<div>Plain text without markdown</div>
          ",
          }
        `)
    })

    test('handles nested HTML tags with markdown', async () => {
        const htmlToConvert =
            '<div><span>**Bold** and <a href="#">link</a></span></div>'
        const result = await htmlToMdxString({
            html: htmlToConvert,
            withProcessor: true,
            onError: (e) => {
                throw e
            },
        })
        expect(result).toMatchInlineSnapshot(`
          {
            "html": "<div><span><strong>Bold</strong> and<a href="#">link</a></span></div>",
            "mdx": "<div><span>**Bold** and<a href="#">link</a></span></div>
          ",
          }
        `)
    })
})
