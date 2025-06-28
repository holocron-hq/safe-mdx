import React from 'react'
import { htmlToJsx } from 'html-to-jsx-transform'
import type { MdastToJsx, MyRootContent } from './safe-mdx.js'

React

interface HtmlToJsxConverterProps {
    htmlText: string
    instance: MdastToJsx
    node: MyRootContent
}

export function HtmlToJsxConverter({
    htmlText,
    instance,
    node,
}: HtmlToJsxConverterProps) {
    try {
        const jsx = htmlToJsx(htmlText)
        const originalJsxStr = instance.jsxStr
        instance.jsxStr = jsx

        const result = instance.jsxTransformer(node)

        instance.jsxStr = originalJsxStr

        if (Array.isArray(result)) {
            console.log(`Unexpected array result`)
            return null
        }

        return result || null
    } catch (error) {
        console.error('Error converting HTML to JSX:', error)
        return null
    }
}
