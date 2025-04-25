<div align='center'>
    <br/>
    <br/>
    <br/>
    <h3>safe-mdx</h3>
    <p>Render MDX in React without eval</p>
    <br/>
    <br/>
</div>

## Features

- Render MDX without `eval` on the server, so you can render MDX in Cloudflare Workers and Vercel Edge
- Works with React Server Components
- Supports custom MDX components

## Why

The default MDX renderer uses `eval` (or `new Function(code)`) to render MDX components in the server. This is a security risk if the MdX code comes from untrusted sources and it's not allowed in some environments like Cloudflare Workers.

For example in an hypothetical platform similar to Notion, where users can write Markdown and publish it as a website, an user could be able to write MDX code that extracts secrets from the server in the SSR pass, using this library that is not possible. This is what happened with Mintlify platform in 2024.

Some use cases for this package are:

- Render MDX in Cloudflare Workers and Vercel Edge
- Safely render dynamically generated MDX code, like inside a ChatGPT like interface
- Render user generated MDX, like in a multi-tenant SaaS app

<br>

## Install

```
npm i safe-mdx
```

## Usage

```tsx
import { SafeMdxRenderer } from 'safe-mdx'

const code = `
# Hello world

This is a paragraph

<Heading>Custom component</Heading>
`

export function Page() {
    return (
        <SafeMdxRenderer
            code={code}
            components={{
                // You can pass your own components here
                Heading({ children }) {
                    return <h1>{children}</h1>
                },
                p({ children }) {
                    return <p style={{ color: 'black' }}>{children}</p>
                },
                blockquote({ children }) {
                    return (
                        <blockquote style={{ color: 'black' }}>
                            {children}
                        </blockquote>
                    )
                },
            }}
        />
    )
}
```

## Change default MDX parser

If you want to use custom MDX plugins, you can pass your own MDX processed ast.

By default `safe-mdx` already has support for

- frontmatter
- gfm

```tsx
import { SafeMdxRenderer } from 'safe-mdx'
import { remark, Root } from 'remark'
import remarkMdx from 'remark-mdx'

const code = `
# Hello world

This is a paragraph

<Heading>Custom component</Heading>
`

const parser = remark()
    .use(remarkMdx)
    .use(() => {
        return (tree, file) => {
            file.data.ast = tree
        }
    })

const file = parser.processSync(code)
const mdast = file.data.ast as Root

export function Page() {
    return <SafeMdxRenderer code={code} mdast={mdast} />
}
```

## Reading the frontmatter

safe-mdx renderer ignores the frontmatter, to get its values you wil have to parse the MDX to mdast and read it there.

```tsx
import { SafeMdxRenderer } from 'safe-mdx'
import { remark } from 'remark'
import remarkFrontmatter from 'remark-frontmatter'
import { Yaml } from 'mdast'
import yaml from 'js-yaml'
import remarkMdx from 'remark-mdx'

const code = `
---
hello: 5
---

# Hello world
`

export function Page() {
    const parser = remark().use(remarkFrontmatter, ['yaml']).use(remarkMdx)

    const mdast = parser.parse(code)

    const yamlFrontmatter = mdast.children.find(
        (node) => node.type === 'yaml',
    ) as Yaml

    const parsedFrontmatter = yaml.load(yamlFrontmatter.value || '')

    console.log(parsedFrontmatter)
    return <SafeMdxRenderer code={code} mdast={mdast} />
}
```

## Override code block component

It's not pratical to override the code block component using `code` as a component override, because it will also be used for inline code blocks. It also does not have access to meta string and language.

Instead you can use `customTransformer` to return some jsx for a specific mdast node:

```tsx
<SafeMdxRenderer
    customTransformer={(node, transform) => {
        if (node.type === 'code') {
            const language = node.lang || ''
            const meta = parseMetaString(node.meta)

            return (
                <CodeBlock {...meta} lang={language}>
                    <Pre>
                        <ShikiRenderer code={node.value} language={language} />
                    </Pre>
                </CodeBlock>
            )
        }
    }}
/>
```

## Handling errors

`safe-mdx` ignores missing components or expressions, to show a message to the user in case of these errors you can use `MdastToJsx` directly

```tsx
import { MdastToJsx } from 'safe-mdx'

export function Page() {
    const visitor = new MdastToJsx({ code, mdast, components })
    const jsx = visitor.run()

    if (visitor.errors.length) {
        // handle errors here, like showing a message to the user for missing components
    }

    return jsx
}
```

## Security

safe-mdx is designed to avoid server-side evaluation of untrusted MDX input.

However, it's important to note that safe-mdx does not provide protection against client-side vulnerabilities, such as Cross-Site Scripting (XSS) or script injection attacks. While safe-mdx itself does not perform any evaluation or rendering of user-provided content, the rendering library or components used in conjunction with safe-mdx may introduce security risks if not properly configured or sanitized.

This is ok if you render your MDX in isolation from each tenant, for example on different subdomains, this way an XSS attack cannot affect all tenants. If instead you render the MDX from different tenants on the same domain, one tenant could steal cookies set from other customers.

## Limitations

These features are not supported yet:

- expressions or values defined with `export`
- importing components or data from other files

To overcome these limitations you can define custom logic in your components and pass them to `SafeMdxRenderer` `components` prop. This will also make your MDX files cleaner and easier to read.
