import { test, expect, describe } from 'vitest'
import { parseHtmlToMdxAst, htmlToMdxAst } from './html-to-mdx-ast.js'
import { unified } from 'unified'
import remarkMdx from 'remark-mdx'
import remarkStringify from 'remark-stringify'
import remarkParse from 'remark-parse'
import type { RootContent } from 'mdast'

// Helper to convert HTML to MDX string
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
}): Promise<string> {
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

    return processor.stringify(root as any)
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
        const mdxString = await htmlToMdxString({
            html: htmlToConvert,
            withProcessor: true,
            onError: (e) => {
                throw e
            },
        })
        expect(mdxString).toMatchInlineSnapshot(`
          "<div>This is **bold** text</div>
          "
        `)
    })

    test('handles mixed markdown and HTML inside tags', async () => {
        const htmlToConvert = '<div>**Bold text:** <a href="#">link</a></div>'
        const mdxString = await htmlToMdxString({
            html: htmlToConvert,
            withProcessor: true,
            onError: (e) => {
                throw e
            },
        })
        expect(mdxString).toMatchInlineSnapshot(`
          "<div>**Bold text:**<a href="#">link</a></div>
          "
        `)
    })

    test('handles markdown inside table cells', async () => {
        const htmlToConvert =
            '<table><tr><td>**Bold** text and [link](http://example.com)</td></tr></table>'
        const mdxString = await htmlToMdxString({
            html: htmlToConvert,
            withProcessor: true,
            onError: (e) => {
                throw e
            },
        })
        expect(mdxString).toMatchInlineSnapshot(`
          "<table><tr><td>**Bold** text and [link](http://example.com)</td></tr></table>
          "
        `)
    })

    test('preserves plain text when no markdown', async () => {
        const htmlToConvert = '<div>Plain text without markdown</div>'
        const mdxString = await htmlToMdxString({
            html: htmlToConvert,
            withProcessor: true,
            onError: (e) => {
                throw e
            },
        })
        expect(mdxString).toMatchInlineSnapshot(`
          "<div>Plain text without markdown</div>
          "
        `)
    })

    test('handles nested HTML tags with markdown', async () => {
        const htmlToConvert =
            '<div><span>**Bold** and <a href="#">link</a></span></div>'
        const mdxString = await htmlToMdxString({
            html: htmlToConvert,
            withProcessor: true,
            onError: (e) => {
                throw e
            },
        })
        expect(mdxString).toMatchInlineSnapshot(`
          "<div><span>**Bold** and<a href="#">link</a></span></div>
          "
        `)
    })
})
