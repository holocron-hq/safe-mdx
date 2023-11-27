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

-   Render MDX without `eval`, so you can render MDX in Cloudflare Workers and Vercel Edge
-   Works with React Server Components
-   Supports custom MDX components

## Why

The default MDX renderer uses `eval` (or `new Function(code)`) to render MDX components. This is a security risk if the MdX code comes from untrusted sources and it's not allowed in some environments like Cloudflare Workers.

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

## Limitations

These features are not supported yet:

-   expressions with dynamic values or values defined with `export`
-   importing components or data from other files

To overcome these limitations you can define custom logic in your components and pass them to `SafeMdxRenderer`. This will also make your MDX files cleaner and easier to read.
