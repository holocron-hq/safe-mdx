# safe-mdx

## 1.3.6

### Patch Changes

-  normalize to the correct jsx ast nodes

## 1.3.5

### Patch Changes

-   Add Vite demo showcasing safe-mdx with React, Tailwind CSS v4, and ESM component imports. The demo uses Tailwind CSS v4's new CSS-first configuration approach with the @plugin directive for typography styles. It demonstrates MDX ESM imports with the allowClientEsmImports boolean option, allowing direct imports from URLs like `import IOKnob from 'https://framer.com/m/IOKnob-DT0M.js@eZsKjfnRtnN8np5uwoAx'`. The demo includes comprehensive MDX features including headings, code blocks, tables, lists, and dynamic component loading. Run with `pnpm demo` to see safe-mdx in action with modern tooling and styling.
-   Add React resource hints for dynamic ESM component URLs to improve loading performance. The DynamicEsmComponent now uses React's prefetchDNS and preconnect APIs to establish early connections to ESM CDN domains (like esm.sh), reducing latency when components are dynamically imported on the client side. This optimization happens automatically when using allowClientEsmImports and helps improve the user experience by starting the DNS lookup and connection handshake before the actual component import is triggered.
-   Better handling of md raw html. Smaller bundle on browser

## 1.3.4

### Patch Changes

-   Add Vite demo showcasing safe-mdx with React, Tailwind CSS v4, and ESM component imports. The demo uses Tailwind CSS v4's new CSS-first configuration approach with the @plugin directive for typography styles. It demonstrates MDX ESM imports with the allowClientEsmImports boolean option, allowing direct imports from URLs like `import IOKnob from 'https://framer.com/m/IOKnob-DT0M.js@eZsKjfnRtnN8np5uwoAx'`. The demo includes comprehensive MDX features including headings, code blocks, tables, lists, and dynamic component loading. Run with `pnpm demo` to see safe-mdx in action with modern tooling and styling.
-   Add React resource hints for dynamic ESM component URLs to improve loading performance. The DynamicEsmComponent now uses React's prefetchDNS and preconnect APIs to establish early connections to ESM CDN domains (like esm.sh), reducing latency when components are dynamically imported on the client side. This optimization happens automatically when using allowClientEsmImports and helps improve the user experience by starting the DNS lookup and connection handshake before the actual component import is triggered.
-   Better handling of md raw html. Smaller bundle on browser

## 1.3.3

### Patch Changes

-   Add Vite demo showcasing safe-mdx with React, Tailwind CSS v4, and ESM component imports. The demo uses Tailwind CSS v4's new CSS-first configuration approach with the @plugin directive for typography styles. It demonstrates MDX ESM imports with the allowClientEsmImports boolean option, allowing direct imports from URLs like `import IOKnob from 'https://framer.com/m/IOKnob-DT0M.js@eZsKjfnRtnN8np5uwoAx'`. The demo includes comprehensive MDX features including headings, code blocks, tables, lists, and dynamic component loading. Run with `pnpm demo` to see safe-mdx in action with modern tooling and styling.
-   Add React resource hints for dynamic ESM component URLs to improve loading performance. The DynamicEsmComponent now uses React's prefetchDNS and preconnect APIs to establish early connections to ESM CDN domains (like esm.sh), reducing latency when components are dynamically imported on the client side. This optimization happens automatically when using allowClientEsmImports and helps improve the user experience by starting the DNS lookup and connection handshake before the actual component import is triggered.
-   Better handling of md raw html. Smaller bundle on browser

## 1.3.2

### Patch Changes

-   Add React resource hints for dynamic ESM component URLs to improve loading performance. The DynamicEsmComponent now uses React's prefetchDNS and preconnect APIs to establish early connections to ESM CDN domains (like esm.sh), reducing latency when components are dynamically imported on the client side. This optimization happens automatically when using allowClientEsmImports and helps improve the user experience by starting the DNS lookup and connection handshake before the actual component import is triggered.

## 1.3.1

### Patch Changes

-   Fix error message formatting to avoid duplicate "Error:" prefix. Error messages now display the underlying error message directly without adding an additional "Error:" prefix, making the error messages cleaner and more readable.

## 1.3.0

### Minor Changes

-   Add support for markdown line numbers via `addMarkdownLineNumbers` option. When enabled, this option adds a `data-markdown-line` attribute to each rendered element containing the line number of the corresponding markdown source. This enables mapping rendered elements back to their original position in the markdown source code.

    Example usage:

    ```tsx
    <SafeMdxRenderer mdast={mdast} addMarkdownLineNumbers={true} />
    ```

    The `data-markdown-line` attribute will be added to all rendered HTML elements like headings, paragraphs, lists, tables, etc., with the value being the start line number of the markdown node.

## 1.2.0

### Minor Changes

-   Add support for rendering user-provided ESM components via HTTPS imports. Components can be imported using standard ESM import syntax with HTTPS URLs, and they will be dynamically loaded on the client side only, maintaining SSR compatibility. The implementation includes proper error boundaries to handle loading failures gracefully, URL validation to ensure only HTTPS imports are allowed for security, and uses React.lazy with useState to ensure imports are only initialized once per component instance. Example usage: `import Button from 'https://esm.sh/@mui/material@5.0.0/Button'` in MDX will dynamically load the Button component on the client side.
-   Add support for JSX components inside attributes without relying on eval-estree-expression. Components can now be used in attributes like `<Heading icon={<Icon name="star" />}>` with both regular components and ESM imports. The implementation uses proper AST transformation instead of JavaScript evaluation for better security and type safety.

**New option:** `allowClientEsmImports` (disabled by default) - Controls whether ESM imports are processed. When disabled, ESM imports are ignored for security.

    Example usage with regular components:

    ```mdx
    <Heading icon={<span>👋</span>} level={1}>
      Hello World
    </Heading>

    <Cards actionButton={<Button>Click me</Button>}>
      Some content
    </Cards>
    ```

    ESM imported components (requires `allowClientEsmImports: true`):

    ```mdx
    import { Icon } from 'https://esm.sh/some-icon-library'

    <Heading icon={<Icon name='star' />}>Content</Heading>
    ```

    ```tsx
    // Enable ESM imports
    const result = SafeMdxRenderer({
        mdast,
        allowClientEsmImports: true, // Required for ESM imports
        components,
    })
    ```

-   Add support for `eval-estree-expression` as a parser for JSX attribute expressions. This significantly improves the parsing of JSX arguments in MDX, enabling support for complex objects and arrays that are not valid JSON. For example, you can now pass props like `options={{foo: 1, bar: [2, 3], 'data-test': true}}`, or functions and nested structures, closely matching React's JSX behavior without requiring valid JSON syntax.

## 1.1.0

### Minor Changes

-   add support for custom `createElement`. pass a no op function to use safe-mdx as a validation step
-   add support for `componentPropsSchema` to validate components props to a standard schema (works with Zod, Valibot, etc)

## 1.0.5

### Patch Changes

-   add line numbers to errors

## 1.0.4

### Patch Changes

-   Rename CustomTransformer to RnderNode

## 1.0.3

### Patch Changes

-   Export remarkMarkAndUnravel from /parse

## 1.0.2

### Patch Changes

-   Removed unsupported code language errors

## 1.0.1

### Patch Changes

-   Mark mdast as required

## 1.0.0

### Major Changes

-   Renamed prop `code` to `markdown`.
-   Renamed `customTransformer` prop to `renderNode`.
-   The prop `mdast` is now always required. This makes the bundle size much smaller in the client when you already have a markdown ast, because you don't have to import mdxParse function and all its dependencies.
-   `mdxParse` is now exported in `safe-mdx/parse` import path.

## 0.3.2

### Patch Changes

-   Use simple react for jsx

## 0.3.1

### Patch Changes

-   Nicer types declaration that is extensible

## 0.3.0

### Minor Changes

-   render spans for text if hProperties is defined

### Patch Changes

-   Add react memo to the exported component

## 0.2.0

### Minor Changes

-   completeJsxTags

## 0.1.0

### Minor Changes

-   Export remarkMarkAndUnravel plugin

## 0.0.6

### Patch Changes

-   Fix inline jsx elements beign wrapped in <p/>

## 0.0.5

### Patch Changes

-   Make headings overridable
