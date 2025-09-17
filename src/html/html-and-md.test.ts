import { test, expect, describe } from 'vitest'
import { unified, Plugin } from 'unified'

import remarkMdx from 'remark-mdx'
import remarkStringify from 'remark-stringify'
import remarkParse from 'remark-parse'

import { parseHtmlToMdxAst } from 'safe-mdx/parse'
import { Root, RootContent } from 'mdast'
import { remark } from 'remark'
import { visit } from 'unist-util-visit'

/** Template literal for auto formatting */
function html(
    strings: TemplateStringsArray,
    ...expressions: unknown[]
): string {
    // Join all string parts, then dedent
    let raw = strings[0] ?? ''

    for (let i = 1, l = strings.length; i < l; i++) {
        raw += expressions[i - 1]
        raw += strings[i]
    }

    // dedent: remove common leading whitespace from all non-empty lines
    const lines = raw.split('\n')
    // Ignore empty lines and lines with only whitespace
    const nonEmptyLines = lines.filter((line) => line.trim().length > 0)
    const indentLengths = nonEmptyLines.map(
        (line) => line.match(/^(\s*)/)![0].length,
    )
    const minIndent = indentLengths.length > 0 ? Math.min(...indentLengths) : 0

    // Remove the common indent from all lines
    const dedented = lines.map((line) => line.slice(minIndent)).join('\n')

    return dedented
}

// Helper to convert HTML to MDX string
async function htmlToMdxString({
    markdown,
    onError,
}: {
    markdown: string
    onError?: (error: unknown, text: string) => void
}): Promise<string> {
    const remarkHtmlBlocks: Plugin<[], Root> = function () {
        return (tree: Root) => {
            visit(tree, (node, index, parent) => {
                if (
                    node.type === 'html' &&
                    parent &&
                    typeof index === 'number'
                ) {
                    const htmlValue = node.value as string

                    // Parse HTML to MDX AST with processor for markdown parsing
                    const mdxNodes = parseHtmlToMdxAst({
                        html: htmlValue,
                        onError,
                        textToMdast: ({ text: x }) => {
                            const processor = remark().use(() => {
                                return (tree, file) => {
                                    file.data.ast = tree
                                }
                            })

                            const mdast = processor.parse(x) as any
                            processor.runSync(mdast)
                            return mdast
                        },
                        parentType: parent.type,
                    })

                    // Replace the HTML node with the MDX nodes
                    if (mdxNodes.length === 1) {
                        parent.children[index] = mdxNodes[0]
                    } else if (mdxNodes.length > 1) {
                        parent.children.splice(index, 1, ...mdxNodes)
                    } else {
                        // Remove the node if no content
                        parent.children.splice(index, 1)
                    }
                }
            })
        }
    }

    const processor = remark().use(remarkHtmlBlocks).use(remarkStringify, {})

    const mdast = processor.parse(markdown)
    processor.runSync(mdast)
    return remark().use(remarkMdx).use(remarkStringify, {}).stringify(mdast)
}

describe('Notion-specific HTML to MDX', () => {
    test('converts page element to MDX', async () => {
        const htmlToConvert = html`<page url="{{https://notion.so/test}}"
            >Test Page</page
        >`

        const mdxString = await htmlToMdxString({
            markdown: htmlToConvert,
            onError: (e) => {
                throw e
            },
        })
        expect(mdxString).toMatchInlineSnapshot(`
          "<page url="{{https://notion.so/test}}" />Test Page
          "
        `)
    })

    test('converts callout element to MDX', async () => {
        const htmlToConvert = html`<callout icon="📎" color="pink_bg"
            >Important note</callout
        >`

        const mdxString = await htmlToMdxString({
            markdown: htmlToConvert,
            onError: (e) => {
                throw e
            },
        })
        expect(mdxString).toMatchInlineSnapshot(`
          "<callout icon="📎" color="pink_bg" />Important note
          "
        `)
    })

    test('converts mention-page element to MDX', async () => {
        const htmlToConvert = html`<mention-page
            url="{{https://notion.so/test}}"
        />`

        const mdxString = await htmlToMdxString({
            markdown: htmlToConvert,
            onError: (e) => {
                throw e
            },
        })
        expect(mdxString).toMatchInlineSnapshot(`
          "<mention-page url="{{https://notion.so/test}}" />
          "
        `)
    })

    test('converts nested Notion elements to MDX', async () => {
        const htmlToConvert = html`
            <columns>
                <column>
                    <page url="{{https://notion.so/page1}}">Page 1</page>
                    Some text
                </column>
                <column>
                    <callout icon="💡" color="yellow_bg">
                        Important callout
                    </callout>
                </column>
            </columns>
        `

        const mdxString = await htmlToMdxString({
            markdown: htmlToConvert,
            onError: (e) => {
                throw e
            },
        })
        expect(mdxString).toMatchInlineSnapshot(`
          "<columns>
            <column>
              <page url="{{https://notion.so/page1}}">
                Page 1
              </page>

              Some text
            </column>

            <column>
              <callout icon="💡" color="yellow_bg">
                Important callout
              </callout>
            </column>
          </columns>
          "
        `)
    })

    test('handles mixed HTML and Notion elements', async () => {
        const htmlToConvert = html`<div>
            <h1>Title</h1>
            <page url="{{https://notion.so/test}}">Test Page</page>
            <p>Regular paragraph</p>
            <mention-page url="{{https://notion.so/another}}" />
        </div>`

        const mdxString = await htmlToMdxString({
            markdown: htmlToConvert,
            onError: (e) => {
                throw e
            },
        })
        expect(mdxString).toMatchInlineSnapshot(`
          "<div>
            <h1>
              Title
            </h1>

            <page url="{{https://notion.so/test}}">
              Test Page
            </page>

            <p>
              Regular paragraph
            </p>

            <mention-page url="{{https://notion.so/another}}" />
          </div>
          "
        `)
    })

    test('converts span with color attribute', async () => {
        const htmlToConvert = html`<span color="blue">Blue text</span>`

        const mdxString = await htmlToMdxString({
            markdown: htmlToConvert,
            onError: (e) => {
                throw e
            },
        })
        expect(mdxString).toMatchInlineSnapshot(`
          "<span color="blue" />Blue text
          "
        `)
    })

    test('handles table element conversion', async () => {
        const htmlToConvert = html`<table header-row="true">
            <tr>
                <td>Cell 1</td>
                <td>Cell 2</td>
            </tr>
        </table>`

        const mdxString = await htmlToMdxString({
            markdown: htmlToConvert,
            onError: (e) => {
                throw e
            },
        })
        expect(mdxString).toMatchInlineSnapshot(`
          "<table header-row="true">
            <tr>
              <td>
                Cell 1
              </td>

              <td>
                Cell 2
              </td>
            </tr>
          </table>
          "
        `)
    })

    test('handles image element conversion', async () => {
        const htmlToConvert = html`<image
            source="{{https://example.com/image.jpg}}"
            alt="Test image"
        />`

        const mdxString = await htmlToMdxString({
            markdown: htmlToConvert,
            onError: (e) => {
                throw e
            },
        })
        expect(mdxString).toMatchInlineSnapshot(`
          "<image source="{{https://example.com/image.jpg}}" alt="Test image" />
          "
        `)
    })

    test('handles unknown element conversion', async () => {
        const htmlToConvert = html`<unknown
            url="{{https://notion.so/embed}}"
            alt="embed"
        />`

        const mdxString = await htmlToMdxString({
            markdown: htmlToConvert,
            onError: (e) => {
                throw e
            },
        })
        expect(mdxString).toMatchInlineSnapshot(`
          "<unknown url="{{https://notion.so/embed}}" alt="embed" />
          "
        `)
    })

    test('handles columns with content', async () => {
        const htmlToConvert = html`<columns>
            <column>
                <h2>Section 1</h2>
                <page url="{{https://notion.so/page}}">Page Link</page>
            </column>
            <column>
                <callout icon="⚠️" color="yellow_bg">
                    <strong>Warning:</strong> Important information
                </callout>
            </column>
        </columns>`

        const mdxString = await htmlToMdxString({
            markdown: htmlToConvert,
            onError: (e) => {
                throw e
            },
        })
        expect(mdxString).toMatchInlineSnapshot(`
          "<columns>
            <column>
              <h2>
                Section 1
              </h2>

              <page url="{{https://notion.so/page}}">
                Page Link
              </page>
            </column>

            <column>
              <callout icon="⚠️" color="yellow_bg">
                <strong>
                  Warning:
                </strong>

                Important information
              </callout>
            </column>
          </columns>
          "
        `)
    })
})

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

    test('parses element without transforms (generic)', () => {
        const result = parseHtmlToMdxAst({
            html: '<page url="{{https://notion.so/test}}">Test Page</page>',
        })
        expect(result).toMatchInlineSnapshot(`
          [
            {
              "attributes": [
                {
                  "name": "url",
                  "type": "mdxJsxAttribute",
                  "value": "{{https://notion.so/test}}",
                },
              ],
              "children": [
                {
                  "type": "text",
                  "value": "Test Page",
                },
              ],
              "name": "page",
              "type": "mdxJsxTextElement",
            },
          ]
        `)
    })

    test('parses Notion page element', () => {
        const result = parseHtmlToMdxAst({
            html: '<page url="{{https://www.notion.so/test}}">Test Page</page>',
        })
        expect(result).toMatchInlineSnapshot(`
          [
            {
              "attributes": [
                {
                  "name": "url",
                  "type": "mdxJsxAttribute",
                  "value": "{{https://www.notion.so/test}}",
                },
              ],
              "children": [
                {
                  "type": "text",
                  "value": "Test Page",
                },
              ],
              "name": "page",
              "type": "mdxJsxTextElement",
            },
          ]
        `)
    })

    test('handles partial HTML - opening tag only', () => {
        const result = parseHtmlToMdxAst({ html: '<div>' })
        expect(result).toMatchInlineSnapshot(`
          [
            {
              "attributes": [],
              "children": [],
              "name": "div",
              "type": "mdxJsxTextElement",
            },
          ]
        `)
    })

    test('handles partial HTML - closing tag only', () => {
        const result = parseHtmlToMdxAst({ html: '</div>' })
        expect(result).toMatchInlineSnapshot(`
          []
        `)
    })

    test('handles self-closing tags', () => {
        const result = parseHtmlToMdxAst({
            html: '<img source="{{https://example.com/img.jpg}}" />',
        })
        expect(result).toMatchInlineSnapshot(`
          [
            {
              "attributes": [
                {
                  "name": "source",
                  "type": "mdxJsxAttribute",
                  "value": "{{https://example.com/img.jpg}}",
                },
              ],
              "children": [],
              "name": "img",
              "type": "mdxJsxTextElement",
            },
          ]
        `)
    })

    test('handles mention-page element', () => {
        const result = parseHtmlToMdxAst({
            html: '<mention-page url="{{https://www.notion.so/test}}" />',
        })
        expect(result).toMatchInlineSnapshot(`
          [
            {
              "attributes": [
                {
                  "name": "url",
                  "type": "mdxJsxAttribute",
                  "value": "{{https://www.notion.so/test}}",
                },
              ],
              "children": [],
              "name": "mention-page",
              "type": "mdxJsxTextElement",
            },
          ]
        `)
    })

    test('handles callout with attributes', () => {
        const result = parseHtmlToMdxAst({
            html: '<callout icon="📎" color="pink_bg">Some text</callout>',
        })
        expect(result).toMatchInlineSnapshot(`
          [
            {
              "attributes": [
                {
                  "name": "icon",
                  "type": "mdxJsxAttribute",
                  "value": "📎",
                },
                {
                  "name": "color",
                  "type": "mdxJsxAttribute",
                  "value": "pink_bg",
                },
              ],
              "children": [
                {
                  "type": "text",
                  "value": "Some text",
                },
              ],
              "name": "callout",
              "type": "mdxJsxTextElement",
            },
          ]
        `)
    })

    test('handles span with color', () => {
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
            html: 'Some text <page url="{{https://notion.so/test}}">Page</page> more text',
        })
        expect(result).toMatchInlineSnapshot(`
          [
            {
              "type": "text",
              "value": "Some text",
            },
            {
              "attributes": [
                {
                  "name": "url",
                  "type": "mdxJsxAttribute",
                  "value": "{{https://notion.so/test}}",
                },
              ],
              "children": [
                {
                  "type": "text",
                  "value": "Page",
                },
              ],
              "name": "page",
              "type": "mdxJsxTextElement",
            },
            {
              "type": "text",
              "value": "more text",
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
            html: '<table header-row="true"><tr><td>Cell</td></tr></table>',
        })
        expect(result).toMatchInlineSnapshot(`
          [
            {
              "attributes": [
                {
                  "name": "header-row",
                  "type": "mdxJsxAttribute",
                  "value": "true",
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

describe('parseHtmlToMdxAst without transforms (generic)', () => {
    test('preserves tag names without transform', () => {
        const result = parseHtmlToMdxAst({ html: '<page>Content</page>' })
        expect(result[0]).toHaveProperty('name', 'page')
    })

    test('preserves curly brace URLs without transform', () => {
        const result = parseHtmlToMdxAst({
            html: '<a href="{{https://example.com}}">Link</a>',
        })
        expect(result[0]).toHaveProperty('attributes')
        const attrs = (result[0] as any).attributes
        expect(attrs[0]).toHaveProperty('value', '{{https://example.com}}')
    })
})

describe('parseHtmlToMdxAst with markdown processor', () => {
    test('parses markdown inside HTML tags', async () => {
        const htmlToConvert = '<callout>This is **bold** text</callout>'
        const mdxString = await htmlToMdxString({
            markdown: htmlToConvert,

            onError: (e) => {
                throw e
            },
        })
        expect(mdxString).toMatchInlineSnapshot(`
          "<callout />This is **bold** text
          "
        `)
    })

    test('parses markdown links inside HTML', async () => {
        const htmlToConvert =
            '<span color="orange">[link](http://google.com)</span>'
        const mdxString = await htmlToMdxString({
            markdown: htmlToConvert,

            onError: (e) => {
                throw e
            },
        })
        expect(mdxString).toMatchInlineSnapshot(`
          "<span color="orange" />[link](http://google.com)
          "
        `)
    })

    test('parses mixed markdown and HTML inside tags', async () => {
        const htmlToConvert =
            '<callout>**Read next:** <mention-page url="https://notion.so/page"/></callout>'
        const mdxString = await htmlToMdxString({
            markdown: htmlToConvert,

            onError: (e) => {
                throw e
            },
        })
        expect(mdxString).toMatchInlineSnapshot(`
          "<callout />**Read next:** <mention-page url="https://notion.so/page" />
          "
        `)
    })

    test('handles bold inside span with underline', async () => {
        const htmlToConvert = '<span underline="true">  **sdf dsf**</span>'
        const mdxString = await htmlToMdxString({
            markdown: htmlToConvert,

            onError: (e) => {
                throw e
            },
        })
        expect(mdxString).toMatchInlineSnapshot(`
          "<span underline="true" />  **sdf dsf**
          "
        `)
    })

    test('converts markdown inside callout to MDX string', async () => {
        const htmlToConvert = html`<callout icon="👉" color="orange_bg"
            >**Read next:** Some page</callout
        >`
        const mdxString = await htmlToMdxString({
            markdown: htmlToConvert,

            onError: (e) => {
                throw e
            },
        })
        expect(mdxString).toMatchInlineSnapshot(`
          "<callout icon="👉" color="orange_bg" />**Read next:** Some page
          "
        `)
    })

    test('handles markdown inside table cells', async () => {
        const htmlToConvert =
            '<table><tr><td>**Bold** text and [link](http://example.com)</td></tr></table>'
        const mdxString = await htmlToMdxString({
            markdown: htmlToConvert,

            onError: (e) => {
                throw e
            },
        })
        expect(mdxString).toMatchInlineSnapshot(`
          "<table>
            <tr>
              <td>
                **Bold** text and [link](http://example.com)
              </td>
            </tr>
          </table>
          "
        `)
    })

    test('preserves plain text when no markdown', async () => {
        const htmlToConvert = '<div>Plain text without markdown</div>'
        const mdxString = await htmlToMdxString({
            markdown: htmlToConvert,

            onError: (e) => {
                throw e
            },
        })
        expect(mdxString).toMatchInlineSnapshot(`
          "<div>
            Plain text without markdown
          </div>
          "
        `)
    })

    test('handles nested HTML tags with markdown', async () => {
        const htmlToConvert =
            '<div><span>**Bold** and <a href="#">link</a></span></div>'
        const mdxString = await htmlToMdxString({
            markdown: htmlToConvert,

            onError: (e) => {
                throw e
            },
        })
        expect(mdxString).toMatchInlineSnapshot(`
          "<div>
            <span>
              **Bold** and

              <a href="#">
                link
              </a>
            </span>
          </div>
          "
        `)
    })
})
