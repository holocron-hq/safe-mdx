<div align='center'>
    <br/>
    <br/>
    <br/>
    <h3>safe-mdx</h3>
    <p>Render MDX in React without eval</p>
    <br/>
    <br/>
</div>

## Why

The default MDX renderer uses `eval` to render MDX components. This is a security risk and it's not allowed in some environments like Cloudflare Workers.

Some use cases for this package are:

-   Render MDX in Cloudflare Workers and Vercel Edge
-   Safely render dynamically generated MDX code, like inside a ChatGPT like interface
-   Render user generated MDX, like in a multi-tenant SaaS app

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
        <MdxRenderer
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

-   frontmatter
-   gfm

```tsx
import { SafeMdxRenderer } from 'safe-mdx'
import { remark } from 'remark'
import remarkMdx from 'remark-mdx'

const code = `
# Hello world

This is a paragraph

<Heading>Custom component</Heading>
`

const parser = remark().use(remarkMdx)

const mdast = parser.parse(code)

export function Page() {
    return <MdxRenderer code={code} mdast={mdast} />
}
```
