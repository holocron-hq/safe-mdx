# safe-mdx

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
