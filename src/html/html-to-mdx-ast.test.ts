import { test, expect, describe } from 'vitest'
import { parseHtmlToMdxAst, htmlToMdxAst } from './html-to-mdx-ast'
import { unified } from 'unified'
import remarkMdx from 'remark-mdx'
import remarkStringify from 'remark-stringify'
import remarkParse from 'remark-parse'
import { createNotionMdProcessor } from '../notion-md-to-mdx'
import { 
    notionConvertTagName, 
    notionTextToMdast, 
    notionConvertAttributeValue 
} from '../notion-transforms'

/** Template literal for auto formatting */
function html(
    strings: TemplateStringsArray,
    ...expressions: unknown[]
): string {
    let result = strings[0] ?? ''

    for (let i = 1, l = strings.length; i < l; i++) {
        result += expressions[i - 1]
        result += strings[i]
    }

    return result
}

// Helper to convert HTML to MDX string
async function htmlToMdxString({
    html,
    withProcessor = false,
    onError,
    useNotionTransforms = true
}: {
    html: string
    withProcessor?: boolean
    onError?: (error: unknown, text: string) => void
    useNotionTransforms?: boolean
}): Promise<string> {
    const markdownProcessor = withProcessor ? createNotionMdProcessor() : undefined
    const mdxAst = parseHtmlToMdxAst({
        html,
        processor: markdownProcessor,
        onError,
        ...(useNotionTransforms ? {
            convertTagName: notionConvertTagName,
            textToMdast: notionTextToMdast,
            convertAttributeValue: notionConvertAttributeValue
        } : {})
    })
    const processor = unified()
        .use(remarkMdx)
        .use(remarkStringify, {
            // bullet: '-',
            // fence: '`',
            // fences: true
        })

    // Create a root node with the content
    const root = {
        type: 'root',
        children: mdxAst
    }

    return processor.stringify(root as any)
}



describe('Notion-specific HTML to MDX', () => {
    test('converts page element to MDX', async () => {
        const htmlToConvert = html`<page url="{{https://notion.so/test}}">Test Page</page>`

        const mdxString = await htmlToMdxString({
            html: htmlToConvert,
            onError: (e) => { throw e }
        })
        expect(mdxString).toMatchInlineSnapshot(`
          "<Page url="https://notion.so/test">Test Page</Page>
          "
        `)
    })

    test('converts callout element to MDX', async () => {
        const htmlToConvert = html`<callout icon="📎" color="pink_bg">Important note</callout>`

        const mdxString = await htmlToMdxString({
            html: htmlToConvert,
            onError: (e) => { throw e }
        })
        expect(mdxString).toMatchInlineSnapshot(`
          "<Callout icon="📎" color="pink_bg">Important note</Callout>
          "
        `)
    })

    test('converts mention-page element to MDX', async () => {
        const htmlToConvert = html`<mention-page url="{{https://notion.so/test}}" />`

        const mdxString = await htmlToMdxString({
            html: htmlToConvert,
            onError: (e) => { throw e }
        })
        expect(mdxString).toMatchInlineSnapshot(`
          "<MentionPage url="https://notion.so/test" />
          "
        `)
    })

    test('converts nested Notion elements to MDX', async () => {
        const htmlToConvert = html`<columns>
            <column>
                <page url="{{https://notion.so/page1}}">Page 1</page>
                Some text
            </column>
            <column>
                <callout icon="💡" color="yellow_bg">
                    Important callout
                </callout>
            </column>
        </columns>`

        const mdxString = await htmlToMdxString({
            html: htmlToConvert,
            onError: (e) => { throw e }
        })
        expect(mdxString).toMatchInlineSnapshot(`
          "<Columns>
                      <Column>
                          <Page url="https://notion.so/page1">Page 1</Page>
                          Some text
                      </Column>
                      <Column>
                          <Callout icon="💡" color="yellow_bg">
                              Important callout
                          </Callout>
                      </Column>
                  </Columns>
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
            html: htmlToConvert,
            onError: (e) => { throw e }
        })
        expect(mdxString).toMatchInlineSnapshot(`
          "<div>
                      <h1>Title</h1>
                      <Page url="https://notion.so/test">Test Page</Page>
                      <p>Regular paragraph</p>
                      <MentionPage url="https://notion.so/another">
                  </MentionPage></div>
          "
        `)
    })

    test('converts span with color attribute', async () => {
        const htmlToConvert = html`<span color="blue">Blue text</span>`

        const mdxString = await htmlToMdxString({
            html: htmlToConvert,
            onError: (e) => { throw e }
        })
        expect(mdxString).toMatchInlineSnapshot(`
          "<span color="blue">Blue text</span>
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
            html: htmlToConvert,
            onError: (e) => { throw e }
        })
        expect(mdxString).toMatchInlineSnapshot(`
          "<Table header-row="true">
                      <tbody><tr>
                          <td>Cell 1</td>
                          <td>Cell 2</td>
                      </tr>
                  </tbody></Table>
          "
        `)
    })

    test('handles image element conversion', async () => {
        const htmlToConvert = html`<image source="{{https://example.com/image.jpg}}" alt="Test image" />`

        const mdxString = await htmlToMdxString({
            html: htmlToConvert,
            onError: (e) => { throw e }
        })
        expect(mdxString).toMatchInlineSnapshot(`
          "<img source="https://example.com/image.jpg" alt="Test image" />
          "
        `)
    })

    test('handles unknown element conversion', async () => {
        const htmlToConvert = html`<unknown url="{{https://notion.so/embed}}" alt="embed" />`

        const mdxString = await htmlToMdxString({
            html: htmlToConvert,
            onError: (e) => { throw e }
        })
        expect(mdxString).toMatchInlineSnapshot(`
          "<Unknown url="https://notion.so/embed" alt="embed" />
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
            html: htmlToConvert,
            onError: (e) => { throw e }
        })
        expect(mdxString).toMatchInlineSnapshot(`
          "<Columns>
                      <Column>
                          <h2>Section 1</h2>
                          <Page url="https://notion.so/page">Page Link</Page>
                      </Column>
                      <Column>
                          <Callout icon="⚠️" color="yellow_bg">
                              <strong>Warning:</strong> Important information
                          </Callout>
                      </Column>
                  </Columns>
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
        const result = parseHtmlToMdxAst({ html: '<page url="{{https://notion.so/test}}">Test Page</page>' })
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
            convertTagName: notionConvertTagName,
            convertAttributeValue: notionConvertAttributeValue
        })
        expect(result).toMatchInlineSnapshot(`
          [
            {
              "attributes": [
                {
                  "name": "url",
                  "type": "mdxJsxAttribute",
                  "value": "https://www.notion.so/test",
                },
              ],
              "children": [
                {
                  "type": "text",
                  "value": "Test Page",
                },
              ],
              "name": "Page",
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
            convertAttributeValue: notionConvertAttributeValue
        })
        expect(result).toMatchInlineSnapshot(`
          [
            {
              "attributes": [
                {
                  "name": "source",
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

    test('handles mention-page element', () => {
        const result = parseHtmlToMdxAst({
            html: '<mention-page url="{{https://www.notion.so/test}}" />',
            convertTagName: notionConvertTagName,
            convertAttributeValue: notionConvertAttributeValue
        })
        expect(result).toMatchInlineSnapshot(`
          [
            {
              "attributes": [
                {
                  "name": "url",
                  "type": "mdxJsxAttribute",
                  "value": "https://www.notion.so/test",
                },
              ],
              "children": [],
              "name": "MentionPage",
              "type": "mdxJsxTextElement",
            },
          ]
        `)
    })

    test('handles callout with attributes', () => {
        const result = parseHtmlToMdxAst({
            html: '<callout icon="📎" color="pink_bg">Some text</callout>',
            convertTagName: notionConvertTagName
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
              "name": "Callout",
              "type": "mdxJsxTextElement",
            },
          ]
        `)
    })

    test('handles span with color', () => {
        const result = parseHtmlToMdxAst({ html: '<span color="blue">colored text</span>' })
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
            convertTagName: notionConvertTagName,
            convertAttributeValue: notionConvertAttributeValue
        })
        expect(result).toMatchInlineSnapshot(`
          [
            {
              "type": "text",
              "value": "Some text ",
            },
            {
              "attributes": [
                {
                  "name": "url",
                  "type": "mdxJsxAttribute",
                  "value": "https://notion.so/test",
                },
              ],
              "children": [
                {
                  "type": "text",
                  "value": "Page",
                },
              ],
              "name": "Page",
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
            html: '<table header-row="true"><tr><td>Cell</td></tr></table>',
            convertTagName: notionConvertTagName
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
                  "name": "tbody",
                  "type": "mdxJsxTextElement",
                },
              ],
              "name": "Table",
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
        const result = parseHtmlToMdxAst({ html: '<a href="{{https://example.com}}">Link</a>' })
        expect(result[0]).toHaveProperty('attributes')
        const attrs = (result[0] as any).attributes
        expect(attrs[0]).toHaveProperty('value', '{{https://example.com}}')
    })
})

describe('parseHtmlToMdxAst with markdown processor', () => {
    test('parses markdown inside HTML tags', async () => {
        const htmlToConvert = '<callout>This is **bold** text</callout>'
        const mdxString = await htmlToMdxString({
            html: htmlToConvert,
            withProcessor: true,
            onError: (e) => { throw e }
        })
        expect(mdxString).toMatchInlineSnapshot(`
          "<Callout>This is **bold** text</Callout>
          "
        `)
    })

    test('parses markdown links inside HTML', async () => {
        const htmlToConvert = '<span color="orange">[link](http://google.com)</span>'
        const mdxString = await htmlToMdxString({
            html: htmlToConvert,
            withProcessor: true,
            onError: (e) => { throw e }
        })
        expect(mdxString).toMatchInlineSnapshot(`
          "<span color="orange">[link](http://google.com)</span>
          "
        `)
    })

    test('parses mixed markdown and HTML inside tags', async () => {
        const htmlToConvert = '<callout>**Read next:** <mention-page url="https://notion.so/page"/></callout>'
        const mdxString = await htmlToMdxString({
            html: htmlToConvert,
            withProcessor: true,
            onError: (e) => { throw e }
        })
        expect(mdxString).toMatchInlineSnapshot(`
          "<Callout>**Read next:**<MentionPage url="https://notion.so/page" /></Callout>
          "
        `)
    })

    test('handles bold inside span with underline', async () => {
        const htmlToConvert = '<span underline="true">  **sdf dsf**</span>'
        const mdxString = await htmlToMdxString({
            html: htmlToConvert,
            withProcessor: true,
            onError: (e) => { throw e }
        })
        expect(mdxString).toMatchInlineSnapshot(`
          "<span underline="true">**sdf dsf**</span>
          "
        `)
    })

    test('converts markdown inside callout to MDX string', async () => {
        const htmlToConvert = html`<callout icon="👉" color="orange_bg">**Read next:** Some page</callout>`
        const mdxString = await htmlToMdxString({
            html: htmlToConvert,
            withProcessor: true,
            onError: (e) => { throw e }
        })
        expect(mdxString).toMatchInlineSnapshot(`
          "<Callout icon="👉" color="orange_bg">**Read next:** Some page</Callout>
          "
        `)
    })

    test('handles markdown inside table cells', async () => {
        const htmlToConvert = '<table><tr><td>**Bold** text and [link](http://example.com)</td></tr></table>'
        const mdxString = await htmlToMdxString({
            html: htmlToConvert,
            withProcessor: true,
            onError: (e) => { throw e }
        })
        expect(mdxString).toMatchInlineSnapshot(`
          "<Table><tbody><tr><td>**Bold** text and [link](http://example.com)</td></tr></tbody></Table>
          "
        `)
    })

    test('preserves plain text when no markdown', async () => {
        const htmlToConvert = '<div>Plain text without markdown</div>'
        const mdxString = await htmlToMdxString({
            html: htmlToConvert,
            withProcessor: true,
            onError: (e) => { throw e }
        })
        expect(mdxString).toMatchInlineSnapshot(`
          "<div>Plain text without markdown</div>
          "
        `)
    })

    test('handles nested HTML tags with markdown', async () => {
        const htmlToConvert = '<div><span>**Bold** and <a href="#">link</a></span></div>'
        const mdxString = await htmlToMdxString({
            html: htmlToConvert,
            withProcessor: true,
            onError: (e) => { throw e }
        })
        expect(mdxString).toMatchInlineSnapshot(`
          "<div><span>**Bold** and<a href="#">link</a></span></div>
          "
        `)
    })
})
