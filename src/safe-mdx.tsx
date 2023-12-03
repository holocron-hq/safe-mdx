import React, { cloneElement } from 'react'
import { htmlToJsx } from 'html-to-jsx-transform'
import { Node, Parent } from 'mdast'
import remarkFrontmatter from 'remark-frontmatter'

import { Root, RootContent } from 'mdast'
import { MdxJsxFlowElement, MdxJsxTextElement } from 'mdast-util-mdx-jsx'
import { remark } from 'remark'
import remarkGfm from 'remark-gfm'
import remarkMdx from 'remark-mdx'

import { Fragment, ReactNode } from 'react'

type MyRootContent = RootContent | Root

const mdxParser = remark()
    .use(remarkFrontmatter, ['yaml', 'toml'])
    .use(remarkGfm)
    .use(remarkMdx) as any

void React

export function SafeMdxRenderer({
    components,
    code = '',
    mdast = null as any,
}) {
    const visitor = new MdastToJsx({ code, mdast, components })
    const result = visitor.run()
    return result
}

const nativeTags = [
    'blockquote',
    'strong',
    'em',
    'del',
    'hr',
    'a',
    'b',
    'br',
    'button',
    'div',
    'form',
    'h1',
    'h2',
    'h3',
    'h4',
    'head',
    'iframe',
    'img',
    'input',
    'label',
    'li',
    'link',
    'ol',
    'p',
    'path',
    'picture',
    'script',
    'section',
    'source',
    'span',
    'sub',
    'sup',
    'svg',
    'table',
    'tbody',
    'td',
    'th',
    'thead',
    'tr',
    'ul',
    'video',
    'code',
    'pre',
] as const

type ComponentsMap = { [k in (typeof nativeTags)[number]]?: any }

export class MdastToJsx {
    mdast: MyRootContent
    str: string
    jsxStr: string = ''
    c: ComponentsMap
    errors: { message: string }[] = []
    constructor({
        code = '',
        mdast = undefined as any,
        components = {} as ComponentsMap,
    }) {
        this.str = code
        this.mdast = mdast || mdxParser.parse(code)
        this.c = {
            ...Object.fromEntries(
                nativeTags.map((tag) => {
                    return [tag, tag]
                }),
            ),
            ...components,
        }
    }
    mapMdastChildren(node: any) {
        const res = node.children
            ?.flatMap((child) => this.mdastTransformer(child))
            .filter(Boolean)
        if (Array.isArray(res)) {
            if (res.length === 1) {
                return res[0]
            } else {
                return res.map((x, i) =>
                    React.isValidElement(x) ? cloneElement(x, { key: i }) : x,
                )
            }
        }
        return res || null
    }
    mapJsxChildren(node: any) {
        const res = node.children
            ?.flatMap((child, i) => this.jsxTransformer(child))
            .filter(Boolean)
        if (Array.isArray(res)) {
            if (res.length === 1) {
                return res[0]
            } else {
                return res.map((x, i) =>
                    React.isValidElement(x) ? cloneElement(x, { key: i }) : x,
                )
            }
        }
        return res || null
    }
    jsxTransformer(node: MyRootContent): ReactNode {
        if (!node) {
            return []
        }

        switch (node.type) {
            case 'mdxJsxTextElement':
            case 'mdxJsxFlowElement': {
                if (!node.name) {
                    return []
                }

                const Component = accessWithDot(this.c, node.name)

                if (!Component) {
                    this.errors.push({
                        message: `Unsupported jsx component ${node.name}`,
                    })
                    return null
                }

                let attrsList = getJsxAttrs(node, (err) => {
                    this.errors.push(err)
                })

                let attrs = Object.fromEntries(attrsList)
                return (
                    <Component {...attrs}>
                        {this.mapJsxChildren(node)}
                    </Component>
                )
            }
            default: {
                return this.mdastTransformer(node)
            }
        }
    }

    run() {
        const res = this.mdastTransformer(this.mdast) as ReactNode
        if (Array.isArray(res) && res.length === 1) {
            return res[0]
        }
        return res
    }

    mdastTransformer(node: MyRootContent): ReactNode {
        if (!node) {
            return []
        }

        switch (node.type) {
            case 'mdxjsEsm': {
                const start = node.position?.start?.offset
                const end = node.position?.end?.offset
                let text = this.str.slice(start, end)

                return []
            }
            case 'mdxJsxTextElement':
            case 'mdxJsxFlowElement': {
                const start = node.position?.start?.offset
                const end = node.position?.end?.offset
                const text = this.str.slice(start, end)
                try {
                    this.jsxStr = text
                    const result = this.jsxTransformer(node)
                    if (Array.isArray(result)) {
                        console.log(`Unexpected array result`)
                    } else if (result) {
                        return result
                    }
                } finally {
                    this.jsxStr = ''
                }
                return []
            }

            case 'mdxFlowExpression':
            case 'mdxTextExpression': {
                if (!node.value) {
                    return []
                }
                return []
            }
            case 'yaml': {
                if (!node.value) {
                    return []
                }
                return []
            }
            case 'heading': {
                const level = node.depth

                const Tag: any = `h${level}`
                return <Tag>{this.mapMdastChildren(node)}</Tag>
            }
            case 'paragraph': {
                return <this.c.p>{this.mapMdastChildren(node)}</this.c.p>
            }
            case 'blockquote': {
                return (
                    <this.c.blockquote>
                        {this.mapMdastChildren(node)}
                    </this.c.blockquote>
                )
            }
            case 'thematicBreak': {
                return <this.c.hr />
            }
            case 'code': {
                if (!node.value) {
                    return []
                }
                const language = node.lang || ''
                const code = node.value
                return (
                    <this.c.pre>
                        <this.c.code>{code}</this.c.code>
                    </this.c.pre>
                )
            }

            case 'list': {
                if (node.ordered) {
                    return (
                        <this.c.ol start={node.start!}>
                            {this.mapMdastChildren(node)}
                        </this.c.ol>
                    )
                }
                return <this.c.ul>{this.mapMdastChildren(node)}</this.c.ul>
            }
            case 'listItem': {
                // https://github.com/syntax-tree/mdast-util-gfm-task-list-item#syntax-tree
                if (node?.checked != null) {
                    return (
                        <this.c.li data-checked={node.checked}>
                            {this.mapMdastChildren(node)}
                        </this.c.li>
                    )
                }
                return <this.c.li>{this.mapMdastChildren(node)}</this.c.li>
            }
            case 'text': {
                if (!node.value) {
                    return []
                }
                return node.value
            }
            case 'image': {
                const src = node.url || ''
                const alt = node.alt || ''
                const title = node.title || ''
                return <this.c.img src={src} alt={alt} title={title} />
            }
            case 'link': {
                const href = node.url || ''
                const title = node.title || ''
                return (
                    <this.c.a {...{ href, title }}>
                        {this.mapMdastChildren(node)}
                    </this.c.a>
                )
            }
            case 'strong': {
                return (
                    <this.c.strong>{this.mapMdastChildren(node)}</this.c.strong>
                )
            }
            case 'emphasis': {
                return <this.c.em>{this.mapMdastChildren(node)}</this.c.em>
            }
            case 'delete': {
                return <this.c.del>{this.mapMdastChildren(node)}</this.c.del>
            }
            case 'inlineCode': {
                if (!node.value) {
                    return []
                }
                return <this.c.code>{node.value}</this.c.code>
            }
            case 'break': {
                return <this.c.br />
            }
            case 'root': {
                return <Fragment>{this.mapMdastChildren(node)}</Fragment>
            }
            case 'table': {
                const align = node.align
                return (
                    <this.c.table>{this.mapMdastChildren(node)}</this.c.table>
                )
            }
            case 'tableRow': {
                return (
                    <this.c.tr className=''>
                        {this.mapMdastChildren(node)}
                    </this.c.tr>
                )
            }
            case 'tableCell': {
                let content = this.mapMdastChildren(node)

                return <this.c.td className=''>{content}</this.c.td>
            }
            case 'definition': {
                return []
            }
            case 'linkReference': {
                let href = ''
                mdastBfs(this.mdast, (child: any) => {
                    if (
                        child.type === 'definition' &&
                        child.identifier === node.identifier
                    ) {
                        href = child.url
                    }
                })

                return (
                    <this.c.a href={href}>
                        {this.mapMdastChildren(node)}
                    </this.c.a>
                )
            }
            case 'footnoteReference': {
                return []
            }

            case 'footnoteDefinition': {
                return []
            }
            case 'html': {
                const start = node.position?.start?.offset
                const end = node.position?.end?.offset
                const text = this.str.slice(start, end)
                if (!text) {
                    return []
                }

                const jsx = htmlToJsx(text)
                try {
                    this.jsxStr = jsx
                    const result = this.jsxTransformer(node)
                    if (Array.isArray(result)) {
                        console.log(`Unexpected array result`)
                    } else if (result) {
                        return result
                    }
                } finally {
                    this.jsxStr = ''
                }

                return []
            }
            case 'imageReference': {
                return []
            }

            default: {
                mdastBfs(node, (node) => {
                    delete node.position
                })

                throw new Error(
                    `cannot convert node` + JSON.stringify(node, null, 2),
                )

                return []
            }
        }
    }
}

export function getJsxAttrs(
    node: MdxJsxFlowElement | MdxJsxTextElement,
    onError: (err: { message: string }) => void = console.error,
) {
    let attrsList = node.attributes
        .map((attr) => {
            if (attr.type === 'mdxJsxExpressionAttribute') {
                onError({
                    message: `Expressions in jsx props are not supported (${attr.value.replace(
                        /\n+/g,
                        ' ',
                    )})`,
                })
                return
            }
            if (attr.type !== 'mdxJsxAttribute') {
                throw new Error(`non mdxJsxAttribute is not supported: ${attr}`)
            }

            const v = attr.value
            if (typeof v === 'string' || typeof v === 'number') {
                return [attr.name, v]
            }
            if (v === null) {
                return [attr.name, true]
            }
            if (v?.type === 'mdxJsxAttributeValueExpression') {
                if (v.value === 'true') {
                    return [attr.name, true]
                }
                if (v.value === 'false') {
                    return [attr.name, false]
                }
                if (v.value === 'null') {
                    return [attr.name, null]
                }
                if (v.value === 'undefined') {
                    return [attr.name, undefined]
                }
                let quote = ['"', "'", '`'].find(
                    (q) => v.value.startsWith(q) && v.value.endsWith(q),
                )
                if (quote) {
                    let value = v.value
                    if (quote !== '"') {
                        value = v.value.replace(new RegExp(quote, 'g'), '"')
                    }
                    return [attr.name, JSON.parse(value)]
                }

                const number = Number(v.value)
                if (!isNaN(number)) {
                    return [attr.name, number]
                }
                const parsedJson = safeJsonParse(v.value)
                if (parsedJson) {
                    return [attr.name, parsedJson]
                }

                onError({
                    message: `Expressions in jsx props are not supported (${attr.name}={${v.value}})`,
                })
            } else {
                console.log('unhandled attr', { attr }, attr.type)
            }

            return
        })
        .filter(isTruthy) as [string, any][]
    return attrsList
}

function isTruthy<T>(val: T | undefined | null | false): val is T {
    return Boolean(val)
}

function accessWithDot(obj, path: string) {
    return path
        .split('.')
        .map((x) => x.trim())
        .filter(Boolean)
        .reduce((o, i) => o[i], obj)
}

export function mdastBfs(
    node: Parent | Node,
    cb?: (node: Node | Parent) => any,
) {
    const queue = [node]
    const result: any[] = []
    while (queue.length) {
        const node = queue.shift()
        let r = cb && node ? cb(node) : node
        if (Array.isArray(r)) {
            queue.push(...r)
        } else if (r) {
            result.push(r)
        }
        if (node && 'children' in node && node.children) {
            queue.push(...(node.children as any))
        }
    }
    return result
}

function safeJsonParse(str: string) {
    try {
        return JSON.parse(str)
    } catch (err) {
        return null
    }
}
