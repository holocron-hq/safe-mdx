import React from 'react'
import { SafeMdxRenderer } from '../src/safe-mdx'
import { mdxParse } from '../src/parse'
import './index.css'

const mdxContent = `
import IOKnob from 'https://framer.com/m/IOKnob-DT0M.js@eZsKjfnRtnN8np5uwoAx'

# Welcome to Safe MDX Demo

This is a demo of the **safe-mdx** package with React and Tailwind CSS v4.

## Features

- 🚀 Fast and secure MDX rendering
- 🎨 Styled with Tailwind CSS v4
- ⚡ Powered by Vite

## Code Example

\`\`\`javascript
const greeting = "Hello, Safe MDX!"
console.log(greeting)
\`\`\`

## Interactive Component

Here's an example of an ESM component loaded from a URL:

<IOKnob className='flex flex-col w-full mx-auto' />

## Lists

### Unordered List
- First item
- Second item
- Third item

### Ordered List
1. First step
2. Second step
3. Third step

## Table

| Feature | Status |
|---------|--------|
| MDX Support | ✅ |
| ESM Components | ✅ |
| Tailwind CSS | ✅ |

## Blockquote

> This is a blockquote demonstrating how safe-mdx handles various markdown elements.

---

Built with ❤️ using safe-mdx
`

export function App() {
    const ast = mdxParse(mdxContent)

    return (
        <div className='min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 p-8'>
            <div className='mx-auto max-w-4xl'>
                <article className='prose prose-slate lg:prose-lg dark:prose-invert mx-auto bg-white dark:bg-slate-800 rounded-lg shadow-xl p-8'>
                    <SafeMdxRenderer
                        markdown={mdxContent}
                        mdast={ast}
                        allowClientEsmImports={true}
                    />
                </article>
            </div>
        </div>
    )
}
