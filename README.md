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

-   Render MDX without `eval` on the server, so you can render MDX in Cloudflare Workers and Vercel Edge
-   Works with React Server Components
-   Supports custom MDX components
-   custom `createElement`. Pass a no-op function to use safe-mdx as a validation step.
-   use `componentPropsSchema` to validate component props against a schema (works with Zod, Valibot, etc).
-   ESM `https://` imports support with `allowClientEsmImports` option (disabled by default for security)
-   fast. 3ms to render the [full mdx document for Zod v3](https://github.com/colinhacks/zod/blob/0a49fa39348b7c72b19ddedc3b0f879bd395304b/packages/docs/content/packages/v3.mdx) (2500 lines)

## Why

The default MDX renderer uses `eval` (or `new Function(code)`) to render MDX components in the server. This is a security risk if the MdX code comes from untrusted sources and it's not allowed in some environments like Cloudflare Workers.

For example in an hypothetical platform similar to Notion, where users can write Markdown and publish it as a website, an user could be able to write MDX code that extracts secrets from the server in the SSR pass, using this library that is not possible. This is what happened with Mintlify platform in 2024.

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
import { mdxParse } from 'safe-mdx/parse'

const code = `
# Hello world

This is a paragraph

<Heading>Custom component</Heading>
`

export function Page() {
    const ast = mdxParse(code)
    return (
        <SafeMdxRenderer
            markdown={code}
            mdast={ast}
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

## JSX Components in Attributes

safe-mdx supports using JSX components inside component attributes, providing a secure alternative to JavaScript evaluation.

```tsx
import { SafeMdxRenderer } from 'safe-mdx'
import { mdxParse } from 'safe-mdx/parse'

const code = `
# Components in Attributes

<Card
  icon={<Icon name="star" />}
  actions={<Button variant="primary">Click me</Button>}
>
  Card content with JSX components in attributes
</Card>
`

export function Page() {
    const ast = mdxParse(code)
    return (
        <SafeMdxRenderer
            markdown={code}
            mdast={ast}
            components={{
                Card({ icon, actions, children }) {
                    return (
                        <div className="card">
                            <div className="header">
                                {icon}
                                <div className="actions">{actions}</div>
                            </div>
                            <div className="content">{children}</div>
                        </div>
                    )
                },
                Icon({ name }) {
                    return <span>⭐</span> // Your icon component
                },
                Button({ variant, children }) {
                    return <button className={variant}>{children}</button>
                },
            }}
        />
    )
}
```

### ESM Imports in Attributes

To use externally imported components in attributes, enable the `allowClientEsmImports` option:

```tsx
import { SafeMdxRenderer } from 'safe-mdx'
import { mdxParse } from 'safe-mdx/parse'

const code = `
import { Icon } from 'https://esm.sh/lucide-react'
import Button from 'https://esm.sh/my-ui-library'

# External Components in Attributes

<Card
  icon={<Icon name="star" />}
  action={<Button>External Button</Button>}
>
  Using externally imported components
</Card>
`

export function Page() {
    const ast = mdxParse(code)
    return (
        <SafeMdxRenderer
            markdown={code}
            mdast={ast}
            allowClientEsmImports={true} // Required for ESM imports
            components={{
                Card({ icon, action, children }) {
                    return (
                        <div className="card">
                            <div className="header">
                                {icon}
                                {action}
                            </div>
                            <div className="content">{children}</div>
                        </div>
                    )
                },
            }}
        />
    )
}
```

**Security Note**: ESM imports are disabled by default. Only enable `allowClientEsmImports` when you trust the MDX source, as it allows loading external code.

## Change default MDX parser

If you want to use custom MDX plugins, you can pass your own MDX processed ast.

By default `safe-mdx` already has support for

-   frontmatter
-   gfm

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
    return <SafeMdxRenderer markdown={code} mdast={mdast} />
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
    return <SafeMdxRenderer markdown={code} mdast={mdast} />
}
```

## Override code block component

It's not pratical to override the code block component using `code` as a component override, because it will also be used for inline code blocks. It also does not have access to meta string and language.

Instead you can use `renderNode` to return some jsx for a specific mdast node:

```tsx
<SafeMdxRenderer
    renderNode={(node, transform) => {
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
    const visitor = new MdastToJsx({ markdown: code, mdast, components })
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

-   expressions that use methods or functions, currently expressions are evaluated with [eval-estree-expression](https://github.com/jonschlinkert/eval-estree-expression) with the functions option disabled.
-   importing components or data from other files (unless `allowClientEsmImports` is enabled for https:// imports).
-   Exporting irresolvable or declaring components inline in the MDX

**Note**: JSX components in attributes are now supported! You can use React components inside attributes like `<Card icon={<Icon />}>` without relying on JavaScript evaluation.

To overcome the remaining limitations you can define custom logic in your components and pass them to `SafeMdxRenderer` `components` prop. This will also make your MDX files cleaner and easier to read.

## Future Roadmap

-   add support for scope parameter to allow referencing variables in expressions and code
