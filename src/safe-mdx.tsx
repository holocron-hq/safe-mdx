import React, { Suspense, cloneElement } from 'react'

import type { StandardSchemaV1 } from '@standard-schema/spec'
import type { JSXElement } from 'estree-jsx'
import Evaluate from 'eval-estree-expression'
import type { Node, Parent, Root, RootContent } from 'mdast'
import type { MdxJsxFlowElement, MdxJsxTextElement } from 'mdast-util-mdx-jsx'

import { Fragment, ReactNode } from 'react'
import { DynamicEsmComponent } from './dynamic-esm-component.js'
import { extractComponentInfo, parseEsmImports } from './esm-parser.js'

const HtmlToJsxConverter = React.lazy(() =>
    import('./HtmlToJsxConverter.js').then((module) => ({
        default: module.HtmlToJsxConverter,
    })),
)

export type MyRootContent = RootContent | Root

declare module 'mdast' {
    export interface HProperties {
        id?: string
    }
    export interface Data {
        hProperties?: HProperties
    }
}

export type RenderNode = (
    node: MyRootContent,
    transform: (node: MyRootContent) => ReactNode,
) => ReactNode | undefined

export interface SafeMdxError {
    message: string
    line?: number
    schemaPath?: string
}

export type ComponentPropsSchema = Record<string, StandardSchemaV1>

export type CreateElementFunction = (
    type: any,
    props?: any,
    ...children: ReactNode[]
) => ReactNode

export const SafeMdxRenderer = React.memo(function SafeMdxRenderer({
    components,
    markdown = '',
    mdast = null as any,
    renderNode,
    componentPropsSchema,
    createElement,
    allowClientEsmImports = false,
    addMarkdownLineNumbers = false,
}: {
    components?: ComponentsMap
    markdown?: string
    mdast: MyRootContent
    renderNode?: RenderNode
    componentPropsSchema?: ComponentPropsSchema
    createElement?: CreateElementFunction
    allowClientEsmImports?: boolean
    addMarkdownLineNumbers?: boolean
}) {
    const visitor = new MdastToJsx({
        markdown,
        mdast,
        components,
        renderNode,
        componentPropsSchema,
        createElement,
        allowClientEsmImports,
        addMarkdownLineNumbers,
    })
    const result = visitor.run()
    return result
})

export class MdastToJsx {
    mdast: MyRootContent
    str: string
    jsxStr: string = ''
    c: ComponentsMap
    errors: SafeMdxError[] = []
    renderNode?: RenderNode
    componentPropsSchema?: ComponentPropsSchema
    createElement: CreateElementFunction
    esmImports: Map<string, string> = new Map()
    allowClientEsmImports: boolean
    addMarkdownLineNumbers: boolean

    constructor({
        markdown: code = '',
        mdast,
        components = {} as ComponentsMap,
        renderNode,
        componentPropsSchema,
        createElement = React.createElement,
        allowClientEsmImports = false,
        addMarkdownLineNumbers = false,
    }: {
        markdown?: string
        mdast: MyRootContent
        components?: ComponentsMap
        renderNode?: (
            node: MyRootContent,
            transform: (node: MyRootContent) => ReactNode,
        ) => ReactNode | undefined
        componentPropsSchema?: ComponentPropsSchema
        createElement?: CreateElementFunction
        allowClientEsmImports?: boolean
        addMarkdownLineNumbers?: boolean
    }) {
        this.str = code

        this.mdast = mdast

        this.renderNode = renderNode

        this.componentPropsSchema = componentPropsSchema

        this.createElement = createElement

        this.allowClientEsmImports = allowClientEsmImports

        this.addMarkdownLineNumbers = addMarkdownLineNumbers

        this.c = {
            ...Object.fromEntries(
                nativeTags.map((tag) => {
                    return [tag, tag]
                }),
            ),
            ...components,
        }
    }

    addLineNumberToProps(
        props: Record<string, any> | undefined,
        node: MyRootContent,
    ): Record<string, any> {
        if (!this.addMarkdownLineNumbers) {
            return props || {}
        }

        const lineNumber = node.position?.start?.line
        if (lineNumber) {
            return {
                ...props,
                'data-markdown-line': lineNumber,
            }
        }
        return props || {}
    }

    validateComponentProps(
        componentName: string,
        props: Record<string, any>,
        line?: number,
    ): void {
        if (
            !this.componentPropsSchema ||
            !this.componentPropsSchema[componentName]
        ) {
            return
        }

        const schema = this.componentPropsSchema[componentName]
        let result = schema['~standard'].validate(props)

        if (result instanceof Promise) {
            // Ignore async validation errors as requested
            return
        } else {
            if (result.issues) {
                result.issues.forEach((issue) => {
                    const propPath = issue.path?.join('.') || 'unknown'
                    this.errors.push({
                        message: `Invalid props for component "${componentName}" at "${propPath}": ${issue.message}`,
                        line,
                        schemaPath: issue.path?.join('.'),
                    })
                })
            }
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

                // Check if this is an ESM imported component (only if allowed)
                const esmImportInfo = this.allowClientEsmImports
                    ? this.esmImports.get(node.name)
                    : null
                let Component

                if (esmImportInfo) {
                    // Handle ESM imported component
                    const { importUrl, componentName } =
                        extractComponentInfo(esmImportInfo)

                    Component = DynamicEsmComponent
                    let attrsList = this.getJsxAttrs(node, (err) => {
                        this.errors.push(err)
                    })
                    let attrs = Object.fromEntries(attrsList)

                    return this.createElement(
                        Component,
                        this.addLineNumberToProps(
                            { ...attrs, importUrl, componentName },
                            node,
                        ),
                        this.mapJsxChildren(node),
                    )
                } else {
                    Component = accessWithDot(this.c, node.name)

                    if (!Component) {
                        this.errors.push({
                            message: `Unsupported jsx component ${node.name}`,
                            line: node.position?.start?.line,
                        })
                        return null
                    }
                }

                let attrsList = this.getJsxAttrs(node, (err) => {
                    this.errors.push(err)
                })

                let attrs = Object.fromEntries(attrsList)

                // Validate component props with schema if available
                this.validateComponentProps(
                    node.name,
                    attrs,
                    node.position?.start?.line,
                )

                return this.createElement(
                    Component,
                    this.addLineNumberToProps(attrs, node),
                    this.mapJsxChildren(node),
                )
            }
            default: {
                return this.mdastTransformer(node)
            }
        }
    }

    transformJsxElement(
        jsxElement: JSXElement,
        onError?: (err: SafeMdxError) => void,
        line?: number,
    ): ReactNode {
        try {
            // Handle JSX opening element
            if (jsxElement.openingElement) {
                const tagName =
                    jsxElement.openingElement.name?.type === 'JSXIdentifier'
                        ? jsxElement.openingElement.name.name
                        : null
                if (!tagName) {
                    onError?.({
                        message: 'JSX element missing component name',
                        line: line,
                    })
                    return null
                }

                // Check if this is an ESM imported component (only if allowed)
                const esmImportInfo = this.allowClientEsmImports
                    ? this.esmImports.get(tagName)
                    : null
                let Component

                if (esmImportInfo) {
                    // Handle ESM imported component
                    const { importUrl, componentName } =
                        extractComponentInfo(esmImportInfo)
                    Component = DynamicEsmComponent
                } else {
                    // Get the component from the regular component map
                    Component = accessWithDot(this.c, tagName)
                    if (!Component) {
                        onError?.({
                            message: `Unsupported jsx component ${tagName} in attribute`,
                            line: line,
                        })
                        return null
                    }
                }

                // Extract attributes
                const props: Record<string, any> = {}
                if (jsxElement.openingElement.attributes) {
                    for (const attr of jsxElement.openingElement.attributes) {
                        if (
                            attr.type === 'JSXAttribute' &&
                            attr.name?.type === 'JSXIdentifier' &&
                            attr.name.name
                        ) {
                            if (attr.value) {
                                if (attr.value.type === 'Literal') {
                                    props[attr.name.name] = attr.value.value
                                } else if (
                                    attr.value.type === 'JSXExpressionContainer'
                                ) {
                                    if (
                                        attr.value.expression.type === 'Literal'
                                    ) {
                                        props[attr.name.name] =
                                            attr.value.expression.value
                                    }
                                }
                            } else {
                                props[attr.name.name] = true
                            }
                        }
                    }
                }

                // Extract children
                const children: ReactNode[] = []
                if (jsxElement.children) {
                    for (const child of jsxElement.children) {
                        if (child.type === 'JSXText') {
                            children.push(child.value)
                        } else if (child.type === 'JSXElement') {
                            const childElement = this.transformJsxElement(child)
                            if (childElement) {
                                children.push(childElement)
                            }
                        }
                    }
                }

                // Handle ESM imported components by adding required props
                if (esmImportInfo) {
                    const { importUrl, componentName } =
                        extractComponentInfo(esmImportInfo)
                    return this.createElement(
                        Component,
                        { ...props, importUrl, componentName },
                        ...children,
                    )
                } else {
                    return this.createElement(Component, props, ...children)
                }
            }
        } catch (error) {
            // Return null if transformation fails
            onError?.({
                message: `Failed to transform JSX element: ${
                    error instanceof Error ? error.message : 'Unknown error'
                }`,
                line: line,
            })
            return null
        }
        return null
    }

    getJsxAttrs(
        node: MdxJsxFlowElement | MdxJsxTextElement,
        onError: (err: SafeMdxError) => void = console.error,
    ) {
        let attrsList: [string, any][] = []

        for (const attr of node.attributes) {
            if (attr.type === 'mdxJsxExpressionAttribute') {
                // Handle spread expressions like {...{key: '1'}}
                if (attr.data?.estree) {
                    try {
                        const program = attr.data.estree
                        if (
                            program.body?.length > 0 &&
                            program.body[0].type === 'ExpressionStatement'
                        ) {
                            const expression = program.body[0].expression
                            try {
                                const result =
                                    Evaluate.evaluate.sync(expression)

                                // Handle spread syntax - merge the evaluated object
                                if (
                                    typeof result === 'object' &&
                                    result != null
                                ) {
                                    const entries = Object.entries(result)
                                    attrsList.push(...entries)
                                }
                            } catch (error) {
                                onError({
                                    message: `Failed to evaluate expression attribute: ${attr.value
                                        .replace(/\n+/g, ' ')
                                        .replace(/ +/g, ' ')}. ${
                                        error instanceof Error
                                            ? error.message
                                            : String(error)
                                    }`,
                                    line: attr.position?.start?.line,
                                })
                            }
                        }
                    } catch (error) {
                        onError({
                            message: `Failed to evaluate expression attribute: ${attr.value
                                .replace(/\n+/g, ' ')
                                .replace(/ +/g, ' ')}. ${
                                error instanceof Error
                                    ? error.message
                                    : String(error)
                            }`,
                            line: attr.position?.start?.line,
                        })
                    }
                } else {
                    onError({
                        message: `Expressions in jsx props are not supported (${attr.value
                            .replace(/\n+/g, ' ')
                            .replace(/ +/g, ' ')})`,
                        line: attr.position?.start?.line,
                    })
                }
                continue
            }

            if (attr.type !== 'mdxJsxAttribute') {
                onError({
                    message: `non mdxJsxAttribute attribute is not supported: ${attr}`,
                    line: node.position?.start?.line,
                })
                continue
            }

            const v = attr.value
            if (typeof v === 'string' || typeof v === 'number') {
                attrsList.push([attr.name, v])
                continue
            }
            if (v === null) {
                attrsList.push([attr.name, true])
                continue
            }
            if (v?.type === 'mdxJsxAttributeValueExpression') {
                // Manual parsing fallback for simple values
                if (v.value === 'true') {
                    attrsList.push([attr.name, true])
                    continue
                }
                if (v.value === 'false') {
                    attrsList.push([attr.name, false])
                    continue
                }
                if (v.value === 'null') {
                    attrsList.push([attr.name, null])
                    continue
                }
                if (v.value === 'undefined') {
                    attrsList.push([attr.name, undefined])
                    continue
                }

                if (v.data?.estree) {
                    try {
                        // Extract the expression from the Program body
                        const program = v.data.estree
                        if (
                            program.body?.length > 0 &&
                            program.body[0].type === 'ExpressionStatement'
                        ) {
                            const expression = program.body[0].expression

                            // Check if this is a JSX element
                            if (expression.type === 'JSXElement') {
                                // Transform JSX element to React element
                                const jsxElement = this.transformJsxElement(
                                    expression,
                                    onError,
                                    attr.position?.start?.line,
                                )
                                if (jsxElement) {
                                    attrsList.push([attr.name, jsxElement])
                                    continue
                                }
                            }

                            try {
                                // Evaluate the expression synchronously
                                const result =
                                    Evaluate.evaluate.sync(expression)
                                attrsList.push([attr.name, result])
                                continue
                            } catch (error) {
                                onError({
                                    message: `Failed to evaluate expression attribute: ${
                                        attr.name
                                    }={${v.value}}. ${
                                        error instanceof Error
                                            ? error.message
                                            : String(error)
                                    }`,
                                    line: attr.position?.start?.line,
                                })
                            }
                        }
                    } catch (error) {
                        // Fall back to the original manual parsing for backwards compatibility
                    }
                }

                onError({
                    message: `Expressions in jsx prop not evaluated: (${attr.name}={${v.value}})`,
                    line: attr.position?.start?.line,
                })
            }
        }
        return attrsList
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
        if (this.renderNode) {
            const customResult = this.renderNode(
                node,
                this.mdastTransformer.bind(this),
            )
            if (customResult !== undefined) {
                return customResult
            }
        }

        switch (node.type) {
            case 'mdxjsEsm': {
                // Parse ESM imports and merge into our imports map (only if allowed)
                if (this.allowClientEsmImports) {
                    const parsedImports = parseEsmImports(node, (err) =>
                        this.errors.push(err),
                    )
                    parsedImports.forEach((value, key) => {
                        this.esmImports.set(key, value)
                    })
                }
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

                // Check if we have an estree AST
                if (node.data?.estree) {
                    try {
                        // Extract the expression from the Program body
                        const program = node.data.estree
                        if (
                            program.body?.length > 0 &&
                            program.body[0].type === 'ExpressionStatement'
                        ) {
                            const expression = program.body[0].expression
                            try {
                                // Evaluate the expression synchronously
                                const result =
                                    Evaluate.evaluate.sync(expression)
                                return result
                            } catch (error) {
                                this.errors.push({
                                    message: `Failed to evaluate expression: ${
                                        node.value
                                    }. ${
                                        error instanceof Error
                                            ? error.message
                                            : String(error)
                                    }`,
                                    line: node.position?.start?.line,
                                })
                            }
                        }
                    } catch (error) {
                        this.errors.push({
                            message: `Failed to evaluate expression: ${
                                node.value
                            }. ${
                                error instanceof Error
                                    ? error.message
                                    : String(error)
                            }`,
                            line: node.position?.start?.line,
                        })
                    }
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

                return this.createElement(
                    Tag,
                    this.addLineNumberToProps(node.data?.hProperties, node),
                    this.mapMdastChildren(node),
                )
            }
            case 'paragraph': {
                return this.createElement(
                    this.c.p,
                    this.addLineNumberToProps(node.data?.hProperties, node),
                    this.mapMdastChildren(node),
                )
            }
            case 'blockquote': {
                return this.createElement(
                    this.c.blockquote,
                    this.addLineNumberToProps(node.data?.hProperties, node),
                    this.mapMdastChildren(node),
                )
            }
            case 'thematicBreak': {
                return this.createElement(
                    this.c.hr,
                    this.addLineNumberToProps(node.data?.hProperties, node),
                )
            }
            case 'code': {
                if (!node.value) {
                    return []
                }
                const language = node.lang || ''
                const code = node.value
                const codeBlock = (className?: string) =>
                    this.createElement(
                        this.c.pre,
                        this.addLineNumberToProps(node.data?.hProperties, node),
                        this.createElement(this.c.code, { className }, code),
                    )

                if (language) {
                    return codeBlock(`language-${language}`)
                }
                return codeBlock()
            }

            case 'list': {
                if (node.ordered) {
                    return this.createElement(
                        this.c.ol,
                        this.addLineNumberToProps(
                            { start: node.start!, ...node.data?.hProperties },
                            node,
                        ),
                        this.mapMdastChildren(node),
                    )
                }
                return this.createElement(
                    this.c.ul,
                    this.addLineNumberToProps(node.data?.hProperties, node),
                    this.mapMdastChildren(node),
                )
            }
            case 'listItem': {
                // https://github.com/syntax-tree/mdast-util-gfm-task-list-item#syntax-tree
                if (node?.checked != null) {
                    return this.createElement(
                        this.c.li,
                        this.addLineNumberToProps(
                            {
                                'data-checked': node.checked,
                                ...node.data?.hProperties,
                            },
                            node,
                        ),
                        this.mapMdastChildren(node),
                    )
                }
                return this.createElement(
                    this.c.li,
                    this.addLineNumberToProps(node.data?.hProperties, node),
                    this.mapMdastChildren(node),
                )
            }
            case 'text': {
                if (!node.value) {
                    return []
                }
                if (node.data?.hProperties) {
                    return this.createElement(
                        this.c.span,
                        this.addLineNumberToProps(node.data.hProperties, node),
                        node.value,
                    )
                }
                return node.value
            }
            case 'image': {
                const src = node.url || ''
                const alt = node.alt || ''
                const title = node.title || ''
                return this.createElement(
                    this.c.img,
                    this.addLineNumberToProps(
                        {
                            src,
                            alt,
                            title,
                            ...node.data?.hProperties,
                        },
                        node,
                    ),
                )
            }
            case 'link': {
                const href = node.url || ''
                const title = node.title || ''
                return this.createElement(
                    this.c.a,
                    this.addLineNumberToProps(
                        { href, title, ...node.data?.hProperties },
                        node,
                    ),
                    this.mapMdastChildren(node),
                )
            }
            case 'strong': {
                return this.createElement(
                    this.c.strong,
                    this.addLineNumberToProps(node.data?.hProperties, node),
                    this.mapMdastChildren(node),
                )
            }
            case 'emphasis': {
                return this.createElement(
                    this.c.em,
                    this.addLineNumberToProps(node.data?.hProperties, node),
                    this.mapMdastChildren(node),
                )
            }
            case 'delete': {
                return this.createElement(
                    this.c.del,
                    this.addLineNumberToProps(node.data?.hProperties, node),
                    this.mapMdastChildren(node),
                )
            }
            case 'inlineCode': {
                if (!node.value) {
                    return []
                }
                return this.createElement(
                    this.c.code,
                    this.addLineNumberToProps(node.data?.hProperties, node),
                    node.value,
                )
            }
            case 'break': {
                return this.createElement(
                    this.c.br,
                    this.addLineNumberToProps(node.data?.hProperties, node),
                )
            }
            case 'root': {
                if (node.data?.hProperties) {
                    return this.createElement(
                        this.c.div,
                        this.addLineNumberToProps(node.data.hProperties, node),
                        this.mapMdastChildren(node),
                    )
                }
                return this.createElement(
                    Fragment,
                    null,
                    this.mapMdastChildren(node),
                )
            }
            case 'table': {
                const [head, ...body] = React.Children.toArray(
                    this.mapMdastChildren(node),
                )
                return this.createElement(
                    this.c.table,
                    this.addLineNumberToProps(node.data?.hProperties, node),
                    head && this.createElement(this.c.thead, null, head),
                    !!body?.length &&
                        this.createElement(this.c.tbody, null, body),
                )
            }
            case 'tableRow': {
                return this.createElement(
                    this.c.tr,
                    this.addLineNumberToProps(
                        { className: '', ...node.data?.hProperties },
                        node,
                    ),
                    this.mapMdastChildren(node),
                )
            }
            case 'tableCell': {
                let content = this.mapMdastChildren(node)
                return this.createElement(
                    this.c.td,
                    this.addLineNumberToProps(
                        { className: '', ...node.data?.hProperties },
                        node,
                    ),
                    content,
                )
            }
            case 'definition': {
                return []
            }
            case 'linkReference': {
                let href = ''
                let title = ''
                mdastBfs(this.mdast, (child: any) => {
                    if (
                        child.type === 'definition' &&
                        child.identifier === node.identifier
                    ) {
                        href = child.url || ''
                        title = child.title || ''
                    }
                })

                return this.createElement(
                    this.c.a,
                    this.addLineNumberToProps(
                        { href, title, ...node.data?.hProperties },
                        node,
                    ),
                    this.mapMdastChildren(node),
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

                return this.createElement(
                    Suspense,
                    { fallback: null },
                    this.createElement(HtmlToJsxConverter, {
                        htmlText: text,
                        instance: this,
                        node,
                    }),
                )
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
    'figcaption',
] as const

type ComponentsMap = { [k in (typeof nativeTags)[number]]?: any } & {
    [key: string]: any
}
