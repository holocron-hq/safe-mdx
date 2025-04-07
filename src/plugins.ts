import { Root, RootContent } from 'mdast'
import { collapseWhiteSpace } from 'collapse-white-space'
import { visit } from 'unist-util-visit'

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
