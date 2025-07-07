import { expect, test, describe } from 'vitest'
import { parseEsmImports, extractComponentInfo } from './esm-parser.js'
import { mdxParse } from './parse.js'
import type { SafeMdxError } from './safe-mdx.js'

describe('parseEsmImports', () => {
    test('parses default imports from HTTPS URLs', () => {
        const code = `import MyComponent from 'https://esm.sh/some-component'`
        const mdast = mdxParse(code)
        const errors: SafeMdxError[] = []
        
        // Find the mdxjsEsm node
        const esmNode = mdast.children.find((node: any) => node.type === 'mdxjsEsm')
        const imports = parseEsmImports(esmNode, (err) => errors.push(err))

        expect(Array.from(imports.entries())).toMatchInlineSnapshot(`
          [
            [
              "MyComponent",
              "https://esm.sh/some-component",
            ],
          ]
        `)
        expect(errors).toMatchInlineSnapshot(`[]`)
    })

    test('parses named imports from HTTPS URLs', () => {
        const code = `import { Button, Card as MyCard } from 'https://esm.sh/ui-library'`
        const mdast = mdxParse(code)
        const errors: SafeMdxError[] = []
        
        const esmNode = mdast.children.find((node: any) => node.type === 'mdxjsEsm')
        const imports = parseEsmImports(esmNode, (err) => errors.push(err))

        expect(Array.from(imports.entries())).toMatchInlineSnapshot(`
          [
            [
              "Button",
              "https://esm.sh/ui-library#Button",
            ],
            [
              "MyCard",
              "https://esm.sh/ui-library#Card",
            ],
          ]
        `)
        expect(errors).toMatchInlineSnapshot(`[]`)
    })

    test('rejects non-HTTPS URLs', () => {
        const code = `
import Component1 from 'http://insecure.com/component'
import Component2 from 'file:///local/path'
import Component3 from './relative/path'
`
        const mdast = mdxParse(code)
        const errors: SafeMdxError[] = []
        
        mdast.children.forEach((node: any) => {
            if (node.type === 'mdxjsEsm') {
                parseEsmImports(node, (err) => errors.push(err))
            }
        })

        expect(errors).toMatchInlineSnapshot(`
          [
            {
              "line": 2,
              "message": "Invalid import URL: "http://insecure.com/component". Only HTTPS URLs are allowed for security reasons.",
            },
            {
              "line": 2,
              "message": "Invalid import URL: "file:///local/path". Only HTTPS URLs are allowed for security reasons.",
            },
            {
              "line": 2,
              "message": "Invalid import URL: "./relative/path". Only HTTPS URLs are allowed for security reasons.",
            },
          ]
        `)
    })

    test('handles multiple import types in one statement', () => {
        const code = `import Default, { Named1, Named2 as Alias } from 'https://esm.sh/mixed-exports'`
        const mdast = mdxParse(code)
        const errors: SafeMdxError[] = []
        
        const esmNode = mdast.children.find((node: any) => node.type === 'mdxjsEsm')
        const imports = parseEsmImports(esmNode, (err) => errors.push(err))

        expect(Array.from(imports.entries())).toMatchInlineSnapshot(`
          [
            [
              "Default",
              "https://esm.sh/mixed-exports",
            ],
            [
              "Named1",
              "https://esm.sh/mixed-exports#Named1",
            ],
            [
              "Alias",
              "https://esm.sh/mixed-exports#Named2",
            ],
          ]
        `)
        expect(errors).toMatchInlineSnapshot(`[]`)
    })

    test('returns empty map when no estree data', () => {
        const errors: SafeMdxError[] = []
        const node = { type: 'mdxjsEsm', position: { start: { line: 1 } } }

        const imports = parseEsmImports(node, (err) => errors.push(err))

        expect(imports.size).toBe(0)
        expect(errors).toMatchInlineSnapshot(`[]`)
    })
})

describe('extractComponentInfo', () => {
    test('extracts default import info', () => {
        const result = extractComponentInfo('https://esm.sh/component')
        expect(result).toMatchInlineSnapshot(`
          {
            "componentName": "default",
            "importUrl": "https://esm.sh/component",
          }
        `)
    })

    test('extracts named import info', () => {
        const result = extractComponentInfo('https://esm.sh/ui-library#Button')
        expect(result).toMatchInlineSnapshot(`
          {
            "componentName": "Button",
            "importUrl": "https://esm.sh/ui-library",
          }
        `)
    })
})