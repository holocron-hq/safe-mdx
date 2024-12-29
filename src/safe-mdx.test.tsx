import React from 'react'
import dedent from 'dedent'
import { test, expect } from 'vitest'
import { MdastToJsx } from './safe-mdx.js'
import { renderToStaticMarkup } from 'react-dom/server'
void React

const components = {
    Heading({ level, children }) {
        return <h1>{children}</h1>
    },
} as any

function render(code) {
    const visitor = new MdastToJsx({ code, components })
    const result = visitor.run()
    const html = renderToStaticMarkup(result)
    // console.log(JSON.stringify(result, null, 2))
    return { result, errors: visitor.errors || [], html }
}

test('basic', () => {
    expect(
        render(dedent`
        # Hello

        i am a paragraph
        `),
    ).toMatchInlineSnapshot(`
      {
        "errors": [],
        "html": "<h1>Hello</h1><p>i am a paragraph</p>",
        "result": {
          "$$typeof": Symbol(react.transitional.element),
          "_owner": null,
          "_store": {},
          "key": null,
          "props": {
            "children": [
              {
                "$$typeof": Symbol(react.transitional.element),
                "_owner": null,
                "_store": {},
                "key": "0",
                "props": {
                  "children": "Hello",
                },
                "type": "h1",
              },
              {
                "$$typeof": Symbol(react.transitional.element),
                "_owner": null,
                "_store": {},
                "key": "1",
                "props": {
                  "children": "i am a paragraph",
                },
                "type": "p",
              },
            ],
          },
          "type": Symbol(react.fragment),
        },
      }
    `)
})
test('frontmatter', () => {
    expect(
        render(dedent`
        ---
        hello: 5
        ---
        
        # Hello

        i am a paragraph
        `),
    ).toMatchInlineSnapshot(`
      {
        "errors": [],
        "html": "<h1>Hello</h1><p>i am a paragraph</p>",
        "result": {
          "$$typeof": Symbol(react.transitional.element),
          "_owner": null,
          "_store": {},
          "key": null,
          "props": {
            "children": [
              {
                "$$typeof": Symbol(react.transitional.element),
                "_owner": null,
                "_store": {},
                "key": "0",
                "props": {
                  "children": "Hello",
                },
                "type": "h1",
              },
              {
                "$$typeof": Symbol(react.transitional.element),
                "_owner": null,
                "_store": {},
                "key": "1",
                "props": {
                  "children": "i am a paragraph",
                },
                "type": "p",
              },
            ],
          },
          "type": Symbol(react.fragment),
        },
      }
    `)
})
test('table', () => {
    expect(
        render(dedent`
        # Hello

        | Tables        | Are           | Cool  |
        | ------------- |:-------------:| -----:|
        | col 3 is      | right-aligned | $1600 |
        | col 2 is      | centered      |   $12 |
        `),
    ).toMatchInlineSnapshot(`
      {
        "errors": [],
        "html": "<h1>Hello</h1><table><thead><tr class=""><td class="">Tables</td><td class="">Are</td><td class="">Cool</td></tr></thead><tbody><tr class=""><td class="">col 3 is</td><td class="">right-aligned</td><td class="">$1600</td></tr><tr class=""><td class="">col 2 is</td><td class="">centered</td><td class="">$12</td></tr></tbody></table>",
        "result": {
          "$$typeof": Symbol(react.transitional.element),
          "_owner": null,
          "_store": {},
          "key": null,
          "props": {
            "children": [
              {
                "$$typeof": Symbol(react.transitional.element),
                "_owner": null,
                "_store": {},
                "key": "0",
                "props": {
                  "children": "Hello",
                },
                "type": "h1",
              },
              {
                "$$typeof": Symbol(react.transitional.element),
                "_owner": null,
                "_store": {},
                "key": "1",
                "props": {
                  "children": [
                    {
                      "$$typeof": Symbol(react.transitional.element),
                      "_owner": null,
                      "_store": {},
                      "key": null,
                      "props": {
                        "children": {
                          "$$typeof": Symbol(react.transitional.element),
                          "_owner": null,
                          "_store": {},
                          "key": ".$0",
                          "props": {
                            "children": [
                              {
                                "$$typeof": Symbol(react.transitional.element),
                                "_owner": null,
                                "_store": {},
                                "key": "0",
                                "props": {
                                  "children": "Tables",
                                  "className": "",
                                },
                                "type": "td",
                              },
                              {
                                "$$typeof": Symbol(react.transitional.element),
                                "_owner": null,
                                "_store": {},
                                "key": "1",
                                "props": {
                                  "children": "Are",
                                  "className": "",
                                },
                                "type": "td",
                              },
                              {
                                "$$typeof": Symbol(react.transitional.element),
                                "_owner": null,
                                "_store": {},
                                "key": "2",
                                "props": {
                                  "children": "Cool",
                                  "className": "",
                                },
                                "type": "td",
                              },
                            ],
                            "className": "",
                          },
                          "type": "tr",
                        },
                      },
                      "type": "thead",
                    },
                    {
                      "$$typeof": Symbol(react.transitional.element),
                      "_owner": null,
                      "_store": {},
                      "key": null,
                      "props": {
                        "children": [
                          {
                            "$$typeof": Symbol(react.transitional.element),
                            "_owner": null,
                            "_store": {},
                            "key": ".$1",
                            "props": {
                              "children": [
                                {
                                  "$$typeof": Symbol(react.transitional.element),
                                  "_owner": null,
                                  "_store": {},
                                  "key": "0",
                                  "props": {
                                    "children": "col 3 is",
                                    "className": "",
                                  },
                                  "type": "td",
                                },
                                {
                                  "$$typeof": Symbol(react.transitional.element),
                                  "_owner": null,
                                  "_store": {},
                                  "key": "1",
                                  "props": {
                                    "children": "right-aligned",
                                    "className": "",
                                  },
                                  "type": "td",
                                },
                                {
                                  "$$typeof": Symbol(react.transitional.element),
                                  "_owner": null,
                                  "_store": {},
                                  "key": "2",
                                  "props": {
                                    "children": "$1600",
                                    "className": "",
                                  },
                                  "type": "td",
                                },
                              ],
                              "className": "",
                            },
                            "type": "tr",
                          },
                          {
                            "$$typeof": Symbol(react.transitional.element),
                            "_owner": null,
                            "_store": {},
                            "key": ".$2",
                            "props": {
                              "children": [
                                {
                                  "$$typeof": Symbol(react.transitional.element),
                                  "_owner": null,
                                  "_store": {},
                                  "key": "0",
                                  "props": {
                                    "children": "col 2 is",
                                    "className": "",
                                  },
                                  "type": "td",
                                },
                                {
                                  "$$typeof": Symbol(react.transitional.element),
                                  "_owner": null,
                                  "_store": {},
                                  "key": "1",
                                  "props": {
                                    "children": "centered",
                                    "className": "",
                                  },
                                  "type": "td",
                                },
                                {
                                  "$$typeof": Symbol(react.transitional.element),
                                  "_owner": null,
                                  "_store": {},
                                  "key": "2",
                                  "props": {
                                    "children": "$12",
                                    "className": "",
                                  },
                                  "type": "td",
                                },
                              ],
                              "className": "",
                            },
                            "type": "tr",
                          },
                        ],
                      },
                      "type": "tbody",
                    },
                  ],
                },
                "type": "table",
              },
            ],
          },
          "type": Symbol(react.fragment),
        },
      }
    `)
})
test('table, only head', () => {
    expect(
        render(dedent`
        # Hello

        | Tables        | Are           | Cool  |
        | ------------- |:-------------:| -----:|
        
        `),
    ).toMatchInlineSnapshot(`
      {
        "errors": [],
        "html": "<h1>Hello</h1><table><thead><tr class=""><td class="">Tables</td><td class="">Are</td><td class="">Cool</td></tr></thead></table>",
        "result": {
          "$$typeof": Symbol(react.transitional.element),
          "_owner": null,
          "_store": {},
          "key": null,
          "props": {
            "children": [
              {
                "$$typeof": Symbol(react.transitional.element),
                "_owner": null,
                "_store": {},
                "key": "0",
                "props": {
                  "children": "Hello",
                },
                "type": "h1",
              },
              {
                "$$typeof": Symbol(react.transitional.element),
                "_owner": null,
                "_store": {},
                "key": "1",
                "props": {
                  "children": [
                    {
                      "$$typeof": Symbol(react.transitional.element),
                      "_owner": null,
                      "_store": {},
                      "key": null,
                      "props": {
                        "children": {
                          "$$typeof": Symbol(react.transitional.element),
                          "_owner": null,
                          "_store": {},
                          "key": ".0",
                          "props": {
                            "children": [
                              {
                                "$$typeof": Symbol(react.transitional.element),
                                "_owner": null,
                                "_store": {},
                                "key": "0",
                                "props": {
                                  "children": "Tables",
                                  "className": "",
                                },
                                "type": "td",
                              },
                              {
                                "$$typeof": Symbol(react.transitional.element),
                                "_owner": null,
                                "_store": {},
                                "key": "1",
                                "props": {
                                  "children": "Are",
                                  "className": "",
                                },
                                "type": "td",
                              },
                              {
                                "$$typeof": Symbol(react.transitional.element),
                                "_owner": null,
                                "_store": {},
                                "key": "2",
                                "props": {
                                  "children": "Cool",
                                  "className": "",
                                },
                                "type": "td",
                              },
                            ],
                            "className": "",
                          },
                          "type": "tr",
                        },
                      },
                      "type": "thead",
                    },
                    false,
                  ],
                },
                "type": "table",
              },
            ],
          },
          "type": Symbol(react.fragment),
        },
      }
    `)
})

test('inline jsx', () => {
    expect(
        render(dedent`
        <Heading level={2}>hello</Heading>
        `),
    ).toMatchInlineSnapshot(`
      {
        "errors": [],
        "html": "<p><h1>hello</h1></p>",
        "result": {
          "$$typeof": Symbol(react.transitional.element),
          "_owner": null,
          "_store": {},
          "key": null,
          "props": {
            "children": {
              "$$typeof": Symbol(react.transitional.element),
              "_owner": null,
              "_store": {},
              "key": null,
              "props": {
                "children": {
                  "$$typeof": Symbol(react.transitional.element),
                  "_owner": null,
                  "_store": {},
                  "key": null,
                  "props": {
                    "children": "hello",
                    "level": 2,
                  },
                  "type": [Function],
                },
              },
              "type": "p",
            },
          },
          "type": Symbol(react.fragment),
        },
      }
    `)
})

test('block jsx', () => {
    expect(
        render(dedent`
        <Heading level={2}>
        > hello
        </Heading>
        `),
    ).toMatchInlineSnapshot(`
      {
        "errors": [],
        "html": "<h1><blockquote><p>hello</p></blockquote></h1>",
        "result": {
          "$$typeof": Symbol(react.transitional.element),
          "_owner": null,
          "_store": {},
          "key": null,
          "props": {
            "children": {
              "$$typeof": Symbol(react.transitional.element),
              "_owner": null,
              "_store": {},
              "key": null,
              "props": {
                "children": {
                  "$$typeof": Symbol(react.transitional.element),
                  "_owner": null,
                  "_store": {},
                  "key": null,
                  "props": {
                    "children": {
                      "$$typeof": Symbol(react.transitional.element),
                      "_owner": null,
                      "_store": {},
                      "key": null,
                      "props": {
                        "children": "hello",
                      },
                      "type": "p",
                    },
                  },
                  "type": "blockquote",
                },
                "level": 2,
              },
              "type": [Function],
            },
          },
          "type": Symbol(react.fragment),
        },
      }
    `)
})
test('complex jsx, self closing tags', () => {
    expect(
        render(dedent`
        # hello <br />

        <br />

        content
        `),
    ).toMatchInlineSnapshot(`
      {
        "errors": [],
        "html": "<h1>hello <br/></h1><br/><p>content</p>",
        "result": {
          "$$typeof": Symbol(react.transitional.element),
          "_owner": null,
          "_store": {},
          "key": null,
          "props": {
            "children": [
              {
                "$$typeof": Symbol(react.transitional.element),
                "_owner": null,
                "_store": {},
                "key": "0",
                "props": {
                  "children": [
                    "hello ",
                    {
                      "$$typeof": Symbol(react.transitional.element),
                      "_owner": null,
                      "_store": {},
                      "key": "1",
                      "props": {
                        "children": null,
                      },
                      "type": "br",
                    },
                  ],
                },
                "type": "h1",
              },
              {
                "$$typeof": Symbol(react.transitional.element),
                "_owner": null,
                "_store": {},
                "key": "1",
                "props": {
                  "children": null,
                },
                "type": "br",
              },
              {
                "$$typeof": Symbol(react.transitional.element),
                "_owner": null,
                "_store": {},
                "key": "2",
                "props": {
                  "children": "content",
                },
                "type": "p",
              },
            ],
          },
          "type": Symbol(react.fragment),
        },
      }
    `)
})

test('missing components are ignored', () => {
    expect(
        render(dedent`
        <MissingComponent level={2} />
        `),
    ).toMatchInlineSnapshot(`
      {
        "errors": [
          {
            "message": "Unsupported jsx component MissingComponent",
          },
        ],
        "html": "",
        "result": {
          "$$typeof": Symbol(react.transitional.element),
          "_owner": null,
          "_store": {},
          "key": null,
          "props": {
            "children": null,
          },
          "type": Symbol(react.fragment),
        },
      }
    `)
})

test('props parsing', () => {
    expect(
        render(dedent`
        <Heading 
            num={2}
            doublequote={"a \" string"}
            quote={'a \' string'}
            backTick={\`some ${'${expr}'} value\`}
            boolean={false}
            expression1={1 + 3}
            expression2={Boolean(1)}
            jsx={<SomeComponent />}
            undef={undefined}
            null={null}
            someJson={{"a": 1}}
            {...{
              spread: true
            }}
        >
        hi
        </Heading>

        `),
    ).toMatchInlineSnapshot(`
      {
        "errors": [
          {
            "message": "Expressions in jsx props are not supported (expression1={1 + 3})",
          },
          {
            "message": "Expressions in jsx props are not supported (expression2={Boolean(1)})",
          },
          {
            "message": "Expressions in jsx props are not supported (jsx={<SomeComponent />})",
          },
          {
            "message": "Expressions in jsx props are not supported (...{     spread: true   })",
          },
        ],
        "html": "<h1><p>hi</p></h1>",
        "result": {
          "$$typeof": Symbol(react.transitional.element),
          "_owner": null,
          "_store": {},
          "key": null,
          "props": {
            "children": {
              "$$typeof": Symbol(react.transitional.element),
              "_owner": null,
              "_store": {},
              "key": null,
              "props": {
                "backTick": "some \${expr} value",
                "boolean": false,
                "children": {
                  "$$typeof": Symbol(react.transitional.element),
                  "_owner": null,
                  "_store": {},
                  "key": null,
                  "props": {
                    "children": "hi",
                  },
                  "type": "p",
                },
                "doublequote": "a " string",
                "null": null,
                "num": 2,
                "quote": "a " string",
                "someJson": {
                  "a": 1,
                },
                "undef": undefined,
              },
              "type": [Function],
            },
          },
          "type": Symbol(react.fragment),
        },
      }
    `)
})
test('breaks', () => {
    expect(
        render(dedent`
        To have a line break without a paragraph, you will need to use two trailing spaces.  
        Note that this line is separate, but within the same paragraph.  
        (This is contrary to the typical GFM line break behaviour, where trailing spaces are not required.)
        `),
    ).toMatchInlineSnapshot(`
      {
        "errors": [],
        "html": "<p>To have a line break without a paragraph, you will need to use two trailing spaces.<br/>Note that this line is separate, but within the same paragraph.<br/>(This is contrary to the typical GFM line break behaviour, where trailing spaces are not required.)</p>",
        "result": {
          "$$typeof": Symbol(react.transitional.element),
          "_owner": null,
          "_store": {},
          "key": null,
          "props": {
            "children": {
              "$$typeof": Symbol(react.transitional.element),
              "_owner": null,
              "_store": {},
              "key": null,
              "props": {
                "children": [
                  "To have a line break without a paragraph, you will need to use two trailing spaces.",
                  {
                    "$$typeof": Symbol(react.transitional.element),
                    "_owner": null,
                    "_store": {},
                    "key": "1",
                    "props": {},
                    "type": "br",
                  },
                  "Note that this line is separate, but within the same paragraph.",
                  {
                    "$$typeof": Symbol(react.transitional.element),
                    "_owner": null,
                    "_store": {},
                    "key": "3",
                    "props": {},
                    "type": "br",
                  },
                  "(This is contrary to the typical GFM line break behaviour, where trailing spaces are not required.)",
                ],
              },
              "type": "p",
            },
          },
          "type": Symbol(react.fragment),
        },
      }
    `)
})

// https://github.com/obedm503/markdown-kitchen-sink/blob/master/README.md?plain=1
test('kitchen sink', () => {
    expect(
        render(dedent`
        # Markdown Kitchen Sink
        This file is https://github.com/adam-p/markdown-here/wiki/Markdown-Cheatsheet plus a few fixes and additions. Used by [obedm503/bootmark](https://github.com/obedm503/bootmark) to [demonstrate](https://obedm503.github.io/bootmark/docs/markdown-cheatsheet.html) it's styling features.
        
        This is intended as a quick reference and showcase. For more complete info, see [John Gruber's original spec](http://daringfireball.net/projects/markdown/) and the [Github-flavored Markdown info page](http://github.github.com/github-flavored-markdown/).
        
        Note that there is also a [Cheatsheet specific to Markdown Here](./Markdown-Here-Cheatsheet) if that's what you're looking for. You can also check out [more Markdown tools](./Other-Markdown-Tools).
        
        ##### Table of Contents  
        [Headers](#headers)  
        [Emphasis](#emphasis)  
        [Lists](#lists)  
        [Links](#links)  
        [Images](#images)  
        [Code and Syntax Highlighting](#code)  
        [Tables](#tables)  
        [Blockquotes](#blockquotes)  
        [Inline HTML](#html)  
        [Horizontal Rule](#hr)  
        [Line Breaks](#lines)  
        [YouTube Videos](#videos)  
        
        <a name="headers"></a>
        
        ## Headers
        
        
        # H1
        ## H2
        ### H3
        #### H4
        ##### H5
        ###### H6
        
        Alternatively, for H1 and H2, an underline-ish style:
        
        Alt-H1
        ======
        
        Alt-H2
        ------
        
        
        # H1
        ## H2
        ### H3
        #### H4
        ##### H5
        ###### H6
        
        Alternatively, for H1 and H2, an underline-ish style:
        
        Alt-H1
        ======
        
        Alt-H2
        ------
        
        <a name="emphasis"></a>
        
        ## Emphasis
        
        \`\`\`no-highlight
        Emphasis, aka italics, with *asterisks* or _underscores_.
        
        Strong emphasis, aka bold, with **asterisks** or __underscores__.
        
        Combined emphasis with **asterisks and _underscores_**.
        
        Strikethrough uses two tildes. ~~Scratch this.~~
        \`\`\`
        
        Emphasis, aka italics, with *asterisks* or _underscores_.
        
        Strong emphasis, aka bold, with **asterisks** or __underscores__.
        
        Combined emphasis with **asterisks and _underscores_**.
        
        Strikethrough uses two tildes. ~~Scratch this.~~
        
        
        <a name="lists"></a>
        
        ## Lists
        
        (In this example, leading and trailing spaces are shown with with dots: ⋅)
        
        \`\`\`no-highlight
        1. First ordered list item
        2. Another item
        ⋅⋅* Unordered sub-list. 
        1. Actual numbers don't matter, just that it's a number
        ⋅⋅1. Ordered sub-list
        4. And another item.
        
        ⋅⋅⋅You can have properly indented paragraphs within list items. Notice the blank line above, and the leading spaces (at least one, but we'll use three here to also align the raw Markdown).
        
        ⋅⋅⋅To have a line break without a paragraph, you will need to use two trailing spaces.⋅⋅
        ⋅⋅⋅Note that this line is separate, but within the same paragraph.⋅⋅
        ⋅⋅⋅(This is contrary to the typical GFM line break behaviour, where trailing spaces are not required.)
        
        * Unordered list can use asterisks
        - Or minuses
        + Or pluses
        \`\`\`
        
        1. First ordered list item
        2. Another item
          * Unordered sub-list. 
        1. Actual numbers don't matter, just that it's a number
          1. Ordered sub-list
        4. And another item.
        
           You can have properly indented paragraphs within list items. Notice the blank line above, and the leading spaces (at least one, but we'll use three here to also align the raw Markdown).
        
           To have a line break without a paragraph, you will need to use two trailing spaces.  
           Note that this line is separate, but within the same paragraph.  
           (This is contrary to the typical GFM line break behaviour, where trailing spaces are not required.)
        
        * Unordered list can use asterisks
        - Or minuses
        + Or pluses
        
        <a name="links"></a>
        
        ## Links
        
        There are two ways to create links.
        
        \`\`\`no-highlight
        [I'm an inline-style link](https://www.google.com)
        
        [I'm an inline-style link with title](https://www.google.com "Google's Homepage")
        
        [I'm a reference-style link][Arbitrary case-insensitive reference text]
        
        [I'm a relative reference to a repository file](../blob/master/LICENSE)
        
        [You can use numbers for reference-style link definitions][1]
        
        Or leave it empty and use the [link text itself].
        
        URLs and URLs in angle brackets will automatically get turned into links. 
        http://www.example.com and sometimes 
        example.com (but not on Github, for example).
        
        Some text to show that the reference links can follow later.
        
        [arbitrary case-insensitive reference text]: https://www.mozilla.org
        [1]: http://slashdot.org
        [link text itself]: http://www.reddit.com
        \`\`\`
        
        [I'm an inline-style link](https://www.google.com)
        
        [I'm an inline-style link with title](https://www.google.com "Google's Homepage")
        
        [I'm a reference-style link][Arbitrary case-insensitive reference text]
        
        [I'm a relative reference to a repository file](../blob/master/LICENSE)
        
        [You can use numbers for reference-style link definitions][1]
        
        Or leave it empty and use the [link text itself].
        
        URLs and URLs in angle brackets will automatically get turned into links. 
        http://www.example.com and sometimes 
        example.com (but not on Github, for example).
        
        Some text to show that the reference links can follow later.
        
        [arbitrary case-insensitive reference text]: https://www.mozilla.org
        [1]: http://slashdot.org
        [link text itself]: http://www.reddit.com
        
        <a name="images"></a>
        
        ## Images
        
        \`\`\`no-highlight
        Here's our logo (hover to see the title text):
        
        Inline-style: 
        ![alt text](https://github.com/adam-p/markdown-here/raw/master/src/common/images/icon48.png "Logo Title Text 1")
        
        Reference-style: 
        ![alt text][logo]
        
        [logo]: https://github.com/adam-p/markdown-here/raw/master/src/common/images/icon48.png "Logo Title Text 2"
        \`\`\`
        
        Here's our logo (hover to see the title text):
        
        Inline-style: 
        ![alt text](https://github.com/adam-p/markdown-here/raw/master/src/common/images/icon48.png "Logo Title Text 1")
        
        Reference-style: 
        ![alt text][logo]
        
        [logo]: https://github.com/adam-p/markdown-here/raw/master/src/common/images/icon48.png "Logo Title Text 2"
        
        <a name="code"></a>
        
        ## Code and Syntax Highlighting
        
        Code blocks are part of the Markdown spec, but syntax highlighting isn't. However, many renderers -- like Github's and *Markdown Here* -- support syntax highlighting. Which languages are supported and how those language names should be written will vary from renderer to renderer. *Markdown Here* supports highlighting for dozens of languages (and not-really-languages, like diffs and HTTP headers); to see the complete list, and how to write the language names, see the [highlight.js demo page](http://softwaremaniacs.org/media/soft/highlight/test.html).
        
        \`\`\`no-highlight
        Inline \`code\` has \`back-ticks around\` it.
        \`\`\`
        
        Inline \`code\` has \`back-ticks around\` it.
        
        Blocks of code are either fenced by lines with three back-ticks <code>\`\`\`</code>, or are indented with four spaces. I recommend only using the fenced code blocks -- they're easier and only they support syntax highlighting.
        
        \`\`\`javascript
        var s = "JavaScript syntax highlighting";
        alert(s);
        \`\`\`
         
        \`\`\`python
        s = "Python syntax highlighting"
        print s
        \`\`\`
         
        \`\`\`
        No language indicated, so no syntax highlighting. 
        But let's throw in a &lt;b&gt;tag&lt;/b&gt;.
        \`\`\`
        
        
        
        
        \`\`\`javascript
        var s = "JavaScript syntax highlighting";
        alert(s);
        \`\`\`
        
        \`\`\`python
        s = "Python syntax highlighting"
        print s
        \`\`\`
        
        \`\`\`
        No language indicated, so no syntax highlighting in Markdown Here (varies on Github). 
        But let's throw in a <b>tag</b>.
        \`\`\`
        
        
        <a name="tables"></a>
        
        ## Tables
        
        Tables aren't part of the core Markdown spec, but they are part of GFM and *Markdown Here* supports them. They are an easy way of adding tables to your email -- a task that would otherwise require copy-pasting from another application.
        
        \`\`\`no-highlight
        Colons can be used to align columns.
        
        | Tables        | Are           | Cool  |
        | ------------- |:-------------:| -----:|
        | col 3 is      | right-aligned | $1600 |
        | col 2 is      | centered      |   $12 |
        | zebra stripes | are neat      |    $1 |
        
        There must be at least 3 dashes separating each header cell.
        The outer pipes (|) are optional, and you don't need to make the 
        raw Markdown line up prettily. You can also use inline Markdown.
        
        Markdown | Less | Pretty
        --- | --- | ---
        *Still* | \`renders\` | **nicely**
        1 | 2 | 3
        \`\`\`
        
        Colons can be used to align columns.
        
        | Tables        | Are           | Cool |
        | ------------- |:-------------:| -----:|
        | col 3 is      | right-aligned | $1600 |
        | col 2 is      | centered      |   $12 |
        | zebra stripes | are neat      |    $1 |
        
        There must be at least 3 dashes separating each header cell. The outer pipes (|) are optional, and you don't need to make the raw Markdown line up prettily. You can also use inline Markdown.
        
        Markdown | Less | Pretty
        --- | --- | ---
        *Still* | \`renders\` | **nicely**
        1 | 2 | 3
        
        <a name="blockquotes"></a>
        
        ## Blockquotes
        
        \`\`\`no-highlight
        > Blockquotes are very handy in email to emulate reply text.
        > This line is part of the same quote.
        
        Quote break.
        
        > This is a very long line that will still be quoted properly when it wraps. Oh boy let's keep writing to make sure this is long enough to actually wrap for everyone. Oh, you can *put* **Markdown** into a blockquote. 
        \`\`\`
        
        > Blockquotes are very handy in email to emulate reply text.
        > This line is part of the same quote.
        
        Quote break.
        
        > This is a very long line that will still be quoted properly when it wraps. Oh boy let's keep writing to make sure this is long enough to actually wrap for everyone. Oh, you can *put* **Markdown** into a blockquote. 
        
        <a name="html"></a>
        
        ## Inline HTML
        
        You can also use raw HTML in your Markdown, and it'll mostly work pretty well. 
        
        \`\`\`no-highlight
        <dl>
          <dt>Definition list</dt>
          <dd>Is something people use sometimes.</dd>
        
          <dt>Markdown in HTML</dt>
          <dd>Does *not* work **very** well. Use HTML <em>tags</em>.</dd>
        </dl>
        \`\`\`
        
        <dl>
          <dt>Definition list</dt>
          <dd>Is something people use sometimes.</dd>
        
          <dt>Markdown in HTML</dt>
          <dd>Does *not* work **very** well. Use HTML <em>tags</em>.</dd>
        </dl>
        
        <a name="hr"></a>
        
        ## Horizontal Rule
        
        \`\`\`
        Three or more...
        
        ---
        
        Hyphens
        
        ***
        
        Asterisks
        
        ___
        
        Underscores
        \`\`\`
        
        Three or more...
        
        ---
        
        Hyphens
        
        ***
        
        Asterisks
        
        ___
        
        Underscores
        
        <a name="lines"></a>
        
        ## Line Breaks
        
        My basic recommendation for learning how line breaks work is to experiment and discover -- hit &lt;Enter&gt; once (i.e., insert one newline), then hit it twice (i.e., insert two newlines), see what happens. You'll soon learn to get what you want. "Markdown Toggle" is your friend. 
        
        Here are some things to try out:
        
        \`\`\`
        Here's a line for us to start with.
        
        This line is separated from the one above by two newlines, so it will be a *separate paragraph*.
        
        This line is also a separate paragraph, but...
        This line is only separated by a single newline, so it's a separate line in the *same paragraph*.
        \`\`\`
        
        Here's a line for us to start with.
        
        This line is separated from the one above by two newlines, so it will be a *separate paragraph*.
        
        This line is also begins a separate paragraph, but...  
        This line is only separated by a single newline, so it's a separate line in the *same paragraph*.
        
        (Technical note: *Markdown Here* uses GFM line breaks, so there's no need to use MD's two-space line breaks.)
        
        <a name="videos"></a>
        
        ## YouTube Videos
        
        They can't be added directly but you can add an image with a link to the video like this:
        
        \`\`\`no-highlight
        <a href="http://www.youtube.com/watch?feature=player_embedded&v=YOUTUBE_VIDEO_ID_HERE
        " target="_blank"><img src="http://img.youtube.com/vi/YOUTUBE_VIDEO_ID_HERE/0.jpg" 
        alt="IMAGE ALT TEXT HERE" width="240" height="180" border="10" /></a>
        \`\`\`
        
        Or, in pure Markdown, but losing the image sizing and border:
        
        \`\`\`no-highlight
        [![IMAGE ALT TEXT HERE](http://img.youtube.com/vi/YOUTUBE_VIDEO_ID_HERE/0.jpg)](http://www.youtube.com/watch?v=YOUTUBE_VIDEO_ID_HERE)
        \`\`\`

        `),
    ).toMatchInlineSnapshot(`
      {
        "errors": [
          {
            "message": "Unsupported jsx component dl",
          },
        ],
        "html": "<link rel="preload" as="image" href="https://github.com/adam-p/markdown-here/raw/master/src/common/images/icon48.png"/><h1>Markdown Kitchen Sink</h1><p>This file is <a href="https://github.com/adam-p/markdown-here/wiki/Markdown-Cheatsheet" title="">https://github.com/adam-p/markdown-here/wiki/Markdown-Cheatsheet</a> plus a few fixes and additions. Used by <a href="https://github.com/obedm503/bootmark" title="">obedm503/bootmark</a> to <a href="https://obedm503.github.io/bootmark/docs/markdown-cheatsheet.html" title="">demonstrate</a> it&#x27;s styling features.</p><p>This is intended as a quick reference and showcase. For more complete info, see <a href="http://daringfireball.net/projects/markdown/" title="">John Gruber&#x27;s original spec</a> and the <a href="http://github.github.com/github-flavored-markdown/" title="">Github-flavored Markdown info page</a>.</p><p>Note that there is also a <a href="./Markdown-Here-Cheatsheet" title="">Cheatsheet specific to Markdown Here</a> if that&#x27;s what you&#x27;re looking for. You can also check out <a href="./Other-Markdown-Tools" title="">more Markdown tools</a>.</p><h5>Table of Contents</h5><p><a href="#headers" title="">Headers</a><br/><a href="#emphasis" title="">Emphasis</a><br/><a href="#lists" title="">Lists</a><br/><a href="#links" title="">Links</a><br/><a href="#images" title="">Images</a><br/><a href="#code" title="">Code and Syntax Highlighting</a><br/><a href="#tables" title="">Tables</a><br/><a href="#blockquotes" title="">Blockquotes</a><br/><a href="#html" title="">Inline HTML</a><br/><a href="#hr" title="">Horizontal Rule</a><br/><a href="#lines" title="">Line Breaks</a><br/><a href="#videos" title="">YouTube Videos</a></p><a name="headers"></a><h2>Headers</h2><h1>H1</h1><h2>H2</h2><h3>H3</h3><h4>H4</h4><h5>H5</h5><h6>H6</h6><p>Alternatively, for H1 and H2, an underline-ish style:</p><h1>Alt-H1</h1><h2>Alt-H2</h2><h1>H1</h1><h2>H2</h2><h3>H3</h3><h4>H4</h4><h5>H5</h5><h6>H6</h6><p>Alternatively, for H1 and H2, an underline-ish style:</p><h1>Alt-H1</h1><h2>Alt-H2</h2><a name="emphasis"></a><h2>Emphasis</h2><pre><code>Emphasis, aka italics, with *asterisks* or _underscores_.

      Strong emphasis, aka bold, with **asterisks** or __underscores__.

      Combined emphasis with **asterisks and _underscores_**.

      Strikethrough uses two tildes. ~~Scratch this.~~</code></pre><p>Emphasis, aka italics, with <em>asterisks</em> or <em>underscores</em>.</p><p>Strong emphasis, aka bold, with <strong>asterisks</strong> or <strong>underscores</strong>.</p><p>Combined emphasis with <strong>asterisks and <em>underscores</em></strong>.</p><p>Strikethrough uses two tildes. <del>Scratch this.</del></p><a name="lists"></a><h2>Lists</h2><p>(In this example, leading and trailing spaces are shown with with dots: ⋅)</p><pre><code>1. First ordered list item
      2. Another item
      ⋅⋅* Unordered sub-list. 
      1. Actual numbers don&#x27;t matter, just that it&#x27;s a number
      ⋅⋅1. Ordered sub-list
      4. And another item.

      ⋅⋅⋅You can have properly indented paragraphs within list items. Notice the blank line above, and the leading spaces (at least one, but we&#x27;ll use three here to also align the raw Markdown).

      ⋅⋅⋅To have a line break without a paragraph, you will need to use two trailing spaces.⋅⋅
      ⋅⋅⋅Note that this line is separate, but within the same paragraph.⋅⋅
      ⋅⋅⋅(This is contrary to the typical GFM line break behaviour, where trailing spaces are not required.)

      * Unordered list can use asterisks
      - Or minuses
      + Or pluses</code></pre><ol start="1"><li><p>First ordered list item</p></li><li><p>Another item</p></li></ol><ul><li><p>Unordered sub-list.</p></li></ul><ol start="1"><li><p>Actual numbers don&#x27;t matter, just that it&#x27;s a number</p></li><li><p>Ordered sub-list</p></li><li><p>And another item.</p><p>You can have properly indented paragraphs within list items. Notice the blank line above, and the leading spaces (at least one, but we&#x27;ll use three here to also align the raw Markdown).</p><p>To have a line break without a paragraph, you will need to use two trailing spaces.<br/>Note that this line is separate, but within the same paragraph.<br/>(This is contrary to the typical GFM line break behaviour, where trailing spaces are not required.)</p></li></ol><ul><li><p>Unordered list can use asterisks</p></li></ul><ul><li><p>Or minuses</p></li></ul><ul><li><p>Or pluses</p></li></ul><a name="links"></a><h2>Links</h2><p>There are two ways to create links.</p><pre><code>[I&#x27;m an inline-style link](https://www.google.com)

      [I&#x27;m an inline-style link with title](https://www.google.com &quot;Google&#x27;s Homepage&quot;)

      [I&#x27;m a reference-style link][Arbitrary case-insensitive reference text]

      [I&#x27;m a relative reference to a repository file](../blob/master/LICENSE)

      [You can use numbers for reference-style link definitions][1]

      Or leave it empty and use the [link text itself].

      URLs and URLs in angle brackets will automatically get turned into links. 
      http://www.example.com and sometimes 
      example.com (but not on Github, for example).

      Some text to show that the reference links can follow later.

      [arbitrary case-insensitive reference text]: https://www.mozilla.org
      [1]: http://slashdot.org
      [link text itself]: http://www.reddit.com</code></pre><p><a href="https://www.google.com" title="">I&#x27;m an inline-style link</a></p><p><a href="https://www.google.com" title="Google&#x27;s Homepage">I&#x27;m an inline-style link with title</a></p><p><a href="https://www.mozilla.org">I&#x27;m a reference-style link</a></p><p><a href="../blob/master/LICENSE" title="">I&#x27;m a relative reference to a repository file</a></p><p><a href="http://slashdot.org">You can use numbers for reference-style link definitions</a></p><p>Or leave it empty and use the <a href="http://www.reddit.com">link text itself</a>.</p><p>URLs and URLs in angle brackets will automatically get turned into links.
      <a href="http://www.example.com" title="">http://www.example.com</a> and sometimes
      example.com (but not on Github, for example).</p><p>Some text to show that the reference links can follow later.</p><a name="images"></a><h2>Images</h2><pre><code>Here&#x27;s our logo (hover to see the title text):

      Inline-style: 
      ![alt text](https://github.com/adam-p/markdown-here/raw/master/src/common/images/icon48.png &quot;Logo Title Text 1&quot;)

      Reference-style: 
      ![alt text][logo]

      [logo]: https://github.com/adam-p/markdown-here/raw/master/src/common/images/icon48.png &quot;Logo Title Text 2&quot;</code></pre><p>Here&#x27;s our logo (hover to see the title text):</p><p>Inline-style:
      <img src="https://github.com/adam-p/markdown-here/raw/master/src/common/images/icon48.png" alt="alt text" title="Logo Title Text 1"/></p><p>Reference-style:
      </p><a name="code"></a><h2>Code and Syntax Highlighting</h2><p>Code blocks are part of the Markdown spec, but syntax highlighting isn&#x27;t. However, many renderers -- like Github&#x27;s and <em>Markdown Here</em> -- support syntax highlighting. Which languages are supported and how those language names should be written will vary from renderer to renderer. <em>Markdown Here</em> supports highlighting for dozens of languages (and not-really-languages, like diffs and HTTP headers); to see the complete list, and how to write the language names, see the <a href="http://softwaremaniacs.org/media/soft/highlight/test.html" title="">highlight.js demo page</a>.</p><pre><code>Inline \`code\` has \`back-ticks around\` it.</code></pre><p>Inline <code>code</code> has <code>back-ticks around</code> it.</p><p>Blocks of code are either fenced by lines with three back-ticks <code>\`\`\`</code>, or are indented with four spaces. I recommend only using the fenced code blocks -- they&#x27;re easier and only they support syntax highlighting.</p><pre><code>var s = &quot;JavaScript syntax highlighting&quot;;
      alert(s);</code></pre><pre><code>s = &quot;Python syntax highlighting&quot;
      print s</code></pre><pre><code>No language indicated, so no syntax highlighting. 
      But let&#x27;s throw in a &amp;lt;b&amp;gt;tag&amp;lt;/b&amp;gt;.</code></pre><pre><code>var s = &quot;JavaScript syntax highlighting&quot;;
      alert(s);</code></pre><pre><code>s = &quot;Python syntax highlighting&quot;
      print s</code></pre><pre><code>No language indicated, so no syntax highlighting in Markdown Here (varies on Github). 
      But let&#x27;s throw in a &lt;b&gt;tag&lt;/b&gt;.</code></pre><a name="tables"></a><h2>Tables</h2><p>Tables aren&#x27;t part of the core Markdown spec, but they are part of GFM and <em>Markdown Here</em> supports them. They are an easy way of adding tables to your email -- a task that would otherwise require copy-pasting from another application.</p><pre><code>Colons can be used to align columns.

      | Tables        | Are           | Cool  |
      | ------------- |:-------------:| -----:|
      | col 3 is      | right-aligned | $1600 |
      | col 2 is      | centered      |   $12 |
      | zebra stripes | are neat      |    $1 |

      There must be at least 3 dashes separating each header cell.
      The outer pipes (|) are optional, and you don&#x27;t need to make the 
      raw Markdown line up prettily. You can also use inline Markdown.

      Markdown | Less | Pretty
      --- | --- | ---
      *Still* | \`renders\` | **nicely**
      1 | 2 | 3</code></pre><p>Colons can be used to align columns.</p><table><thead><tr class=""><td class="">Tables</td><td class="">Are</td><td class="">Cool</td></tr></thead><tbody><tr class=""><td class="">col 3 is</td><td class="">right-aligned</td><td class="">$1600</td></tr><tr class=""><td class="">col 2 is</td><td class="">centered</td><td class="">$12</td></tr><tr class=""><td class="">zebra stripes</td><td class="">are neat</td><td class="">$1</td></tr></tbody></table><p>There must be at least 3 dashes separating each header cell. The outer pipes (|) are optional, and you don&#x27;t need to make the raw Markdown line up prettily. You can also use inline Markdown.</p><table><thead><tr class=""><td class="">Markdown</td><td class="">Less</td><td class="">Pretty</td></tr></thead><tbody><tr class=""><td class=""><em>Still</em></td><td class=""><code>renders</code></td><td class=""><strong>nicely</strong></td></tr><tr class=""><td class="">1</td><td class="">2</td><td class="">3</td></tr></tbody></table><a name="blockquotes"></a><h2>Blockquotes</h2><pre><code>&gt; Blockquotes are very handy in email to emulate reply text.
      &gt; This line is part of the same quote.

      Quote break.

      &gt; This is a very long line that will still be quoted properly when it wraps. Oh boy let&#x27;s keep writing to make sure this is long enough to actually wrap for everyone. Oh, you can *put* **Markdown** into a blockquote. </code></pre><blockquote><p>Blockquotes are very handy in email to emulate reply text.
      This line is part of the same quote.</p></blockquote><p>Quote break.</p><blockquote><p>This is a very long line that will still be quoted properly when it wraps. Oh boy let&#x27;s keep writing to make sure this is long enough to actually wrap for everyone. Oh, you can <em>put</em> <strong>Markdown</strong> into a blockquote.</p></blockquote><a name="html"></a><h2>Inline HTML</h2><p>You can also use raw HTML in your Markdown, and it&#x27;ll mostly work pretty well.</p><pre><code>&lt;dl&gt;
        &lt;dt&gt;Definition list&lt;/dt&gt;
        &lt;dd&gt;Is something people use sometimes.&lt;/dd&gt;

        &lt;dt&gt;Markdown in HTML&lt;/dt&gt;
        &lt;dd&gt;Does *not* work **very** well. Use HTML &lt;em&gt;tags&lt;/em&gt;.&lt;/dd&gt;
      &lt;/dl&gt;</code></pre><a name="hr"></a><h2>Horizontal Rule</h2><pre><code>Three or more...

      ---

      Hyphens

      ***

      Asterisks

      ___

      Underscores</code></pre><p>Three or more...</p><hr/><p>Hyphens</p><hr/><p>Asterisks</p><hr/><p>Underscores</p><a name="lines"></a><h2>Line Breaks</h2><p>My basic recommendation for learning how line breaks work is to experiment and discover -- hit &lt;Enter&gt; once (i.e., insert one newline), then hit it twice (i.e., insert two newlines), see what happens. You&#x27;ll soon learn to get what you want. &quot;Markdown Toggle&quot; is your friend.</p><p>Here are some things to try out:</p><pre><code>Here&#x27;s a line for us to start with.

      This line is separated from the one above by two newlines, so it will be a *separate paragraph*.

      This line is also a separate paragraph, but...
      This line is only separated by a single newline, so it&#x27;s a separate line in the *same paragraph*.</code></pre><p>Here&#x27;s a line for us to start with.</p><p>This line is separated from the one above by two newlines, so it will be a <em>separate paragraph</em>.</p><p>This line is also begins a separate paragraph, but...<br/>This line is only separated by a single newline, so it&#x27;s a separate line in the <em>same paragraph</em>.</p><p>(Technical note: <em>Markdown Here</em> uses GFM line breaks, so there&#x27;s no need to use MD&#x27;s two-space line breaks.)</p><a name="videos"></a><h2>YouTube Videos</h2><p>They can&#x27;t be added directly but you can add an image with a link to the video like this:</p><pre><code>&lt;a href=&quot;http://www.youtube.com/watch?feature=player_embedded&amp;v=YOUTUBE_VIDEO_ID_HERE
      &quot; target=&quot;_blank&quot;&gt;&lt;img src=&quot;http://img.youtube.com/vi/YOUTUBE_VIDEO_ID_HERE/0.jpg&quot; 
      alt=&quot;IMAGE ALT TEXT HERE&quot; width=&quot;240&quot; height=&quot;180&quot; border=&quot;10&quot; /&gt;&lt;/a&gt;</code></pre><p>Or, in pure Markdown, but losing the image sizing and border:</p><pre><code>[![IMAGE ALT TEXT HERE](http://img.youtube.com/vi/YOUTUBE_VIDEO_ID_HERE/0.jpg)](http://www.youtube.com/watch?v=YOUTUBE_VIDEO_ID_HERE)</code></pre>",
        "result": {
          "$$typeof": Symbol(react.transitional.element),
          "_owner": null,
          "_store": {},
          "key": null,
          "props": {
            "children": [
              {
                "$$typeof": Symbol(react.transitional.element),
                "_owner": null,
                "_store": {},
                "key": "0",
                "props": {
                  "children": "Markdown Kitchen Sink",
                },
                "type": "h1",
              },
              {
                "$$typeof": Symbol(react.transitional.element),
                "_owner": null,
                "_store": {},
                "key": "1",
                "props": {
                  "children": [
                    "This file is ",
                    {
                      "$$typeof": Symbol(react.transitional.element),
                      "_owner": null,
                      "_store": {},
                      "key": "1",
                      "props": {
                        "children": "https://github.com/adam-p/markdown-here/wiki/Markdown-Cheatsheet",
                        "href": "https://github.com/adam-p/markdown-here/wiki/Markdown-Cheatsheet",
                        "title": "",
                      },
                      "type": "a",
                    },
                    " plus a few fixes and additions. Used by ",
                    {
                      "$$typeof": Symbol(react.transitional.element),
                      "_owner": null,
                      "_store": {},
                      "key": "3",
                      "props": {
                        "children": "obedm503/bootmark",
                        "href": "https://github.com/obedm503/bootmark",
                        "title": "",
                      },
                      "type": "a",
                    },
                    " to ",
                    {
                      "$$typeof": Symbol(react.transitional.element),
                      "_owner": null,
                      "_store": {},
                      "key": "5",
                      "props": {
                        "children": "demonstrate",
                        "href": "https://obedm503.github.io/bootmark/docs/markdown-cheatsheet.html",
                        "title": "",
                      },
                      "type": "a",
                    },
                    " it's styling features.",
                  ],
                },
                "type": "p",
              },
              {
                "$$typeof": Symbol(react.transitional.element),
                "_owner": null,
                "_store": {},
                "key": "2",
                "props": {
                  "children": [
                    "This is intended as a quick reference and showcase. For more complete info, see ",
                    {
                      "$$typeof": Symbol(react.transitional.element),
                      "_owner": null,
                      "_store": {},
                      "key": "1",
                      "props": {
                        "children": "John Gruber's original spec",
                        "href": "http://daringfireball.net/projects/markdown/",
                        "title": "",
                      },
                      "type": "a",
                    },
                    " and the ",
                    {
                      "$$typeof": Symbol(react.transitional.element),
                      "_owner": null,
                      "_store": {},
                      "key": "3",
                      "props": {
                        "children": "Github-flavored Markdown info page",
                        "href": "http://github.github.com/github-flavored-markdown/",
                        "title": "",
                      },
                      "type": "a",
                    },
                    ".",
                  ],
                },
                "type": "p",
              },
              {
                "$$typeof": Symbol(react.transitional.element),
                "_owner": null,
                "_store": {},
                "key": "3",
                "props": {
                  "children": [
                    "Note that there is also a ",
                    {
                      "$$typeof": Symbol(react.transitional.element),
                      "_owner": null,
                      "_store": {},
                      "key": "1",
                      "props": {
                        "children": "Cheatsheet specific to Markdown Here",
                        "href": "./Markdown-Here-Cheatsheet",
                        "title": "",
                      },
                      "type": "a",
                    },
                    " if that's what you're looking for. You can also check out ",
                    {
                      "$$typeof": Symbol(react.transitional.element),
                      "_owner": null,
                      "_store": {},
                      "key": "3",
                      "props": {
                        "children": "more Markdown tools",
                        "href": "./Other-Markdown-Tools",
                        "title": "",
                      },
                      "type": "a",
                    },
                    ".",
                  ],
                },
                "type": "p",
              },
              {
                "$$typeof": Symbol(react.transitional.element),
                "_owner": null,
                "_store": {},
                "key": "4",
                "props": {
                  "children": "Table of Contents",
                },
                "type": "h5",
              },
              {
                "$$typeof": Symbol(react.transitional.element),
                "_owner": null,
                "_store": {},
                "key": "5",
                "props": {
                  "children": [
                    {
                      "$$typeof": Symbol(react.transitional.element),
                      "_owner": null,
                      "_store": {},
                      "key": "0",
                      "props": {
                        "children": "Headers",
                        "href": "#headers",
                        "title": "",
                      },
                      "type": "a",
                    },
                    {
                      "$$typeof": Symbol(react.transitional.element),
                      "_owner": null,
                      "_store": {},
                      "key": "1",
                      "props": {},
                      "type": "br",
                    },
                    {
                      "$$typeof": Symbol(react.transitional.element),
                      "_owner": null,
                      "_store": {},
                      "key": "2",
                      "props": {
                        "children": "Emphasis",
                        "href": "#emphasis",
                        "title": "",
                      },
                      "type": "a",
                    },
                    {
                      "$$typeof": Symbol(react.transitional.element),
                      "_owner": null,
                      "_store": {},
                      "key": "3",
                      "props": {},
                      "type": "br",
                    },
                    {
                      "$$typeof": Symbol(react.transitional.element),
                      "_owner": null,
                      "_store": {},
                      "key": "4",
                      "props": {
                        "children": "Lists",
                        "href": "#lists",
                        "title": "",
                      },
                      "type": "a",
                    },
                    {
                      "$$typeof": Symbol(react.transitional.element),
                      "_owner": null,
                      "_store": {},
                      "key": "5",
                      "props": {},
                      "type": "br",
                    },
                    {
                      "$$typeof": Symbol(react.transitional.element),
                      "_owner": null,
                      "_store": {},
                      "key": "6",
                      "props": {
                        "children": "Links",
                        "href": "#links",
                        "title": "",
                      },
                      "type": "a",
                    },
                    {
                      "$$typeof": Symbol(react.transitional.element),
                      "_owner": null,
                      "_store": {},
                      "key": "7",
                      "props": {},
                      "type": "br",
                    },
                    {
                      "$$typeof": Symbol(react.transitional.element),
                      "_owner": null,
                      "_store": {},
                      "key": "8",
                      "props": {
                        "children": "Images",
                        "href": "#images",
                        "title": "",
                      },
                      "type": "a",
                    },
                    {
                      "$$typeof": Symbol(react.transitional.element),
                      "_owner": null,
                      "_store": {},
                      "key": "9",
                      "props": {},
                      "type": "br",
                    },
                    {
                      "$$typeof": Symbol(react.transitional.element),
                      "_owner": null,
                      "_store": {},
                      "key": "10",
                      "props": {
                        "children": "Code and Syntax Highlighting",
                        "href": "#code",
                        "title": "",
                      },
                      "type": "a",
                    },
                    {
                      "$$typeof": Symbol(react.transitional.element),
                      "_owner": null,
                      "_store": {},
                      "key": "11",
                      "props": {},
                      "type": "br",
                    },
                    {
                      "$$typeof": Symbol(react.transitional.element),
                      "_owner": null,
                      "_store": {},
                      "key": "12",
                      "props": {
                        "children": "Tables",
                        "href": "#tables",
                        "title": "",
                      },
                      "type": "a",
                    },
                    {
                      "$$typeof": Symbol(react.transitional.element),
                      "_owner": null,
                      "_store": {},
                      "key": "13",
                      "props": {},
                      "type": "br",
                    },
                    {
                      "$$typeof": Symbol(react.transitional.element),
                      "_owner": null,
                      "_store": {},
                      "key": "14",
                      "props": {
                        "children": "Blockquotes",
                        "href": "#blockquotes",
                        "title": "",
                      },
                      "type": "a",
                    },
                    {
                      "$$typeof": Symbol(react.transitional.element),
                      "_owner": null,
                      "_store": {},
                      "key": "15",
                      "props": {},
                      "type": "br",
                    },
                    {
                      "$$typeof": Symbol(react.transitional.element),
                      "_owner": null,
                      "_store": {},
                      "key": "16",
                      "props": {
                        "children": "Inline HTML",
                        "href": "#html",
                        "title": "",
                      },
                      "type": "a",
                    },
                    {
                      "$$typeof": Symbol(react.transitional.element),
                      "_owner": null,
                      "_store": {},
                      "key": "17",
                      "props": {},
                      "type": "br",
                    },
                    {
                      "$$typeof": Symbol(react.transitional.element),
                      "_owner": null,
                      "_store": {},
                      "key": "18",
                      "props": {
                        "children": "Horizontal Rule",
                        "href": "#hr",
                        "title": "",
                      },
                      "type": "a",
                    },
                    {
                      "$$typeof": Symbol(react.transitional.element),
                      "_owner": null,
                      "_store": {},
                      "key": "19",
                      "props": {},
                      "type": "br",
                    },
                    {
                      "$$typeof": Symbol(react.transitional.element),
                      "_owner": null,
                      "_store": {},
                      "key": "20",
                      "props": {
                        "children": "Line Breaks",
                        "href": "#lines",
                        "title": "",
                      },
                      "type": "a",
                    },
                    {
                      "$$typeof": Symbol(react.transitional.element),
                      "_owner": null,
                      "_store": {},
                      "key": "21",
                      "props": {},
                      "type": "br",
                    },
                    {
                      "$$typeof": Symbol(react.transitional.element),
                      "_owner": null,
                      "_store": {},
                      "key": "22",
                      "props": {
                        "children": "YouTube Videos",
                        "href": "#videos",
                        "title": "",
                      },
                      "type": "a",
                    },
                  ],
                },
                "type": "p",
              },
              {
                "$$typeof": Symbol(react.transitional.element),
                "_owner": null,
                "_store": {},
                "key": "6",
                "props": {
                  "children": null,
                  "name": "headers",
                },
                "type": "a",
              },
              {
                "$$typeof": Symbol(react.transitional.element),
                "_owner": null,
                "_store": {},
                "key": "7",
                "props": {
                  "children": "Headers",
                },
                "type": "h2",
              },
              {
                "$$typeof": Symbol(react.transitional.element),
                "_owner": null,
                "_store": {},
                "key": "8",
                "props": {
                  "children": "H1",
                },
                "type": "h1",
              },
              {
                "$$typeof": Symbol(react.transitional.element),
                "_owner": null,
                "_store": {},
                "key": "9",
                "props": {
                  "children": "H2",
                },
                "type": "h2",
              },
              {
                "$$typeof": Symbol(react.transitional.element),
                "_owner": null,
                "_store": {},
                "key": "10",
                "props": {
                  "children": "H3",
                },
                "type": "h3",
              },
              {
                "$$typeof": Symbol(react.transitional.element),
                "_owner": null,
                "_store": {},
                "key": "11",
                "props": {
                  "children": "H4",
                },
                "type": "h4",
              },
              {
                "$$typeof": Symbol(react.transitional.element),
                "_owner": null,
                "_store": {},
                "key": "12",
                "props": {
                  "children": "H5",
                },
                "type": "h5",
              },
              {
                "$$typeof": Symbol(react.transitional.element),
                "_owner": null,
                "_store": {},
                "key": "13",
                "props": {
                  "children": "H6",
                },
                "type": "h6",
              },
              {
                "$$typeof": Symbol(react.transitional.element),
                "_owner": null,
                "_store": {},
                "key": "14",
                "props": {
                  "children": "Alternatively, for H1 and H2, an underline-ish style:",
                },
                "type": "p",
              },
              {
                "$$typeof": Symbol(react.transitional.element),
                "_owner": null,
                "_store": {},
                "key": "15",
                "props": {
                  "children": "Alt-H1",
                },
                "type": "h1",
              },
              {
                "$$typeof": Symbol(react.transitional.element),
                "_owner": null,
                "_store": {},
                "key": "16",
                "props": {
                  "children": "Alt-H2",
                },
                "type": "h2",
              },
              {
                "$$typeof": Symbol(react.transitional.element),
                "_owner": null,
                "_store": {},
                "key": "17",
                "props": {
                  "children": "H1",
                },
                "type": "h1",
              },
              {
                "$$typeof": Symbol(react.transitional.element),
                "_owner": null,
                "_store": {},
                "key": "18",
                "props": {
                  "children": "H2",
                },
                "type": "h2",
              },
              {
                "$$typeof": Symbol(react.transitional.element),
                "_owner": null,
                "_store": {},
                "key": "19",
                "props": {
                  "children": "H3",
                },
                "type": "h3",
              },
              {
                "$$typeof": Symbol(react.transitional.element),
                "_owner": null,
                "_store": {},
                "key": "20",
                "props": {
                  "children": "H4",
                },
                "type": "h4",
              },
              {
                "$$typeof": Symbol(react.transitional.element),
                "_owner": null,
                "_store": {},
                "key": "21",
                "props": {
                  "children": "H5",
                },
                "type": "h5",
              },
              {
                "$$typeof": Symbol(react.transitional.element),
                "_owner": null,
                "_store": {},
                "key": "22",
                "props": {
                  "children": "H6",
                },
                "type": "h6",
              },
              {
                "$$typeof": Symbol(react.transitional.element),
                "_owner": null,
                "_store": {},
                "key": "23",
                "props": {
                  "children": "Alternatively, for H1 and H2, an underline-ish style:",
                },
                "type": "p",
              },
              {
                "$$typeof": Symbol(react.transitional.element),
                "_owner": null,
                "_store": {},
                "key": "24",
                "props": {
                  "children": "Alt-H1",
                },
                "type": "h1",
              },
              {
                "$$typeof": Symbol(react.transitional.element),
                "_owner": null,
                "_store": {},
                "key": "25",
                "props": {
                  "children": "Alt-H2",
                },
                "type": "h2",
              },
              {
                "$$typeof": Symbol(react.transitional.element),
                "_owner": null,
                "_store": {},
                "key": "26",
                "props": {
                  "children": null,
                  "name": "emphasis",
                },
                "type": "a",
              },
              {
                "$$typeof": Symbol(react.transitional.element),
                "_owner": null,
                "_store": {},
                "key": "27",
                "props": {
                  "children": "Emphasis",
                },
                "type": "h2",
              },
              {
                "$$typeof": Symbol(react.transitional.element),
                "_owner": null,
                "_store": {},
                "key": "28",
                "props": {
                  "children": {
                    "$$typeof": Symbol(react.transitional.element),
                    "_owner": null,
                    "_store": {},
                    "key": null,
                    "props": {
                      "children": "Emphasis, aka italics, with *asterisks* or _underscores_.

      Strong emphasis, aka bold, with **asterisks** or __underscores__.

      Combined emphasis with **asterisks and _underscores_**.

      Strikethrough uses two tildes. ~~Scratch this.~~",
                    },
                    "type": "code",
                  },
                },
                "type": "pre",
              },
              {
                "$$typeof": Symbol(react.transitional.element),
                "_owner": null,
                "_store": {},
                "key": "29",
                "props": {
                  "children": [
                    "Emphasis, aka italics, with ",
                    {
                      "$$typeof": Symbol(react.transitional.element),
                      "_owner": null,
                      "_store": {},
                      "key": "1",
                      "props": {
                        "children": "asterisks",
                      },
                      "type": "em",
                    },
                    " or ",
                    {
                      "$$typeof": Symbol(react.transitional.element),
                      "_owner": null,
                      "_store": {},
                      "key": "3",
                      "props": {
                        "children": "underscores",
                      },
                      "type": "em",
                    },
                    ".",
                  ],
                },
                "type": "p",
              },
              {
                "$$typeof": Symbol(react.transitional.element),
                "_owner": null,
                "_store": {},
                "key": "30",
                "props": {
                  "children": [
                    "Strong emphasis, aka bold, with ",
                    {
                      "$$typeof": Symbol(react.transitional.element),
                      "_owner": null,
                      "_store": {},
                      "key": "1",
                      "props": {
                        "children": "asterisks",
                      },
                      "type": "strong",
                    },
                    " or ",
                    {
                      "$$typeof": Symbol(react.transitional.element),
                      "_owner": null,
                      "_store": {},
                      "key": "3",
                      "props": {
                        "children": "underscores",
                      },
                      "type": "strong",
                    },
                    ".",
                  ],
                },
                "type": "p",
              },
              {
                "$$typeof": Symbol(react.transitional.element),
                "_owner": null,
                "_store": {},
                "key": "31",
                "props": {
                  "children": [
                    "Combined emphasis with ",
                    {
                      "$$typeof": Symbol(react.transitional.element),
                      "_owner": null,
                      "_store": {},
                      "key": "1",
                      "props": {
                        "children": [
                          "asterisks and ",
                          {
                            "$$typeof": Symbol(react.transitional.element),
                            "_owner": null,
                            "_store": {},
                            "key": "1",
                            "props": {
                              "children": "underscores",
                            },
                            "type": "em",
                          },
                        ],
                      },
                      "type": "strong",
                    },
                    ".",
                  ],
                },
                "type": "p",
              },
              {
                "$$typeof": Symbol(react.transitional.element),
                "_owner": null,
                "_store": {},
                "key": "32",
                "props": {
                  "children": [
                    "Strikethrough uses two tildes. ",
                    {
                      "$$typeof": Symbol(react.transitional.element),
                      "_owner": null,
                      "_store": {},
                      "key": "1",
                      "props": {
                        "children": "Scratch this.",
                      },
                      "type": "del",
                    },
                  ],
                },
                "type": "p",
              },
              {
                "$$typeof": Symbol(react.transitional.element),
                "_owner": null,
                "_store": {},
                "key": "33",
                "props": {
                  "children": null,
                  "name": "lists",
                },
                "type": "a",
              },
              {
                "$$typeof": Symbol(react.transitional.element),
                "_owner": null,
                "_store": {},
                "key": "34",
                "props": {
                  "children": "Lists",
                },
                "type": "h2",
              },
              {
                "$$typeof": Symbol(react.transitional.element),
                "_owner": null,
                "_store": {},
                "key": "35",
                "props": {
                  "children": "(In this example, leading and trailing spaces are shown with with dots: ⋅)",
                },
                "type": "p",
              },
              {
                "$$typeof": Symbol(react.transitional.element),
                "_owner": null,
                "_store": {},
                "key": "36",
                "props": {
                  "children": {
                    "$$typeof": Symbol(react.transitional.element),
                    "_owner": null,
                    "_store": {},
                    "key": null,
                    "props": {
                      "children": "1. First ordered list item
      2. Another item
      ⋅⋅* Unordered sub-list. 
      1. Actual numbers don't matter, just that it's a number
      ⋅⋅1. Ordered sub-list
      4. And another item.

      ⋅⋅⋅You can have properly indented paragraphs within list items. Notice the blank line above, and the leading spaces (at least one, but we'll use three here to also align the raw Markdown).

      ⋅⋅⋅To have a line break without a paragraph, you will need to use two trailing spaces.⋅⋅
      ⋅⋅⋅Note that this line is separate, but within the same paragraph.⋅⋅
      ⋅⋅⋅(This is contrary to the typical GFM line break behaviour, where trailing spaces are not required.)

      * Unordered list can use asterisks
      - Or minuses
      + Or pluses",
                    },
                    "type": "code",
                  },
                },
                "type": "pre",
              },
              {
                "$$typeof": Symbol(react.transitional.element),
                "_owner": null,
                "_store": {},
                "key": "37",
                "props": {
                  "children": [
                    {
                      "$$typeof": Symbol(react.transitional.element),
                      "_owner": null,
                      "_store": {},
                      "key": "0",
                      "props": {
                        "children": {
                          "$$typeof": Symbol(react.transitional.element),
                          "_owner": null,
                          "_store": {},
                          "key": null,
                          "props": {
                            "children": "First ordered list item",
                          },
                          "type": "p",
                        },
                      },
                      "type": "li",
                    },
                    {
                      "$$typeof": Symbol(react.transitional.element),
                      "_owner": null,
                      "_store": {},
                      "key": "1",
                      "props": {
                        "children": {
                          "$$typeof": Symbol(react.transitional.element),
                          "_owner": null,
                          "_store": {},
                          "key": null,
                          "props": {
                            "children": "Another item",
                          },
                          "type": "p",
                        },
                      },
                      "type": "li",
                    },
                  ],
                  "start": 1,
                },
                "type": "ol",
              },
              {
                "$$typeof": Symbol(react.transitional.element),
                "_owner": null,
                "_store": {},
                "key": "38",
                "props": {
                  "children": {
                    "$$typeof": Symbol(react.transitional.element),
                    "_owner": null,
                    "_store": {},
                    "key": null,
                    "props": {
                      "children": {
                        "$$typeof": Symbol(react.transitional.element),
                        "_owner": null,
                        "_store": {},
                        "key": null,
                        "props": {
                          "children": "Unordered sub-list.",
                        },
                        "type": "p",
                      },
                    },
                    "type": "li",
                  },
                },
                "type": "ul",
              },
              {
                "$$typeof": Symbol(react.transitional.element),
                "_owner": null,
                "_store": {},
                "key": "39",
                "props": {
                  "children": [
                    {
                      "$$typeof": Symbol(react.transitional.element),
                      "_owner": null,
                      "_store": {},
                      "key": "0",
                      "props": {
                        "children": {
                          "$$typeof": Symbol(react.transitional.element),
                          "_owner": null,
                          "_store": {},
                          "key": null,
                          "props": {
                            "children": "Actual numbers don't matter, just that it's a number",
                          },
                          "type": "p",
                        },
                      },
                      "type": "li",
                    },
                    {
                      "$$typeof": Symbol(react.transitional.element),
                      "_owner": null,
                      "_store": {},
                      "key": "1",
                      "props": {
                        "children": {
                          "$$typeof": Symbol(react.transitional.element),
                          "_owner": null,
                          "_store": {},
                          "key": null,
                          "props": {
                            "children": "Ordered sub-list",
                          },
                          "type": "p",
                        },
                      },
                      "type": "li",
                    },
                    {
                      "$$typeof": Symbol(react.transitional.element),
                      "_owner": null,
                      "_store": {},
                      "key": "2",
                      "props": {
                        "children": [
                          {
                            "$$typeof": Symbol(react.transitional.element),
                            "_owner": null,
                            "_store": {},
                            "key": "0",
                            "props": {
                              "children": "And another item.",
                            },
                            "type": "p",
                          },
                          {
                            "$$typeof": Symbol(react.transitional.element),
                            "_owner": null,
                            "_store": {},
                            "key": "1",
                            "props": {
                              "children": "You can have properly indented paragraphs within list items. Notice the blank line above, and the leading spaces (at least one, but we'll use three here to also align the raw Markdown).",
                            },
                            "type": "p",
                          },
                          {
                            "$$typeof": Symbol(react.transitional.element),
                            "_owner": null,
                            "_store": {},
                            "key": "2",
                            "props": {
                              "children": [
                                "To have a line break without a paragraph, you will need to use two trailing spaces.",
                                {
                                  "$$typeof": Symbol(react.transitional.element),
                                  "_owner": null,
                                  "_store": {},
                                  "key": "1",
                                  "props": {},
                                  "type": "br",
                                },
                                "Note that this line is separate, but within the same paragraph.",
                                {
                                  "$$typeof": Symbol(react.transitional.element),
                                  "_owner": null,
                                  "_store": {},
                                  "key": "3",
                                  "props": {},
                                  "type": "br",
                                },
                                "(This is contrary to the typical GFM line break behaviour, where trailing spaces are not required.)",
                              ],
                            },
                            "type": "p",
                          },
                        ],
                      },
                      "type": "li",
                    },
                  ],
                  "start": 1,
                },
                "type": "ol",
              },
              {
                "$$typeof": Symbol(react.transitional.element),
                "_owner": null,
                "_store": {},
                "key": "40",
                "props": {
                  "children": {
                    "$$typeof": Symbol(react.transitional.element),
                    "_owner": null,
                    "_store": {},
                    "key": null,
                    "props": {
                      "children": {
                        "$$typeof": Symbol(react.transitional.element),
                        "_owner": null,
                        "_store": {},
                        "key": null,
                        "props": {
                          "children": "Unordered list can use asterisks",
                        },
                        "type": "p",
                      },
                    },
                    "type": "li",
                  },
                },
                "type": "ul",
              },
              {
                "$$typeof": Symbol(react.transitional.element),
                "_owner": null,
                "_store": {},
                "key": "41",
                "props": {
                  "children": {
                    "$$typeof": Symbol(react.transitional.element),
                    "_owner": null,
                    "_store": {},
                    "key": null,
                    "props": {
                      "children": {
                        "$$typeof": Symbol(react.transitional.element),
                        "_owner": null,
                        "_store": {},
                        "key": null,
                        "props": {
                          "children": "Or minuses",
                        },
                        "type": "p",
                      },
                    },
                    "type": "li",
                  },
                },
                "type": "ul",
              },
              {
                "$$typeof": Symbol(react.transitional.element),
                "_owner": null,
                "_store": {},
                "key": "42",
                "props": {
                  "children": {
                    "$$typeof": Symbol(react.transitional.element),
                    "_owner": null,
                    "_store": {},
                    "key": null,
                    "props": {
                      "children": {
                        "$$typeof": Symbol(react.transitional.element),
                        "_owner": null,
                        "_store": {},
                        "key": null,
                        "props": {
                          "children": "Or pluses",
                        },
                        "type": "p",
                      },
                    },
                    "type": "li",
                  },
                },
                "type": "ul",
              },
              {
                "$$typeof": Symbol(react.transitional.element),
                "_owner": null,
                "_store": {},
                "key": "43",
                "props": {
                  "children": null,
                  "name": "links",
                },
                "type": "a",
              },
              {
                "$$typeof": Symbol(react.transitional.element),
                "_owner": null,
                "_store": {},
                "key": "44",
                "props": {
                  "children": "Links",
                },
                "type": "h2",
              },
              {
                "$$typeof": Symbol(react.transitional.element),
                "_owner": null,
                "_store": {},
                "key": "45",
                "props": {
                  "children": "There are two ways to create links.",
                },
                "type": "p",
              },
              {
                "$$typeof": Symbol(react.transitional.element),
                "_owner": null,
                "_store": {},
                "key": "46",
                "props": {
                  "children": {
                    "$$typeof": Symbol(react.transitional.element),
                    "_owner": null,
                    "_store": {},
                    "key": null,
                    "props": {
                      "children": "[I'm an inline-style link](https://www.google.com)

      [I'm an inline-style link with title](https://www.google.com "Google's Homepage")

      [I'm a reference-style link][Arbitrary case-insensitive reference text]

      [I'm a relative reference to a repository file](../blob/master/LICENSE)

      [You can use numbers for reference-style link definitions][1]

      Or leave it empty and use the [link text itself].

      URLs and URLs in angle brackets will automatically get turned into links. 
      http://www.example.com and sometimes 
      example.com (but not on Github, for example).

      Some text to show that the reference links can follow later.

      [arbitrary case-insensitive reference text]: https://www.mozilla.org
      [1]: http://slashdot.org
      [link text itself]: http://www.reddit.com",
                    },
                    "type": "code",
                  },
                },
                "type": "pre",
              },
              {
                "$$typeof": Symbol(react.transitional.element),
                "_owner": null,
                "_store": {},
                "key": "47",
                "props": {
                  "children": {
                    "$$typeof": Symbol(react.transitional.element),
                    "_owner": null,
                    "_store": {},
                    "key": null,
                    "props": {
                      "children": "I'm an inline-style link",
                      "href": "https://www.google.com",
                      "title": "",
                    },
                    "type": "a",
                  },
                },
                "type": "p",
              },
              {
                "$$typeof": Symbol(react.transitional.element),
                "_owner": null,
                "_store": {},
                "key": "48",
                "props": {
                  "children": {
                    "$$typeof": Symbol(react.transitional.element),
                    "_owner": null,
                    "_store": {},
                    "key": null,
                    "props": {
                      "children": "I'm an inline-style link with title",
                      "href": "https://www.google.com",
                      "title": "Google's Homepage",
                    },
                    "type": "a",
                  },
                },
                "type": "p",
              },
              {
                "$$typeof": Symbol(react.transitional.element),
                "_owner": null,
                "_store": {},
                "key": "49",
                "props": {
                  "children": {
                    "$$typeof": Symbol(react.transitional.element),
                    "_owner": null,
                    "_store": {},
                    "key": null,
                    "props": {
                      "children": "I'm a reference-style link",
                      "href": "https://www.mozilla.org",
                    },
                    "type": "a",
                  },
                },
                "type": "p",
              },
              {
                "$$typeof": Symbol(react.transitional.element),
                "_owner": null,
                "_store": {},
                "key": "50",
                "props": {
                  "children": {
                    "$$typeof": Symbol(react.transitional.element),
                    "_owner": null,
                    "_store": {},
                    "key": null,
                    "props": {
                      "children": "I'm a relative reference to a repository file",
                      "href": "../blob/master/LICENSE",
                      "title": "",
                    },
                    "type": "a",
                  },
                },
                "type": "p",
              },
              {
                "$$typeof": Symbol(react.transitional.element),
                "_owner": null,
                "_store": {},
                "key": "51",
                "props": {
                  "children": {
                    "$$typeof": Symbol(react.transitional.element),
                    "_owner": null,
                    "_store": {},
                    "key": null,
                    "props": {
                      "children": "You can use numbers for reference-style link definitions",
                      "href": "http://slashdot.org",
                    },
                    "type": "a",
                  },
                },
                "type": "p",
              },
              {
                "$$typeof": Symbol(react.transitional.element),
                "_owner": null,
                "_store": {},
                "key": "52",
                "props": {
                  "children": [
                    "Or leave it empty and use the ",
                    {
                      "$$typeof": Symbol(react.transitional.element),
                      "_owner": null,
                      "_store": {},
                      "key": "1",
                      "props": {
                        "children": "link text itself",
                        "href": "http://www.reddit.com",
                      },
                      "type": "a",
                    },
                    ".",
                  ],
                },
                "type": "p",
              },
              {
                "$$typeof": Symbol(react.transitional.element),
                "_owner": null,
                "_store": {},
                "key": "53",
                "props": {
                  "children": [
                    "URLs and URLs in angle brackets will automatically get turned into links.
      ",
                    {
                      "$$typeof": Symbol(react.transitional.element),
                      "_owner": null,
                      "_store": {},
                      "key": "1",
                      "props": {
                        "children": "http://www.example.com",
                        "href": "http://www.example.com",
                        "title": "",
                      },
                      "type": "a",
                    },
                    " and sometimes
      example.com (but not on Github, for example).",
                  ],
                },
                "type": "p",
              },
              {
                "$$typeof": Symbol(react.transitional.element),
                "_owner": null,
                "_store": {},
                "key": "54",
                "props": {
                  "children": "Some text to show that the reference links can follow later.",
                },
                "type": "p",
              },
              {
                "$$typeof": Symbol(react.transitional.element),
                "_owner": null,
                "_store": {},
                "key": "55",
                "props": {
                  "children": null,
                  "name": "images",
                },
                "type": "a",
              },
              {
                "$$typeof": Symbol(react.transitional.element),
                "_owner": null,
                "_store": {},
                "key": "56",
                "props": {
                  "children": "Images",
                },
                "type": "h2",
              },
              {
                "$$typeof": Symbol(react.transitional.element),
                "_owner": null,
                "_store": {},
                "key": "57",
                "props": {
                  "children": {
                    "$$typeof": Symbol(react.transitional.element),
                    "_owner": null,
                    "_store": {},
                    "key": null,
                    "props": {
                      "children": "Here's our logo (hover to see the title text):

      Inline-style: 
      ![alt text](https://github.com/adam-p/markdown-here/raw/master/src/common/images/icon48.png "Logo Title Text 1")

      Reference-style: 
      ![alt text][logo]

      [logo]: https://github.com/adam-p/markdown-here/raw/master/src/common/images/icon48.png "Logo Title Text 2"",
                    },
                    "type": "code",
                  },
                },
                "type": "pre",
              },
              {
                "$$typeof": Symbol(react.transitional.element),
                "_owner": null,
                "_store": {},
                "key": "58",
                "props": {
                  "children": "Here's our logo (hover to see the title text):",
                },
                "type": "p",
              },
              {
                "$$typeof": Symbol(react.transitional.element),
                "_owner": null,
                "_store": {},
                "key": "59",
                "props": {
                  "children": [
                    "Inline-style:
      ",
                    {
                      "$$typeof": Symbol(react.transitional.element),
                      "_owner": null,
                      "_store": {},
                      "key": "1",
                      "props": {
                        "alt": "alt text",
                        "src": "https://github.com/adam-p/markdown-here/raw/master/src/common/images/icon48.png",
                        "title": "Logo Title Text 1",
                      },
                      "type": "img",
                    },
                  ],
                },
                "type": "p",
              },
              {
                "$$typeof": Symbol(react.transitional.element),
                "_owner": null,
                "_store": {},
                "key": "60",
                "props": {
                  "children": "Reference-style:
      ",
                },
                "type": "p",
              },
              {
                "$$typeof": Symbol(react.transitional.element),
                "_owner": null,
                "_store": {},
                "key": "61",
                "props": {
                  "children": null,
                  "name": "code",
                },
                "type": "a",
              },
              {
                "$$typeof": Symbol(react.transitional.element),
                "_owner": null,
                "_store": {},
                "key": "62",
                "props": {
                  "children": "Code and Syntax Highlighting",
                },
                "type": "h2",
              },
              {
                "$$typeof": Symbol(react.transitional.element),
                "_owner": null,
                "_store": {},
                "key": "63",
                "props": {
                  "children": [
                    "Code blocks are part of the Markdown spec, but syntax highlighting isn't. However, many renderers -- like Github's and ",
                    {
                      "$$typeof": Symbol(react.transitional.element),
                      "_owner": null,
                      "_store": {},
                      "key": "1",
                      "props": {
                        "children": "Markdown Here",
                      },
                      "type": "em",
                    },
                    " -- support syntax highlighting. Which languages are supported and how those language names should be written will vary from renderer to renderer. ",
                    {
                      "$$typeof": Symbol(react.transitional.element),
                      "_owner": null,
                      "_store": {},
                      "key": "3",
                      "props": {
                        "children": "Markdown Here",
                      },
                      "type": "em",
                    },
                    " supports highlighting for dozens of languages (and not-really-languages, like diffs and HTTP headers); to see the complete list, and how to write the language names, see the ",
                    {
                      "$$typeof": Symbol(react.transitional.element),
                      "_owner": null,
                      "_store": {},
                      "key": "5",
                      "props": {
                        "children": "highlight.js demo page",
                        "href": "http://softwaremaniacs.org/media/soft/highlight/test.html",
                        "title": "",
                      },
                      "type": "a",
                    },
                    ".",
                  ],
                },
                "type": "p",
              },
              {
                "$$typeof": Symbol(react.transitional.element),
                "_owner": null,
                "_store": {},
                "key": "64",
                "props": {
                  "children": {
                    "$$typeof": Symbol(react.transitional.element),
                    "_owner": null,
                    "_store": {},
                    "key": null,
                    "props": {
                      "children": "Inline \`code\` has \`back-ticks around\` it.",
                    },
                    "type": "code",
                  },
                },
                "type": "pre",
              },
              {
                "$$typeof": Symbol(react.transitional.element),
                "_owner": null,
                "_store": {},
                "key": "65",
                "props": {
                  "children": [
                    "Inline ",
                    {
                      "$$typeof": Symbol(react.transitional.element),
                      "_owner": null,
                      "_store": {},
                      "key": "1",
                      "props": {
                        "children": "code",
                      },
                      "type": "code",
                    },
                    " has ",
                    {
                      "$$typeof": Symbol(react.transitional.element),
                      "_owner": null,
                      "_store": {},
                      "key": "3",
                      "props": {
                        "children": "back-ticks around",
                      },
                      "type": "code",
                    },
                    " it.",
                  ],
                },
                "type": "p",
              },
              {
                "$$typeof": Symbol(react.transitional.element),
                "_owner": null,
                "_store": {},
                "key": "66",
                "props": {
                  "children": [
                    "Blocks of code are either fenced by lines with three back-ticks ",
                    {
                      "$$typeof": Symbol(react.transitional.element),
                      "_owner": null,
                      "_store": {},
                      "key": "1",
                      "props": {
                        "children": "\`\`\`",
                      },
                      "type": "code",
                    },
                    ", or are indented with four spaces. I recommend only using the fenced code blocks -- they're easier and only they support syntax highlighting.",
                  ],
                },
                "type": "p",
              },
              {
                "$$typeof": Symbol(react.transitional.element),
                "_owner": null,
                "_store": {},
                "key": "67",
                "props": {
                  "children": {
                    "$$typeof": Symbol(react.transitional.element),
                    "_owner": null,
                    "_store": {},
                    "key": null,
                    "props": {
                      "children": "var s = "JavaScript syntax highlighting";
      alert(s);",
                    },
                    "type": "code",
                  },
                },
                "type": "pre",
              },
              {
                "$$typeof": Symbol(react.transitional.element),
                "_owner": null,
                "_store": {},
                "key": "68",
                "props": {
                  "children": {
                    "$$typeof": Symbol(react.transitional.element),
                    "_owner": null,
                    "_store": {},
                    "key": null,
                    "props": {
                      "children": "s = "Python syntax highlighting"
      print s",
                    },
                    "type": "code",
                  },
                },
                "type": "pre",
              },
              {
                "$$typeof": Symbol(react.transitional.element),
                "_owner": null,
                "_store": {},
                "key": "69",
                "props": {
                  "children": {
                    "$$typeof": Symbol(react.transitional.element),
                    "_owner": null,
                    "_store": {},
                    "key": null,
                    "props": {
                      "children": "No language indicated, so no syntax highlighting. 
      But let's throw in a &lt;b&gt;tag&lt;/b&gt;.",
                    },
                    "type": "code",
                  },
                },
                "type": "pre",
              },
              {
                "$$typeof": Symbol(react.transitional.element),
                "_owner": null,
                "_store": {},
                "key": "70",
                "props": {
                  "children": {
                    "$$typeof": Symbol(react.transitional.element),
                    "_owner": null,
                    "_store": {},
                    "key": null,
                    "props": {
                      "children": "var s = "JavaScript syntax highlighting";
      alert(s);",
                    },
                    "type": "code",
                  },
                },
                "type": "pre",
              },
              {
                "$$typeof": Symbol(react.transitional.element),
                "_owner": null,
                "_store": {},
                "key": "71",
                "props": {
                  "children": {
                    "$$typeof": Symbol(react.transitional.element),
                    "_owner": null,
                    "_store": {},
                    "key": null,
                    "props": {
                      "children": "s = "Python syntax highlighting"
      print s",
                    },
                    "type": "code",
                  },
                },
                "type": "pre",
              },
              {
                "$$typeof": Symbol(react.transitional.element),
                "_owner": null,
                "_store": {},
                "key": "72",
                "props": {
                  "children": {
                    "$$typeof": Symbol(react.transitional.element),
                    "_owner": null,
                    "_store": {},
                    "key": null,
                    "props": {
                      "children": "No language indicated, so no syntax highlighting in Markdown Here (varies on Github). 
      But let's throw in a <b>tag</b>.",
                    },
                    "type": "code",
                  },
                },
                "type": "pre",
              },
              {
                "$$typeof": Symbol(react.transitional.element),
                "_owner": null,
                "_store": {},
                "key": "73",
                "props": {
                  "children": null,
                  "name": "tables",
                },
                "type": "a",
              },
              {
                "$$typeof": Symbol(react.transitional.element),
                "_owner": null,
                "_store": {},
                "key": "74",
                "props": {
                  "children": "Tables",
                },
                "type": "h2",
              },
              {
                "$$typeof": Symbol(react.transitional.element),
                "_owner": null,
                "_store": {},
                "key": "75",
                "props": {
                  "children": [
                    "Tables aren't part of the core Markdown spec, but they are part of GFM and ",
                    {
                      "$$typeof": Symbol(react.transitional.element),
                      "_owner": null,
                      "_store": {},
                      "key": "1",
                      "props": {
                        "children": "Markdown Here",
                      },
                      "type": "em",
                    },
                    " supports them. They are an easy way of adding tables to your email -- a task that would otherwise require copy-pasting from another application.",
                  ],
                },
                "type": "p",
              },
              {
                "$$typeof": Symbol(react.transitional.element),
                "_owner": null,
                "_store": {},
                "key": "76",
                "props": {
                  "children": {
                    "$$typeof": Symbol(react.transitional.element),
                    "_owner": null,
                    "_store": {},
                    "key": null,
                    "props": {
                      "children": "Colons can be used to align columns.

      | Tables        | Are           | Cool  |
      | ------------- |:-------------:| -----:|
      | col 3 is      | right-aligned | $1600 |
      | col 2 is      | centered      |   $12 |
      | zebra stripes | are neat      |    $1 |

      There must be at least 3 dashes separating each header cell.
      The outer pipes (|) are optional, and you don't need to make the 
      raw Markdown line up prettily. You can also use inline Markdown.

      Markdown | Less | Pretty
      --- | --- | ---
      *Still* | \`renders\` | **nicely**
      1 | 2 | 3",
                    },
                    "type": "code",
                  },
                },
                "type": "pre",
              },
              {
                "$$typeof": Symbol(react.transitional.element),
                "_owner": null,
                "_store": {},
                "key": "77",
                "props": {
                  "children": "Colons can be used to align columns.",
                },
                "type": "p",
              },
              {
                "$$typeof": Symbol(react.transitional.element),
                "_owner": null,
                "_store": {},
                "key": "78",
                "props": {
                  "children": [
                    {
                      "$$typeof": Symbol(react.transitional.element),
                      "_owner": null,
                      "_store": {},
                      "key": null,
                      "props": {
                        "children": {
                          "$$typeof": Symbol(react.transitional.element),
                          "_owner": null,
                          "_store": {},
                          "key": ".$0",
                          "props": {
                            "children": [
                              {
                                "$$typeof": Symbol(react.transitional.element),
                                "_owner": null,
                                "_store": {},
                                "key": "0",
                                "props": {
                                  "children": "Tables",
                                  "className": "",
                                },
                                "type": "td",
                              },
                              {
                                "$$typeof": Symbol(react.transitional.element),
                                "_owner": null,
                                "_store": {},
                                "key": "1",
                                "props": {
                                  "children": "Are",
                                  "className": "",
                                },
                                "type": "td",
                              },
                              {
                                "$$typeof": Symbol(react.transitional.element),
                                "_owner": null,
                                "_store": {},
                                "key": "2",
                                "props": {
                                  "children": "Cool",
                                  "className": "",
                                },
                                "type": "td",
                              },
                            ],
                            "className": "",
                          },
                          "type": "tr",
                        },
                      },
                      "type": "thead",
                    },
                    {
                      "$$typeof": Symbol(react.transitional.element),
                      "_owner": null,
                      "_store": {},
                      "key": null,
                      "props": {
                        "children": [
                          {
                            "$$typeof": Symbol(react.transitional.element),
                            "_owner": null,
                            "_store": {},
                            "key": ".$1",
                            "props": {
                              "children": [
                                {
                                  "$$typeof": Symbol(react.transitional.element),
                                  "_owner": null,
                                  "_store": {},
                                  "key": "0",
                                  "props": {
                                    "children": "col 3 is",
                                    "className": "",
                                  },
                                  "type": "td",
                                },
                                {
                                  "$$typeof": Symbol(react.transitional.element),
                                  "_owner": null,
                                  "_store": {},
                                  "key": "1",
                                  "props": {
                                    "children": "right-aligned",
                                    "className": "",
                                  },
                                  "type": "td",
                                },
                                {
                                  "$$typeof": Symbol(react.transitional.element),
                                  "_owner": null,
                                  "_store": {},
                                  "key": "2",
                                  "props": {
                                    "children": "$1600",
                                    "className": "",
                                  },
                                  "type": "td",
                                },
                              ],
                              "className": "",
                            },
                            "type": "tr",
                          },
                          {
                            "$$typeof": Symbol(react.transitional.element),
                            "_owner": null,
                            "_store": {},
                            "key": ".$2",
                            "props": {
                              "children": [
                                {
                                  "$$typeof": Symbol(react.transitional.element),
                                  "_owner": null,
                                  "_store": {},
                                  "key": "0",
                                  "props": {
                                    "children": "col 2 is",
                                    "className": "",
                                  },
                                  "type": "td",
                                },
                                {
                                  "$$typeof": Symbol(react.transitional.element),
                                  "_owner": null,
                                  "_store": {},
                                  "key": "1",
                                  "props": {
                                    "children": "centered",
                                    "className": "",
                                  },
                                  "type": "td",
                                },
                                {
                                  "$$typeof": Symbol(react.transitional.element),
                                  "_owner": null,
                                  "_store": {},
                                  "key": "2",
                                  "props": {
                                    "children": "$12",
                                    "className": "",
                                  },
                                  "type": "td",
                                },
                              ],
                              "className": "",
                            },
                            "type": "tr",
                          },
                          {
                            "$$typeof": Symbol(react.transitional.element),
                            "_owner": null,
                            "_store": {},
                            "key": ".$3",
                            "props": {
                              "children": [
                                {
                                  "$$typeof": Symbol(react.transitional.element),
                                  "_owner": null,
                                  "_store": {},
                                  "key": "0",
                                  "props": {
                                    "children": "zebra stripes",
                                    "className": "",
                                  },
                                  "type": "td",
                                },
                                {
                                  "$$typeof": Symbol(react.transitional.element),
                                  "_owner": null,
                                  "_store": {},
                                  "key": "1",
                                  "props": {
                                    "children": "are neat",
                                    "className": "",
                                  },
                                  "type": "td",
                                },
                                {
                                  "$$typeof": Symbol(react.transitional.element),
                                  "_owner": null,
                                  "_store": {},
                                  "key": "2",
                                  "props": {
                                    "children": "$1",
                                    "className": "",
                                  },
                                  "type": "td",
                                },
                              ],
                              "className": "",
                            },
                            "type": "tr",
                          },
                        ],
                      },
                      "type": "tbody",
                    },
                  ],
                },
                "type": "table",
              },
              {
                "$$typeof": Symbol(react.transitional.element),
                "_owner": null,
                "_store": {},
                "key": "79",
                "props": {
                  "children": "There must be at least 3 dashes separating each header cell. The outer pipes (|) are optional, and you don't need to make the raw Markdown line up prettily. You can also use inline Markdown.",
                },
                "type": "p",
              },
              {
                "$$typeof": Symbol(react.transitional.element),
                "_owner": null,
                "_store": {},
                "key": "80",
                "props": {
                  "children": [
                    {
                      "$$typeof": Symbol(react.transitional.element),
                      "_owner": null,
                      "_store": {},
                      "key": null,
                      "props": {
                        "children": {
                          "$$typeof": Symbol(react.transitional.element),
                          "_owner": null,
                          "_store": {},
                          "key": ".$0",
                          "props": {
                            "children": [
                              {
                                "$$typeof": Symbol(react.transitional.element),
                                "_owner": null,
                                "_store": {},
                                "key": "0",
                                "props": {
                                  "children": "Markdown",
                                  "className": "",
                                },
                                "type": "td",
                              },
                              {
                                "$$typeof": Symbol(react.transitional.element),
                                "_owner": null,
                                "_store": {},
                                "key": "1",
                                "props": {
                                  "children": "Less",
                                  "className": "",
                                },
                                "type": "td",
                              },
                              {
                                "$$typeof": Symbol(react.transitional.element),
                                "_owner": null,
                                "_store": {},
                                "key": "2",
                                "props": {
                                  "children": "Pretty",
                                  "className": "",
                                },
                                "type": "td",
                              },
                            ],
                            "className": "",
                          },
                          "type": "tr",
                        },
                      },
                      "type": "thead",
                    },
                    {
                      "$$typeof": Symbol(react.transitional.element),
                      "_owner": null,
                      "_store": {},
                      "key": null,
                      "props": {
                        "children": [
                          {
                            "$$typeof": Symbol(react.transitional.element),
                            "_owner": null,
                            "_store": {},
                            "key": ".$1",
                            "props": {
                              "children": [
                                {
                                  "$$typeof": Symbol(react.transitional.element),
                                  "_owner": null,
                                  "_store": {},
                                  "key": "0",
                                  "props": {
                                    "children": {
                                      "$$typeof": Symbol(react.transitional.element),
                                      "_owner": null,
                                      "_store": {},
                                      "key": null,
                                      "props": {
                                        "children": "Still",
                                      },
                                      "type": "em",
                                    },
                                    "className": "",
                                  },
                                  "type": "td",
                                },
                                {
                                  "$$typeof": Symbol(react.transitional.element),
                                  "_owner": null,
                                  "_store": {},
                                  "key": "1",
                                  "props": {
                                    "children": {
                                      "$$typeof": Symbol(react.transitional.element),
                                      "_owner": null,
                                      "_store": {},
                                      "key": null,
                                      "props": {
                                        "children": "renders",
                                      },
                                      "type": "code",
                                    },
                                    "className": "",
                                  },
                                  "type": "td",
                                },
                                {
                                  "$$typeof": Symbol(react.transitional.element),
                                  "_owner": null,
                                  "_store": {},
                                  "key": "2",
                                  "props": {
                                    "children": {
                                      "$$typeof": Symbol(react.transitional.element),
                                      "_owner": null,
                                      "_store": {},
                                      "key": null,
                                      "props": {
                                        "children": "nicely",
                                      },
                                      "type": "strong",
                                    },
                                    "className": "",
                                  },
                                  "type": "td",
                                },
                              ],
                              "className": "",
                            },
                            "type": "tr",
                          },
                          {
                            "$$typeof": Symbol(react.transitional.element),
                            "_owner": null,
                            "_store": {},
                            "key": ".$2",
                            "props": {
                              "children": [
                                {
                                  "$$typeof": Symbol(react.transitional.element),
                                  "_owner": null,
                                  "_store": {},
                                  "key": "0",
                                  "props": {
                                    "children": "1",
                                    "className": "",
                                  },
                                  "type": "td",
                                },
                                {
                                  "$$typeof": Symbol(react.transitional.element),
                                  "_owner": null,
                                  "_store": {},
                                  "key": "1",
                                  "props": {
                                    "children": "2",
                                    "className": "",
                                  },
                                  "type": "td",
                                },
                                {
                                  "$$typeof": Symbol(react.transitional.element),
                                  "_owner": null,
                                  "_store": {},
                                  "key": "2",
                                  "props": {
                                    "children": "3",
                                    "className": "",
                                  },
                                  "type": "td",
                                },
                              ],
                              "className": "",
                            },
                            "type": "tr",
                          },
                        ],
                      },
                      "type": "tbody",
                    },
                  ],
                },
                "type": "table",
              },
              {
                "$$typeof": Symbol(react.transitional.element),
                "_owner": null,
                "_store": {},
                "key": "81",
                "props": {
                  "children": null,
                  "name": "blockquotes",
                },
                "type": "a",
              },
              {
                "$$typeof": Symbol(react.transitional.element),
                "_owner": null,
                "_store": {},
                "key": "82",
                "props": {
                  "children": "Blockquotes",
                },
                "type": "h2",
              },
              {
                "$$typeof": Symbol(react.transitional.element),
                "_owner": null,
                "_store": {},
                "key": "83",
                "props": {
                  "children": {
                    "$$typeof": Symbol(react.transitional.element),
                    "_owner": null,
                    "_store": {},
                    "key": null,
                    "props": {
                      "children": "> Blockquotes are very handy in email to emulate reply text.
      > This line is part of the same quote.

      Quote break.

      > This is a very long line that will still be quoted properly when it wraps. Oh boy let's keep writing to make sure this is long enough to actually wrap for everyone. Oh, you can *put* **Markdown** into a blockquote. ",
                    },
                    "type": "code",
                  },
                },
                "type": "pre",
              },
              {
                "$$typeof": Symbol(react.transitional.element),
                "_owner": null,
                "_store": {},
                "key": "84",
                "props": {
                  "children": {
                    "$$typeof": Symbol(react.transitional.element),
                    "_owner": null,
                    "_store": {},
                    "key": null,
                    "props": {
                      "children": "Blockquotes are very handy in email to emulate reply text.
      This line is part of the same quote.",
                    },
                    "type": "p",
                  },
                },
                "type": "blockquote",
              },
              {
                "$$typeof": Symbol(react.transitional.element),
                "_owner": null,
                "_store": {},
                "key": "85",
                "props": {
                  "children": "Quote break.",
                },
                "type": "p",
              },
              {
                "$$typeof": Symbol(react.transitional.element),
                "_owner": null,
                "_store": {},
                "key": "86",
                "props": {
                  "children": {
                    "$$typeof": Symbol(react.transitional.element),
                    "_owner": null,
                    "_store": {},
                    "key": null,
                    "props": {
                      "children": [
                        "This is a very long line that will still be quoted properly when it wraps. Oh boy let's keep writing to make sure this is long enough to actually wrap for everyone. Oh, you can ",
                        {
                          "$$typeof": Symbol(react.transitional.element),
                          "_owner": null,
                          "_store": {},
                          "key": "1",
                          "props": {
                            "children": "put",
                          },
                          "type": "em",
                        },
                        " ",
                        {
                          "$$typeof": Symbol(react.transitional.element),
                          "_owner": null,
                          "_store": {},
                          "key": "3",
                          "props": {
                            "children": "Markdown",
                          },
                          "type": "strong",
                        },
                        " into a blockquote.",
                      ],
                    },
                    "type": "p",
                  },
                },
                "type": "blockquote",
              },
              {
                "$$typeof": Symbol(react.transitional.element),
                "_owner": null,
                "_store": {},
                "key": "87",
                "props": {
                  "children": null,
                  "name": "html",
                },
                "type": "a",
              },
              {
                "$$typeof": Symbol(react.transitional.element),
                "_owner": null,
                "_store": {},
                "key": "88",
                "props": {
                  "children": "Inline HTML",
                },
                "type": "h2",
              },
              {
                "$$typeof": Symbol(react.transitional.element),
                "_owner": null,
                "_store": {},
                "key": "89",
                "props": {
                  "children": "You can also use raw HTML in your Markdown, and it'll mostly work pretty well.",
                },
                "type": "p",
              },
              {
                "$$typeof": Symbol(react.transitional.element),
                "_owner": null,
                "_store": {},
                "key": "90",
                "props": {
                  "children": {
                    "$$typeof": Symbol(react.transitional.element),
                    "_owner": null,
                    "_store": {},
                    "key": null,
                    "props": {
                      "children": "<dl>
        <dt>Definition list</dt>
        <dd>Is something people use sometimes.</dd>

        <dt>Markdown in HTML</dt>
        <dd>Does *not* work **very** well. Use HTML <em>tags</em>.</dd>
      </dl>",
                    },
                    "type": "code",
                  },
                },
                "type": "pre",
              },
              {
                "$$typeof": Symbol(react.transitional.element),
                "_owner": null,
                "_store": {},
                "key": "91",
                "props": {
                  "children": null,
                  "name": "hr",
                },
                "type": "a",
              },
              {
                "$$typeof": Symbol(react.transitional.element),
                "_owner": null,
                "_store": {},
                "key": "92",
                "props": {
                  "children": "Horizontal Rule",
                },
                "type": "h2",
              },
              {
                "$$typeof": Symbol(react.transitional.element),
                "_owner": null,
                "_store": {},
                "key": "93",
                "props": {
                  "children": {
                    "$$typeof": Symbol(react.transitional.element),
                    "_owner": null,
                    "_store": {},
                    "key": null,
                    "props": {
                      "children": "Three or more...

      ---

      Hyphens

      ***

      Asterisks

      ___

      Underscores",
                    },
                    "type": "code",
                  },
                },
                "type": "pre",
              },
              {
                "$$typeof": Symbol(react.transitional.element),
                "_owner": null,
                "_store": {},
                "key": "94",
                "props": {
                  "children": "Three or more...",
                },
                "type": "p",
              },
              {
                "$$typeof": Symbol(react.transitional.element),
                "_owner": null,
                "_store": {},
                "key": "95",
                "props": {},
                "type": "hr",
              },
              {
                "$$typeof": Symbol(react.transitional.element),
                "_owner": null,
                "_store": {},
                "key": "96",
                "props": {
                  "children": "Hyphens",
                },
                "type": "p",
              },
              {
                "$$typeof": Symbol(react.transitional.element),
                "_owner": null,
                "_store": {},
                "key": "97",
                "props": {},
                "type": "hr",
              },
              {
                "$$typeof": Symbol(react.transitional.element),
                "_owner": null,
                "_store": {},
                "key": "98",
                "props": {
                  "children": "Asterisks",
                },
                "type": "p",
              },
              {
                "$$typeof": Symbol(react.transitional.element),
                "_owner": null,
                "_store": {},
                "key": "99",
                "props": {},
                "type": "hr",
              },
              {
                "$$typeof": Symbol(react.transitional.element),
                "_owner": null,
                "_store": {},
                "key": "100",
                "props": {
                  "children": "Underscores",
                },
                "type": "p",
              },
              {
                "$$typeof": Symbol(react.transitional.element),
                "_owner": null,
                "_store": {},
                "key": "101",
                "props": {
                  "children": null,
                  "name": "lines",
                },
                "type": "a",
              },
              {
                "$$typeof": Symbol(react.transitional.element),
                "_owner": null,
                "_store": {},
                "key": "102",
                "props": {
                  "children": "Line Breaks",
                },
                "type": "h2",
              },
              {
                "$$typeof": Symbol(react.transitional.element),
                "_owner": null,
                "_store": {},
                "key": "103",
                "props": {
                  "children": "My basic recommendation for learning how line breaks work is to experiment and discover -- hit <Enter> once (i.e., insert one newline), then hit it twice (i.e., insert two newlines), see what happens. You'll soon learn to get what you want. "Markdown Toggle" is your friend.",
                },
                "type": "p",
              },
              {
                "$$typeof": Symbol(react.transitional.element),
                "_owner": null,
                "_store": {},
                "key": "104",
                "props": {
                  "children": "Here are some things to try out:",
                },
                "type": "p",
              },
              {
                "$$typeof": Symbol(react.transitional.element),
                "_owner": null,
                "_store": {},
                "key": "105",
                "props": {
                  "children": {
                    "$$typeof": Symbol(react.transitional.element),
                    "_owner": null,
                    "_store": {},
                    "key": null,
                    "props": {
                      "children": "Here's a line for us to start with.

      This line is separated from the one above by two newlines, so it will be a *separate paragraph*.

      This line is also a separate paragraph, but...
      This line is only separated by a single newline, so it's a separate line in the *same paragraph*.",
                    },
                    "type": "code",
                  },
                },
                "type": "pre",
              },
              {
                "$$typeof": Symbol(react.transitional.element),
                "_owner": null,
                "_store": {},
                "key": "106",
                "props": {
                  "children": "Here's a line for us to start with.",
                },
                "type": "p",
              },
              {
                "$$typeof": Symbol(react.transitional.element),
                "_owner": null,
                "_store": {},
                "key": "107",
                "props": {
                  "children": [
                    "This line is separated from the one above by two newlines, so it will be a ",
                    {
                      "$$typeof": Symbol(react.transitional.element),
                      "_owner": null,
                      "_store": {},
                      "key": "1",
                      "props": {
                        "children": "separate paragraph",
                      },
                      "type": "em",
                    },
                    ".",
                  ],
                },
                "type": "p",
              },
              {
                "$$typeof": Symbol(react.transitional.element),
                "_owner": null,
                "_store": {},
                "key": "108",
                "props": {
                  "children": [
                    "This line is also begins a separate paragraph, but...",
                    {
                      "$$typeof": Symbol(react.transitional.element),
                      "_owner": null,
                      "_store": {},
                      "key": "1",
                      "props": {},
                      "type": "br",
                    },
                    "This line is only separated by a single newline, so it's a separate line in the ",
                    {
                      "$$typeof": Symbol(react.transitional.element),
                      "_owner": null,
                      "_store": {},
                      "key": "3",
                      "props": {
                        "children": "same paragraph",
                      },
                      "type": "em",
                    },
                    ".",
                  ],
                },
                "type": "p",
              },
              {
                "$$typeof": Symbol(react.transitional.element),
                "_owner": null,
                "_store": {},
                "key": "109",
                "props": {
                  "children": [
                    "(Technical note: ",
                    {
                      "$$typeof": Symbol(react.transitional.element),
                      "_owner": null,
                      "_store": {},
                      "key": "1",
                      "props": {
                        "children": "Markdown Here",
                      },
                      "type": "em",
                    },
                    " uses GFM line breaks, so there's no need to use MD's two-space line breaks.)",
                  ],
                },
                "type": "p",
              },
              {
                "$$typeof": Symbol(react.transitional.element),
                "_owner": null,
                "_store": {},
                "key": "110",
                "props": {
                  "children": null,
                  "name": "videos",
                },
                "type": "a",
              },
              {
                "$$typeof": Symbol(react.transitional.element),
                "_owner": null,
                "_store": {},
                "key": "111",
                "props": {
                  "children": "YouTube Videos",
                },
                "type": "h2",
              },
              {
                "$$typeof": Symbol(react.transitional.element),
                "_owner": null,
                "_store": {},
                "key": "112",
                "props": {
                  "children": "They can't be added directly but you can add an image with a link to the video like this:",
                },
                "type": "p",
              },
              {
                "$$typeof": Symbol(react.transitional.element),
                "_owner": null,
                "_store": {},
                "key": "113",
                "props": {
                  "children": {
                    "$$typeof": Symbol(react.transitional.element),
                    "_owner": null,
                    "_store": {},
                    "key": null,
                    "props": {
                      "children": "<a href="http://www.youtube.com/watch?feature=player_embedded&v=YOUTUBE_VIDEO_ID_HERE
      " target="_blank"><img src="http://img.youtube.com/vi/YOUTUBE_VIDEO_ID_HERE/0.jpg" 
      alt="IMAGE ALT TEXT HERE" width="240" height="180" border="10" /></a>",
                    },
                    "type": "code",
                  },
                },
                "type": "pre",
              },
              {
                "$$typeof": Symbol(react.transitional.element),
                "_owner": null,
                "_store": {},
                "key": "114",
                "props": {
                  "children": "Or, in pure Markdown, but losing the image sizing and border:",
                },
                "type": "p",
              },
              {
                "$$typeof": Symbol(react.transitional.element),
                "_owner": null,
                "_store": {},
                "key": "115",
                "props": {
                  "children": {
                    "$$typeof": Symbol(react.transitional.element),
                    "_owner": null,
                    "_store": {},
                    "key": null,
                    "props": {
                      "children": "[![IMAGE ALT TEXT HERE](http://img.youtube.com/vi/YOUTUBE_VIDEO_ID_HERE/0.jpg)](http://www.youtube.com/watch?v=YOUTUBE_VIDEO_ID_HERE)",
                    },
                    "type": "code",
                  },
                },
                "type": "pre",
              },
            ],
          },
          "type": Symbol(react.fragment),
        },
      }
    `)
})


test('code block rendering', () => {
  const code = dedent`
`
  expect(render(dedent`
      \`\`\`typescript
      const x = 1;
      \`\`\`

      \`\`\`invalid-language
      const y = 2;
      \`\`\`
    `)).toMatchInlineSnapshot(`
      {
   "errors": [
     {
       "message": "Unsupported language invalid-language",
     },
   ],
   "html": "<pre><code class="language-typescript">const x = 1;</code></pre><pre><code>const y = 2;</code></pre>",
   "result": {
     "$$typeof": Symbol(react.transitional.element),
     "_owner": null,
     "_store": {},
     "key": null,
     "props": {
       "children": [
         {
           "$$typeof": Symbol(react.transitional.element),
           "_owner": null,
           "_store": {},
           "key": "0",
           "props": {
             "children": {
               "$$typeof": Symbol(react.transitional.element),
               "_owner": null,
               "_store": {},
               "key": null,
               "props": {
                 "children": "const x = 1;",
                 "className": "language-typescript",
               },
               "type": "code",
             },
           },
           "type": "pre",
         },
         {
           "$$typeof": Symbol(react.transitional.element),
           "_owner": null,
           "_store": {},
           "key": "1",
           "props": {
             "children": {
               "$$typeof": Symbol(react.transitional.element),
               "_owner": null,
               "_store": {},
               "key": null,
               "props": {
                 "children": "const y = 2;",
                 "className": undefined,
               },
               "type": "code",
             },
           },
           "type": "pre",
         },
       ],
     },
     "type": Symbol(react.fragment),
   },
 } 
  `)
})
