import React, { cloneElement } from 'react'
import { htmlToJsx } from 'html-to-jsx-transform'
import { Node, Parent, RootContent } from 'mdast'
import remarkFrontmatter from 'remark-frontmatter'

import { collapseWhiteSpace } from 'collapse-white-space'
import { visit } from 'unist-util-visit'

import { Root, Yaml } from 'mdast'
import { MdxJsxFlowElement, MdxJsxTextElement } from 'mdast-util-mdx-jsx'
import { remark } from 'remark'
import remarkGfm from 'remark-gfm'
import remarkMdx from 'remark-mdx'

import { Fragment, ReactNode } from 'react'

type MyRootContent = RootContent | Root

export function mdxParse(code: string) {
    const file = mdxProcessor.processSync(code)
    return file.data.ast as Root
}

declare module 'mdast' {
    export interface Data {
        hProperties?: {
            id?: string
        }
    }
}

export type CustomTransformer = (
    node: MyRootContent,
    transform: (node: MyRootContent) => ReactNode,
) => ReactNode | undefined

export function SafeMdxRenderer({
    components,
    code = '',
    mdast = null as any,
    customTransformer,
}: {
    components?: ComponentsMap
    code?: string
    mdast?: MyRootContent
    customTransformer?: CustomTransformer
}) {
    const visitor = new MdastToJsx({
        code,
        mdast,
        components,
        customTransformer,
    })
    const result = visitor.run()
    return result
}

export class MdastToJsx {
    mdast: MyRootContent
    str: string
    jsxStr: string = ''
    c: ComponentsMap
    errors: { message: string }[] = []
    customTransformer?: CustomTransformer

    constructor({
        code = '',
        mdast = undefined as any,
        components = {} as ComponentsMap,
        customTransformer,
    }: {
        code?: string
        mdast?: MyRootContent
        components?: ComponentsMap
        customTransformer?: (
            node: MyRootContent,
            transform: (node: MyRootContent) => ReactNode,
        ) => ReactNode | undefined
    }) {
        this.str = code
        this.mdast = mdast || mdxParse(code)
        this.customTransformer = customTransformer

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
            if (!res.length) {
                return null
            } else if (res.length === 1) {
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
            if (!res.length) {
                return null
            } else if (res.length === 1) {
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

        // Check for custom transformer first, giving it higher priority
        if (this.customTransformer) {
            const customResult = this.customTransformer(
                node,
                this.mdastTransformer.bind(this),
            )
            if (customResult !== undefined) {
                return customResult
            }
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
                const Tag = this.c[`h${level}`] ?? `h${level}`

                return (
                    <Tag {...node.data?.hProperties}>
                        {this.mapMdastChildren(node)}
                    </Tag>
                )
            }
            case 'paragraph': {
                return (
                    <this.c.p {...node.data?.hProperties}>
                        {this.mapMdastChildren(node)}
                    </this.c.p>
                )
            }
            case 'blockquote': {
                return (
                    <this.c.blockquote {...node.data?.hProperties}>
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
                const codeBlock = (className?: string) => (
                    <this.c.pre {...node.data?.hProperties}>
                        <this.c.code className={className}>{code}</this.c.code>
                    </this.c.pre>
                )

                if (language) {
                    if (
                        supportedLanguagesSet.has(
                            language as (typeof supportedLanguages)[number],
                        )
                    ) {
                        return codeBlock(`language-${language}`)
                    } else {
                        this.errors.push({
                            message: `Unsupported language ${language}`,
                        })
                        return codeBlock()
                    }
                }
                return codeBlock()
            }

            case 'list': {
                if (node.ordered) {
                    return (
                        <this.c.ol
                            start={node.start!}
                            {...node.data?.hProperties}
                        >
                            {this.mapMdastChildren(node)}
                        </this.c.ol>
                    )
                }
                return (
                    <this.c.ul {...node.data?.hProperties}>
                        {this.mapMdastChildren(node)}
                    </this.c.ul>
                )
            }
            case 'listItem': {
                // https://github.com/syntax-tree/mdast-util-gfm-task-list-item#syntax-tree
                if (node?.checked != null) {
                    return (
                        <this.c.li
                            data-checked={node.checked}
                            {...node.data?.hProperties}
                        >
                            {this.mapMdastChildren(node)}
                        </this.c.li>
                    )
                }
                return (
                    <this.c.li {...node.data?.hProperties}>
                        {this.mapMdastChildren(node)}
                    </this.c.li>
                )
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
                return (
                    <this.c.img
                        src={src}
                        alt={alt}
                        title={title}
                        {...node.data?.hProperties}
                    />
                )
            }
            case 'link': {
                const href = node.url || ''
                const title = node.title || ''
                return (
                    <this.c.a {...{ href, title }} {...node.data?.hProperties}>
                        {this.mapMdastChildren(node)}
                    </this.c.a>
                )
            }
            case 'strong': {
                return (
                    <this.c.strong {...node.data?.hProperties}>
                        {this.mapMdastChildren(node)}
                    </this.c.strong>
                )
            }
            case 'emphasis': {
                return (
                    <this.c.em {...node.data?.hProperties}>
                        {this.mapMdastChildren(node)}
                    </this.c.em>
                )
            }
            case 'delete': {
                return (
                    <this.c.del {...node.data?.hProperties}>
                        {this.mapMdastChildren(node)}
                    </this.c.del>
                )
            }
            case 'inlineCode': {
                if (!node.value) {
                    return []
                }
                return (
                    <this.c.code {...node.data?.hProperties}>
                        {node.value}
                    </this.c.code>
                )
            }
            case 'break': {
                return <this.c.br />
            }
            case 'root': {
                return <Fragment>{this.mapMdastChildren(node)}</Fragment>
            }
            case 'table': {
                const [head, ...body] = React.Children.toArray(
                    this.mapMdastChildren(node),
                )
                return (
                    <this.c.table {...node.data?.hProperties}>
                        {head && <this.c.thead>{head}</this.c.thead>}
                        {!!body?.length && <this.c.tbody>{body}</this.c.tbody>}
                    </this.c.table>
                )
            }
            case 'tableRow': {
                return (
                    <this.c.tr className='' {...node.data?.hProperties}>
                        {this.mapMdastChildren(node)}
                    </this.c.tr>
                )
            }
            case 'tableCell': {
                let content = this.mapMdastChildren(node)
                return (
                    <this.c.td className='' {...node.data?.hProperties}>
                        {content}
                    </this.c.td>
                )
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
                    <this.c.a href={href} {...node.data?.hProperties}>
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
                    message: `Expressions in jsx props are not supported (${attr.value
                        .replace(/\n+/g, ' ')
                        .replace(/ +/g, ' ')})`,
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
    'tfoot',
    'th',
    'thead',
    'tr',
    'ul',
    'video',
    'code',
    'pre',
    'figure',
    'canvas',
    'details',
    'dl',
    'dt',
    'dd',
    'fieldset',
    'footer',
    'header',
    'legend',
    'main',
    'mark',
    'nav',
    'progress',
    'summary',
    'time',
] as const

const supportedLanguages = [
    'abap',
    'abnf',
    'actionscript',
    'ada',
    'agda',
    'al',
    'antlr4',
    'apacheconf',
    'apex',
    'apl',
    'applescript',
    'aql',
    'arduino',
    'arff',
    'asciidoc',
    'asm6502',
    'asmatmel',
    'aspnet',
    'autohotkey',
    'autoit',
    'avisynth',
    'avro-idl',
    'bash',
    'basic',
    'batch',
    'bbcode',
    'bicep',
    'birb',
    'bison',
    'bnf',
    'brainfuck',
    'brightscript',
    'bro',
    'bsl',
    'c',
    'cfscript',
    'chaiscript',
    'cil',
    'clike',
    'clojure',
    'cmake',
    'cobol',
    'coffeescript',
    'concurnas',
    'coq',
    'cpp',
    'crystal',
    'csharp',
    'cshtml',
    'csp',
    'css-extras',
    'css',
    'csv',
    'cypher',
    'd',
    'dart',
    'dataweave',
    'dax',
    'dhall',
    'diff',
    'django',
    'dns-zone-file',
    'docker',
    'dot',
    'ebnf',
    'editorconfig',
    'eiffel',
    'ejs',
    'elixir',
    'elm',
    'erb',
    'erlang',
    'etlua',
    'excel-formula',
    'factor',
    'false',
    'firestore-security-rules',
    'flow',
    'fortran',
    'fsharp',
    'ftl',
    'gap',
    'gcode',
    'gdscript',
    'gedcom',
    'gherkin',
    'git',
    'glsl',
    'gml',
    'gn',
    'go-module',
    'go',
    'graphql',
    'groovy',
    'haml',
    'handlebars',
    'haskell',
    'haxe',
    'hcl',
    'hlsl',
    'hoon',
    'hpkp',
    'hsts',
    'http',
    'ichigojam',
    'icon',
    'icu-message-format',
    'idris',
    'iecst',
    'ignore',
    'inform7',
    'ini',
    'io',
    'j',
    'java',
    'javadoc',
    'javadoclike',
    'javascript',
    'javastacktrace',
    'jexl',
    'jolie',
    'jq',
    'js-extras',
    'js-templates',
    'jsdoc',
    'json',
    'json5',
    'jsonp',
    'jsstacktrace',
    'jsx',
    'julia',
    'keepalived',
    'keyman',
    'kotlin',
    'kumir',
    'kusto',
    'latex',
    'latte',
    'less',
    'lilypond',
    'liquid',
    'lisp',
    'livescript',
    'llvm',
    'log',
    'lolcode',
    'lua',
    'magma',
    'makefile',
    'markdown',
    'markup-templating',
    'markup',
    'matlab',
    'maxscript',
    'mel',
    'mermaid',
    'mizar',
    'mongodb',
    'monkey',
    'moonscript',
    'n1ql',
    'n4js',
    'nand2tetris-hdl',
    'naniscript',
    'nasm',
    'neon',
    'nevod',
    'nginx',
    'nim',
    'nix',
    'nsis',
    'objectivec',
    'ocaml',
    'opencl',
    'openqasm',
    'oz',
    'parigp',
    'parser',
    'pascal',
    'pascaligo',
    'pcaxis',
    'peoplecode',
    'perl',
    'php-extras',
    'php',
    'phpdoc',
    'plsql',
    'powerquery',
    'powershell',
    'processing',
    'prolog',
    'promql',
    'properties',
    'protobuf',
    'psl',
    'pug',
    'puppet',
    'pure',
    'purebasic',
    'purescript',
    'python',
    'q',
    'qml',
    'qore',
    'qsharp',
    'r',
    'racket',
    'reason',
    'regex',
    'rego',
    'renpy',
    'rest',
    'rip',
    'roboconf',
    'robotframework',
    'ruby',
    'rust',
    'sas',
    'sass',
    'scala',
    'scheme',
    'scss',
    'shell-session',
    'smali',
    'smalltalk',
    'smarty',
    'sml',
    'solidity',
    'solution-file',
    'soy',
    'sparql',
    'splunk-spl',
    'sqf',
    'sql',
    'squirrel',
    'stan',
    'stylus',
    'swift',
    'systemd',
    't4-cs',
    't4-templating',
    't4-vb',
    'tap',
    'tcl',
    'textile',
    'toml',
    'tremor',
    'tsx',
    'tt2',
    'turtle',
    'twig',
    'typescript',
    'typoscript',
    'unrealscript',
    'uorazor',
    'uri',
    'v',
    'vala',
    'vbnet',
    'velocity',
    'verilog',
    'vhdl',
    'vim',
    'visual-basic',
    'warpscript',
    'wasm',
    'web-idl',
    'wiki',
    'wolfram',
    'wren',
    'xeora',
    'xml-doc',
    'xojo',
    'xquery',
    'yaml',
    'yang',
    'zig',
] as const
const supportedLanguagesSet = new Set(supportedLanguages)

type ComponentsMap = { [k in (typeof nativeTags)[number]]?: any } & {
    [key: string]: any
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
