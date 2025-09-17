import remarkFrontmatter from 'remark-frontmatter'
import { collapseWhiteSpace } from 'collapse-white-space'
import { visit } from 'unist-util-visit'
import { Root, RootContent } from 'mdast'
import { remark } from 'remark'
import remarkGfm from 'remark-gfm'
import remarkMdx from 'remark-mdx'
import { parseHtmlToMdxAst } from './html/html-to-mdx-ast.js'

export { parseHtmlToMdxAst }

export function mdxParse(code: string) {
    const file = mdxProcessor.processSync(code)
    return file.data.ast as Root
}

/**
 * https://github.com/mdx-js/mdx/blob/b3351fadcb6f78833a72757b7135dcfb8ab646fe/packages/mdx/lib/plugin/remark-mark-and-unravel.js
 * A tiny plugin that unravels `<p><h1>x</h1></p>` but also
 * `<p><Component /></p>` (so it has no knowledge of "HTML").
 *
 * It also marks JSX as being explicitly JSX, so when a user passes a `h1`
 * component, it is used for `# heading` but not for `<h1>heading</h1>`.
 *
 */
export function remarkMarkAndUnravel() {
    return function (tree: Root) {
        visit(tree, function (node, index, parent) {
            let offset = -1
            let all = true
            let oneOrMore = false

            if (
                parent &&
                typeof index === 'number' &&
                node.type === 'paragraph'
            ) {
                const children = node.children

                while (++offset < children.length) {
                    const child = children[offset]

                    if (
                        child.type === 'mdxJsxTextElement' ||
                        child.type === 'mdxTextExpression'
                    ) {
                        oneOrMore = true
                    } else if (
                        child.type === 'text' &&
                        collapseWhiteSpace(child.value, {
                            style: 'html',
                            trim: true,
                        }) === ''
                    ) {
                        // Empty.
                    } else {
                        all = false
                        break
                    }
                }

                if (all && oneOrMore) {
                    offset = -1

                    const newChildren: RootContent[] = []

                    while (++offset < children.length) {
                        const child = children[offset]

                        if (child.type === 'mdxJsxTextElement') {
                            // @ts-expect-error: mutate because it is faster; content model is fine.
                            child.type = 'mdxJsxFlowElement'
                        }

                        if (child.type === 'mdxTextExpression') {
                            // @ts-expect-error: mutate because it is faster; content model is fine.
                            child.type = 'mdxFlowExpression'
                        }

                        if (
                            child.type === 'text' &&
                            /^[\t\r\n ]+$/.test(String(child.value))
                        ) {
                            // Empty.
                        } else {
                            newChildren.push(child)
                        }
                    }

                    parent.children.splice(index, 1, ...newChildren)
                    return index
                }
            }
        })
    }
}

const mdxProcessor = remark()
    .use(remarkMdx)
    .use(remarkFrontmatter, ['yaml', 'toml'])
    .use(remarkGfm)
    .use(remarkMarkAndUnravel)
    .use(() => {
        return (tree, file) => {
            file.data.ast = tree
        }
    })
