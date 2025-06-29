import { bench, describe } from 'vitest'
import { mdxParse } from './parse.js'
import { MdastToJsx } from './safe-mdx.js'

let longMdxContent = await fetch(
    'https://raw.githubusercontent.com/colinhacks/zod/0a49fa39348b7c72b19ddedc3b0f879bd395304b/packages/docs/content/packages/v3.mdx',
).then((x) => x.text())

const mdast = mdxParse(longMdxContent)

describe('safe-mdx performance benchmarks', () => {
    bench('MdastToJsx class processing (long MDX)', () => {
        const visitor = new MdastToJsx({
            markdown: longMdxContent,
            mdast,
            components: {},
        })
        visitor.run()
    })

    bench('MdastToJsx with noop createElement (long MDX)', () => {
        const noopCreateElement = () => null
        const visitor = new MdastToJsx({
            markdown: longMdxContent,
            mdast,
            components: {},
            createElement: noopCreateElement,
        })
        visitor.run()
    })
})
