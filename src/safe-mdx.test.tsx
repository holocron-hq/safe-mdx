import dedent from 'dedent'
import { htmlToJsx } from 'html-to-jsx-transform'
import React from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { expect, test } from 'vitest'
import { z } from 'zod'
import { mdxParse } from './parse.js'
import { MdastToJsx, mdastBfs, type ComponentPropsSchema } from './safe-mdx.js'
import { completeJsxTags } from './streaming.js'

const components = {
    Heading({ level, children }) {
        return <h1>{children}</h1>
    },
    Cards({ level, children }) {
        return <div>{children}</div>
    },
}

function render(code, componentPropsSchema?: ComponentPropsSchema) {
    const mdast = mdxParse(code)
    const visitor = new MdastToJsx({ markdown: code, mdast, components, componentPropsSchema })
    const result = visitor.run()
    const html = renderToStaticMarkup(result)
    // console.log(JSON.stringify(result, null, 2))
    return { result, errors: visitor.errors || [], html }
}

test('htmlToJsx', () => {
    expect(htmlToJsx('<p x="y">')).toMatchInlineSnapshot(`"<p x="y" />"`)
    expect(htmlToJsx('<p>text</p>')).toMatchInlineSnapshot(`"<p>text</p>"`)
    expect(htmlToJsx('before <p>text</p>')).toMatchInlineSnapshot(
        `"<>before <p>text</p></>"`,
    )
    expect(htmlToJsx('<nonexisting>text</nonexisting>')).toMatchInlineSnapshot(
        `"<nonexisting>text</nonexisting>"`,
    )
})

test('markdown inside jsx', () => {
    const code = dedent`
    # Hello

    <Heading prop="value">
    Component *children*
    </Heading>

    <figure>
    some *bold* content
    </figure>

    `

    expect(render(code)).toMatchInlineSnapshot(`
      {
        "errors": [],
        "html": "<h1>Hello</h1><h1><p>Component <em>children</em></p></h1><figure><p>some <em>bold</em> content</p></figure>",
        "result": <React.Fragment>
          <h1>
            Hello
          </h1>
          <Heading
            prop="value"
          >
            <p>
              Component 
              <em>
                children
              </em>
            </p>
          </Heading>
          <figure>
            <p>
              some 
              <em>
                bold
              </em>
               content
            </p>
          </figure>
        </React.Fragment>,
      }
    `)
})

test('can complete jsx code with completeJsxTags', () => {
    const code = dedent`
    # Hello

    <Cards>
    <Heading prop="value">
    some value

    Component *children*



    `

    expect(render(completeJsxTags(code))).toMatchInlineSnapshot(`
      {
        "errors": [],
        "html": "<h1>Hello</h1><div><h1></h1></div>",
        "result": <React.Fragment>
          <h1>
            Hello
          </h1>
          <Cards>
            <Heading
              prop="value"
            />
          </Cards>
        </React.Fragment>,
      }
    `)
})

test('remark and jsx does not wrap in p', () => {
    const code = dedent`
    ---
    title: createSearchParams
    ---

    # Hello

    i am a paragraph

    <Heading>heading</Heading>

    sone \`inline code\`

    \`\`\`tsx
    some code
    \`\`\`

    what
    `
    const mdast = mdxParse(code)

    mdastBfs(mdast, (x) => {
        delete x.position
    })
    expect(mdast).toMatchInlineSnapshot(`
      {
        "children": [
          {
            "type": "yaml",
            "value": "title: createSearchParams",
          },
          {
            "children": [
              {
                "type": "text",
                "value": "Hello",
              },
            ],
            "depth": 1,
            "type": "heading",
          },
          {
            "children": [
              {
                "type": "text",
                "value": "i am a paragraph",
              },
            ],
            "type": "paragraph",
          },
          {
            "attributes": [],
            "children": [
              {
                "type": "text",
                "value": "heading",
              },
            ],
            "name": "Heading",
            "type": "mdxJsxFlowElement",
          },
          {
            "children": [
              {
                "type": "text",
                "value": "sone ",
              },
              {
                "type": "inlineCode",
                "value": "inline code",
              },
            ],
            "type": "paragraph",
          },
          {
            "lang": "tsx",
            "meta": null,
            "type": "code",
            "value": "some code",
          },
          {
            "children": [
              {
                "type": "text",
                "value": "what",
              },
            ],
            "type": "paragraph",
          },
        ],
        "type": "root",
      }
    `)
})

test('basic', () => {
    expect(
        render(dedent`
        # Hello

        i am a paragraph

        <Heading>heading</Heading>
        `),
    ).toMatchInlineSnapshot(`
      {
        "errors": [],
        "html": "<h1>Hello</h1><p>i am a paragraph</p><h1>heading</h1>",
        "result": <React.Fragment>
          <h1>
            Hello
          </h1>
          <p>
            i am a paragraph
          </p>
          <Heading>
            heading
          </Heading>
        </React.Fragment>,
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
        "result": <React.Fragment>
          <h1>
            Hello
          </h1>
          <p>
            i am a paragraph
          </p>
        </React.Fragment>,
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
        "result": <React.Fragment>
          <h1>
            Hello
          </h1>
          <table>
            <thead>
              <tr
                className=""
              >
                <td
                  className=""
                >
                  Tables
                </td>
                <td
                  className=""
                >
                  Are
                </td>
                <td
                  className=""
                >
                  Cool
                </td>
              </tr>
            </thead>
            <tbody>
              <tr
                className=""
              >
                <td
                  className=""
                >
                  col 3 is
                </td>
                <td
                  className=""
                >
                  right-aligned
                </td>
                <td
                  className=""
                >
                  $1600
                </td>
              </tr>
              <tr
                className=""
              >
                <td
                  className=""
                >
                  col 2 is
                </td>
                <td
                  className=""
                >
                  centered
                </td>
                <td
                  className=""
                >
                  $12
                </td>
              </tr>
            </tbody>
          </table>
        </React.Fragment>,
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
        "result": <React.Fragment>
          <h1>
            Hello
          </h1>
          <table>
            <thead>
              <tr
                className=""
              >
                <td
                  className=""
                >
                  Tables
                </td>
                <td
                  className=""
                >
                  Are
                </td>
                <td
                  className=""
                >
                  Cool
                </td>
              </tr>
            </thead>
          </table>
        </React.Fragment>,
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
        "html": "<h1>hello</h1>",
        "result": <React.Fragment>
          <Heading
            level={2}
          >
            hello
          </Heading>
        </React.Fragment>,
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
        "result": <React.Fragment>
          <Heading
            level={2}
          >
            <blockquote>
              <p>
                hello
              </p>
            </blockquote>
          </Heading>
        </React.Fragment>,
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
        "result": <React.Fragment>
          <h1>
            hello 
            <br />
          </h1>
          <br />
          <p>
            content
          </p>
        </React.Fragment>,
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
            "line": 1,
            "message": "Unsupported jsx component MissingComponent",
          },
        ],
        "html": "",
        "result": <React.Fragment />,
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
            "line": 7,
            "message": "Expressions in jsx props are not supported (expression1={1 + 3})",
          },
          {
            "line": 8,
            "message": "Expressions in jsx props are not supported (expression2={Boolean(1)})",
          },
          {
            "line": 9,
            "message": "Expressions in jsx props are not supported (jsx={<SomeComponent />})",
          },
          {
            "line": 13,
            "message": "Expressions in jsx props are not supported (...{ spread: true })",
          },
        ],
        "html": "<h1><p>hi</p></h1>",
        "result": <React.Fragment>
          <Heading
            backTick="some \${expr} value"
            boolean={false}
            doublequote="a " string"
            null={null}
            num={2}
            quote="a " string"
            someJson={
              {
                "a": 1,
              }
            }
          >
            <p>
              hi
            </p>
          </Heading>
        </React.Fragment>,
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
        "html": "<p>To have a line break without a paragraph, you will need to use two trailing spaces.
      Note that this line is separate, but within the same paragraph.
      (This is contrary to the typical GFM line break behaviour, where trailing spaces are not required.)</p>",
        "result": <React.Fragment>
          <p>
            To have a line break without a paragraph, you will need to use two trailing spaces.
      Note that this line is separate, but within the same paragraph.
      (This is contrary to the typical GFM line break behaviour, where trailing spaces are not required.)
          </p>
        </React.Fragment>,
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
        "errors": [],
        "html": "<link rel="preload" as="image" href="https://github.com/adam-p/markdown-here/raw/master/src/common/images/icon48.png"/><h1>Markdown Kitchen Sink</h1><p>This file is <a href="https://github.com/adam-p/markdown-here/wiki/Markdown-Cheatsheet" title="">https://github.com/adam-p/markdown-here/wiki/Markdown-Cheatsheet</a> plus a few fixes and additions. Used by <a href="https://github.com/obedm503/bootmark" title="">obedm503/bootmark</a> to <a href="https://obedm503.github.io/bootmark/docs/markdown-cheatsheet.html" title="">demonstrate</a> it&#x27;s styling features.</p><p>This is intended as a quick reference and showcase. For more complete info, see <a href="http://daringfireball.net/projects/markdown/" title="">John Gruber&#x27;s original spec</a> and the <a href="http://github.github.com/github-flavored-markdown/" title="">Github-flavored Markdown info page</a>.</p><p>Note that there is also a <a href="./Markdown-Here-Cheatsheet" title="">Cheatsheet specific to Markdown Here</a> if that&#x27;s what you&#x27;re looking for. You can also check out <a href="./Other-Markdown-Tools" title="">more Markdown tools</a>.</p><h5>Table of Contents</h5><p><a href="#headers" title="">Headers</a>
      <a href="#emphasis" title="">Emphasis</a>
      <a href="#lists" title="">Lists</a>
      <a href="#links" title="">Links</a>
      <a href="#images" title="">Images</a>
      <a href="#code" title="">Code and Syntax Highlighting</a>
      <a href="#tables" title="">Tables</a>
      <a href="#blockquotes" title="">Blockquotes</a>
      <a href="#html" title="">Inline HTML</a>
      <a href="#hr" title="">Horizontal Rule</a>
      <a href="#lines" title="">Line Breaks</a>
      <a href="#videos" title="">YouTube Videos</a></p><a name="headers"></a><h2>Headers</h2><h1>H1</h1><h2>H2</h2><h3>H3</h3><h4>H4</h4><h5>H5</h5><h6>H6</h6><p>Alternatively, for H1 and H2, an underline-ish style:</p><h1>Alt-H1</h1><h2>Alt-H2</h2><h1>H1</h1><h2>H2</h2><h3>H3</h3><h4>H4</h4><h5>H5</h5><h6>H6</h6><p>Alternatively, for H1 and H2, an underline-ish style:</p><h1>Alt-H1</h1><h2>Alt-H2</h2><a name="emphasis"></a><h2>Emphasis</h2><pre><code class="language-no-highlight">Emphasis, aka italics, with *asterisks* or _underscores_.

      Strong emphasis, aka bold, with **asterisks** or __underscores__.

      Combined emphasis with **asterisks and _underscores_**.

      Strikethrough uses two tildes. ~~Scratch this.~~</code></pre><p>Emphasis, aka italics, with <em>asterisks</em> or <em>underscores</em>.</p><p>Strong emphasis, aka bold, with <strong>asterisks</strong> or <strong>underscores</strong>.</p><p>Combined emphasis with <strong>asterisks and <em>underscores</em></strong>.</p><p>Strikethrough uses two tildes. <del>Scratch this.</del></p><a name="lists"></a><h2>Lists</h2><p>(In this example, leading and trailing spaces are shown with with dots: ⋅)</p><pre><code class="language-no-highlight">1. First ordered list item
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
      + Or pluses</code></pre><ol start="1"><li><p>First ordered list item</p></li><li><p>Another item</p></li></ol><ul><li><p>Unordered sub-list.</p></li></ul><ol start="1"><li><p>Actual numbers don&#x27;t matter, just that it&#x27;s a number</p></li><li><p>Ordered sub-list</p></li><li><p>And another item.</p><p>You can have properly indented paragraphs within list items. Notice the blank line above, and the leading spaces (at least one, but we&#x27;ll use three here to also align the raw Markdown).</p><p>To have a line break without a paragraph, you will need to use two trailing spaces.
      Note that this line is separate, but within the same paragraph.
      (This is contrary to the typical GFM line break behaviour, where trailing spaces are not required.)</p></li></ol><ul><li><p>Unordered list can use asterisks</p></li></ul><ul><li><p>Or minuses</p></li></ul><ul><li><p>Or pluses</p></li></ul><a name="links"></a><h2>Links</h2><p>There are two ways to create links.</p><pre><code class="language-no-highlight">[I&#x27;m an inline-style link](https://www.google.com)

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
      example.com (but not on Github, for example).</p><p>Some text to show that the reference links can follow later.</p><a name="images"></a><h2>Images</h2><pre><code class="language-no-highlight">Here&#x27;s our logo (hover to see the title text):

      Inline-style:
      ![alt text](https://github.com/adam-p/markdown-here/raw/master/src/common/images/icon48.png &quot;Logo Title Text 1&quot;)

      Reference-style:
      ![alt text][logo]

      [logo]: https://github.com/adam-p/markdown-here/raw/master/src/common/images/icon48.png &quot;Logo Title Text 2&quot;</code></pre><p>Here&#x27;s our logo (hover to see the title text):</p><p>Inline-style:
      <img src="https://github.com/adam-p/markdown-here/raw/master/src/common/images/icon48.png" alt="alt text" title="Logo Title Text 1"/></p><p>Reference-style:
      </p><a name="code"></a><h2>Code and Syntax Highlighting</h2><p>Code blocks are part of the Markdown spec, but syntax highlighting isn&#x27;t. However, many renderers -- like Github&#x27;s and <em>Markdown Here</em> -- support syntax highlighting. Which languages are supported and how those language names should be written will vary from renderer to renderer. <em>Markdown Here</em> supports highlighting for dozens of languages (and not-really-languages, like diffs and HTTP headers); to see the complete list, and how to write the language names, see the <a href="http://softwaremaniacs.org/media/soft/highlight/test.html" title="">highlight.js demo page</a>.</p><pre><code class="language-no-highlight">Inline \`code\` has \`back-ticks around\` it.</code></pre><p>Inline <code>code</code> has <code>back-ticks around</code> it.</p><p>Blocks of code are either fenced by lines with three back-ticks <code>\`\`\`</code>, or are indented with four spaces. I recommend only using the fenced code blocks -- they&#x27;re easier and only they support syntax highlighting.</p><pre><code class="language-javascript">var s = &quot;JavaScript syntax highlighting&quot;;
      alert(s);</code></pre><pre><code class="language-python">s = &quot;Python syntax highlighting&quot;
      print s</code></pre><pre><code>No language indicated, so no syntax highlighting.
      But let&#x27;s throw in a &amp;lt;b&amp;gt;tag&amp;lt;/b&amp;gt;.</code></pre><pre><code class="language-javascript">var s = &quot;JavaScript syntax highlighting&quot;;
      alert(s);</code></pre><pre><code class="language-python">s = &quot;Python syntax highlighting&quot;
      print s</code></pre><pre><code>No language indicated, so no syntax highlighting in Markdown Here (varies on Github).
      But let&#x27;s throw in a &lt;b&gt;tag&lt;/b&gt;.</code></pre><a name="tables"></a><h2>Tables</h2><p>Tables aren&#x27;t part of the core Markdown spec, but they are part of GFM and <em>Markdown Here</em> supports them. They are an easy way of adding tables to your email -- a task that would otherwise require copy-pasting from another application.</p><pre><code class="language-no-highlight">Colons can be used to align columns.

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
      1 | 2 | 3</code></pre><p>Colons can be used to align columns.</p><table><thead><tr class=""><td class="">Tables</td><td class="">Are</td><td class="">Cool</td></tr></thead><tbody><tr class=""><td class="">col 3 is</td><td class="">right-aligned</td><td class="">$1600</td></tr><tr class=""><td class="">col 2 is</td><td class="">centered</td><td class="">$12</td></tr><tr class=""><td class="">zebra stripes</td><td class="">are neat</td><td class="">$1</td></tr></tbody></table><p>There must be at least 3 dashes separating each header cell. The outer pipes (|) are optional, and you don&#x27;t need to make the raw Markdown line up prettily. You can also use inline Markdown.</p><table><thead><tr class=""><td class="">Markdown</td><td class="">Less</td><td class="">Pretty</td></tr></thead><tbody><tr class=""><td class=""><em>Still</em></td><td class=""><code>renders</code></td><td class=""><strong>nicely</strong></td></tr><tr class=""><td class="">1</td><td class="">2</td><td class="">3</td></tr></tbody></table><a name="blockquotes"></a><h2>Blockquotes</h2><pre><code class="language-no-highlight">&gt; Blockquotes are very handy in email to emulate reply text.
      &gt; This line is part of the same quote.

      Quote break.

      &gt; This is a very long line that will still be quoted properly when it wraps. Oh boy let&#x27;s keep writing to make sure this is long enough to actually wrap for everyone. Oh, you can *put* **Markdown** into a blockquote.</code></pre><blockquote><p>Blockquotes are very handy in email to emulate reply text.
      This line is part of the same quote.</p></blockquote><p>Quote break.</p><blockquote><p>This is a very long line that will still be quoted properly when it wraps. Oh boy let&#x27;s keep writing to make sure this is long enough to actually wrap for everyone. Oh, you can <em>put</em> <strong>Markdown</strong> into a blockquote.</p></blockquote><a name="html"></a><h2>Inline HTML</h2><p>You can also use raw HTML in your Markdown, and it&#x27;ll mostly work pretty well.</p><pre><code class="language-no-highlight">&lt;dl&gt;
        &lt;dt&gt;Definition list&lt;/dt&gt;
        &lt;dd&gt;Is something people use sometimes.&lt;/dd&gt;

        &lt;dt&gt;Markdown in HTML&lt;/dt&gt;
        &lt;dd&gt;Does *not* work **very** well. Use HTML &lt;em&gt;tags&lt;/em&gt;.&lt;/dd&gt;
      &lt;/dl&gt;</code></pre><dl><dt>Definition list</dt><dd>Is something people use sometimes.</dd><dt>Markdown in HTML</dt><dd>Does <em>not</em> work <strong>very</strong> well. Use HTML <em>tags</em>.</dd></dl><a name="hr"></a><h2>Horizontal Rule</h2><pre><code>Three or more...

      ---

      Hyphens

      ***

      Asterisks

      ___

      Underscores</code></pre><p>Three or more...</p><hr/><p>Hyphens</p><hr/><p>Asterisks</p><hr/><p>Underscores</p><a name="lines"></a><h2>Line Breaks</h2><p>My basic recommendation for learning how line breaks work is to experiment and discover -- hit &lt;Enter&gt; once (i.e., insert one newline), then hit it twice (i.e., insert two newlines), see what happens. You&#x27;ll soon learn to get what you want. &quot;Markdown Toggle&quot; is your friend.</p><p>Here are some things to try out:</p><pre><code>Here&#x27;s a line for us to start with.

      This line is separated from the one above by two newlines, so it will be a *separate paragraph*.

      This line is also a separate paragraph, but...
      This line is only separated by a single newline, so it&#x27;s a separate line in the *same paragraph*.</code></pre><p>Here&#x27;s a line for us to start with.</p><p>This line is separated from the one above by two newlines, so it will be a <em>separate paragraph</em>.</p><p>This line is also begins a separate paragraph, but...
      This line is only separated by a single newline, so it&#x27;s a separate line in the <em>same paragraph</em>.</p><p>(Technical note: <em>Markdown Here</em> uses GFM line breaks, so there&#x27;s no need to use MD&#x27;s two-space line breaks.)</p><a name="videos"></a><h2>YouTube Videos</h2><p>They can&#x27;t be added directly but you can add an image with a link to the video like this:</p><pre><code class="language-no-highlight">&lt;a href=&quot;http://www.youtube.com/watch?feature=player_embedded&amp;v=YOUTUBE_VIDEO_ID_HERE
      &quot; target=&quot;_blank&quot;&gt;&lt;img src=&quot;http://img.youtube.com/vi/YOUTUBE_VIDEO_ID_HERE/0.jpg&quot;
      alt=&quot;IMAGE ALT TEXT HERE&quot; width=&quot;240&quot; height=&quot;180&quot; border=&quot;10&quot; /&gt;&lt;/a&gt;</code></pre><p>Or, in pure Markdown, but losing the image sizing and border:</p><pre><code class="language-no-highlight">[![IMAGE ALT TEXT HERE](http://img.youtube.com/vi/YOUTUBE_VIDEO_ID_HERE/0.jpg)](http://www.youtube.com/watch?v=YOUTUBE_VIDEO_ID_HERE)</code></pre>",
        "result": <React.Fragment>
          <h1>
            Markdown Kitchen Sink
          </h1>
          <p>
            This file is 
            <a
              href="https://github.com/adam-p/markdown-here/wiki/Markdown-Cheatsheet"
              title=""
            >
              https://github.com/adam-p/markdown-here/wiki/Markdown-Cheatsheet
            </a>
             plus a few fixes and additions. Used by 
            <a
              href="https://github.com/obedm503/bootmark"
              title=""
            >
              obedm503/bootmark
            </a>
             to 
            <a
              href="https://obedm503.github.io/bootmark/docs/markdown-cheatsheet.html"
              title=""
            >
              demonstrate
            </a>
             it's styling features.
          </p>
          <p>
            This is intended as a quick reference and showcase. For more complete info, see 
            <a
              href="http://daringfireball.net/projects/markdown/"
              title=""
            >
              John Gruber's original spec
            </a>
             and the 
            <a
              href="http://github.github.com/github-flavored-markdown/"
              title=""
            >
              Github-flavored Markdown info page
            </a>
            .
          </p>
          <p>
            Note that there is also a 
            <a
              href="./Markdown-Here-Cheatsheet"
              title=""
            >
              Cheatsheet specific to Markdown Here
            </a>
             if that's what you're looking for. You can also check out 
            <a
              href="./Other-Markdown-Tools"
              title=""
            >
              more Markdown tools
            </a>
            .
          </p>
          <h5>
            Table of Contents
          </h5>
          <p>
            <a
              href="#headers"
              title=""
            >
              Headers
            </a>
            

            <a
              href="#emphasis"
              title=""
            >
              Emphasis
            </a>
            

            <a
              href="#lists"
              title=""
            >
              Lists
            </a>
            

            <a
              href="#links"
              title=""
            >
              Links
            </a>
            

            <a
              href="#images"
              title=""
            >
              Images
            </a>
            

            <a
              href="#code"
              title=""
            >
              Code and Syntax Highlighting
            </a>
            

            <a
              href="#tables"
              title=""
            >
              Tables
            </a>
            

            <a
              href="#blockquotes"
              title=""
            >
              Blockquotes
            </a>
            

            <a
              href="#html"
              title=""
            >
              Inline HTML
            </a>
            

            <a
              href="#hr"
              title=""
            >
              Horizontal Rule
            </a>
            

            <a
              href="#lines"
              title=""
            >
              Line Breaks
            </a>
            

            <a
              href="#videos"
              title=""
            >
              YouTube Videos
            </a>
          </p>
          <a
            name="headers"
          />
          <h2>
            Headers
          </h2>
          <h1>
            H1
          </h1>
          <h2>
            H2
          </h2>
          <h3>
            H3
          </h3>
          <h4>
            H4
          </h4>
          <h5>
            H5
          </h5>
          <h6>
            H6
          </h6>
          <p>
            Alternatively, for H1 and H2, an underline-ish style:
          </p>
          <h1>
            Alt-H1
          </h1>
          <h2>
            Alt-H2
          </h2>
          <h1>
            H1
          </h1>
          <h2>
            H2
          </h2>
          <h3>
            H3
          </h3>
          <h4>
            H4
          </h4>
          <h5>
            H5
          </h5>
          <h6>
            H6
          </h6>
          <p>
            Alternatively, for H1 and H2, an underline-ish style:
          </p>
          <h1>
            Alt-H1
          </h1>
          <h2>
            Alt-H2
          </h2>
          <a
            name="emphasis"
          />
          <h2>
            Emphasis
          </h2>
          <pre>
            <code
              className="language-no-highlight"
            >
              Emphasis, aka italics, with *asterisks* or _underscores_.

      Strong emphasis, aka bold, with **asterisks** or __underscores__.

      Combined emphasis with **asterisks and _underscores_**.

      Strikethrough uses two tildes. ~~Scratch this.~~
            </code>
          </pre>
          <p>
            Emphasis, aka italics, with 
            <em>
              asterisks
            </em>
             or 
            <em>
              underscores
            </em>
            .
          </p>
          <p>
            Strong emphasis, aka bold, with 
            <strong>
              asterisks
            </strong>
             or 
            <strong>
              underscores
            </strong>
            .
          </p>
          <p>
            Combined emphasis with 
            <strong>
              asterisks and 
              <em>
                underscores
              </em>
            </strong>
            .
          </p>
          <p>
            Strikethrough uses two tildes. 
            <del>
              Scratch this.
            </del>
          </p>
          <a
            name="lists"
          />
          <h2>
            Lists
          </h2>
          <p>
            (In this example, leading and trailing spaces are shown with with dots: ⋅)
          </p>
          <pre>
            <code
              className="language-no-highlight"
            >
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
            </code>
          </pre>
          <ol
            start={1}
          >
            <li>
              <p>
                First ordered list item
              </p>
            </li>
            <li>
              <p>
                Another item
              </p>
            </li>
          </ol>
          <ul>
            <li>
              <p>
                Unordered sub-list.
              </p>
            </li>
          </ul>
          <ol
            start={1}
          >
            <li>
              <p>
                Actual numbers don't matter, just that it's a number
              </p>
            </li>
            <li>
              <p>
                Ordered sub-list
              </p>
            </li>
            <li>
              <p>
                And another item.
              </p>
              <p>
                You can have properly indented paragraphs within list items. Notice the blank line above, and the leading spaces (at least one, but we'll use three here to also align the raw Markdown).
              </p>
              <p>
                To have a line break without a paragraph, you will need to use two trailing spaces.
      Note that this line is separate, but within the same paragraph.
      (This is contrary to the typical GFM line break behaviour, where trailing spaces are not required.)
              </p>
            </li>
          </ol>
          <ul>
            <li>
              <p>
                Unordered list can use asterisks
              </p>
            </li>
          </ul>
          <ul>
            <li>
              <p>
                Or minuses
              </p>
            </li>
          </ul>
          <ul>
            <li>
              <p>
                Or pluses
              </p>
            </li>
          </ul>
          <a
            name="links"
          />
          <h2>
            Links
          </h2>
          <p>
            There are two ways to create links.
          </p>
          <pre>
            <code
              className="language-no-highlight"
            >
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
            </code>
          </pre>
          <p>
            <a
              href="https://www.google.com"
              title=""
            >
              I'm an inline-style link
            </a>
          </p>
          <p>
            <a
              href="https://www.google.com"
              title="Google's Homepage"
            >
              I'm an inline-style link with title
            </a>
          </p>
          <p>
            <a
              href="https://www.mozilla.org"
            >
              I'm a reference-style link
            </a>
          </p>
          <p>
            <a
              href="../blob/master/LICENSE"
              title=""
            >
              I'm a relative reference to a repository file
            </a>
          </p>
          <p>
            <a
              href="http://slashdot.org"
            >
              You can use numbers for reference-style link definitions
            </a>
          </p>
          <p>
            Or leave it empty and use the 
            <a
              href="http://www.reddit.com"
            >
              link text itself
            </a>
            .
          </p>
          <p>
            URLs and URLs in angle brackets will automatically get turned into links.

            <a
              href="http://www.example.com"
              title=""
            >
              http://www.example.com
            </a>
             and sometimes
      example.com (but not on Github, for example).
          </p>
          <p>
            Some text to show that the reference links can follow later.
          </p>
          <a
            name="images"
          />
          <h2>
            Images
          </h2>
          <pre>
            <code
              className="language-no-highlight"
            >
              Here's our logo (hover to see the title text):

      Inline-style:
      ![alt text](https://github.com/adam-p/markdown-here/raw/master/src/common/images/icon48.png "Logo Title Text 1")

      Reference-style:
      ![alt text][logo]

      [logo]: https://github.com/adam-p/markdown-here/raw/master/src/common/images/icon48.png "Logo Title Text 2"
            </code>
          </pre>
          <p>
            Here's our logo (hover to see the title text):
          </p>
          <p>
            Inline-style:

            <img
              alt="alt text"
              src="https://github.com/adam-p/markdown-here/raw/master/src/common/images/icon48.png"
              title="Logo Title Text 1"
            />
          </p>
          <p>
            Reference-style:

          </p>
          <a
            name="code"
          />
          <h2>
            Code and Syntax Highlighting
          </h2>
          <p>
            Code blocks are part of the Markdown spec, but syntax highlighting isn't. However, many renderers -- like Github's and 
            <em>
              Markdown Here
            </em>
             -- support syntax highlighting. Which languages are supported and how those language names should be written will vary from renderer to renderer. 
            <em>
              Markdown Here
            </em>
             supports highlighting for dozens of languages (and not-really-languages, like diffs and HTTP headers); to see the complete list, and how to write the language names, see the 
            <a
              href="http://softwaremaniacs.org/media/soft/highlight/test.html"
              title=""
            >
              highlight.js demo page
            </a>
            .
          </p>
          <pre>
            <code
              className="language-no-highlight"
            >
              Inline \`code\` has \`back-ticks around\` it.
            </code>
          </pre>
          <p>
            Inline 
            <code>
              code
            </code>
             has 
            <code>
              back-ticks around
            </code>
             it.
          </p>
          <p>
            Blocks of code are either fenced by lines with three back-ticks 
            <code>
              \`\`\`
            </code>
            , or are indented with four spaces. I recommend only using the fenced code blocks -- they're easier and only they support syntax highlighting.
          </p>
          <pre>
            <code
              className="language-javascript"
            >
              var s = "JavaScript syntax highlighting";
      alert(s);
            </code>
          </pre>
          <pre>
            <code
              className="language-python"
            >
              s = "Python syntax highlighting"
      print s
            </code>
          </pre>
          <pre>
            <code>
              No language indicated, so no syntax highlighting.
      But let's throw in a &lt;b&gt;tag&lt;/b&gt;.
            </code>
          </pre>
          <pre>
            <code
              className="language-javascript"
            >
              var s = "JavaScript syntax highlighting";
      alert(s);
            </code>
          </pre>
          <pre>
            <code
              className="language-python"
            >
              s = "Python syntax highlighting"
      print s
            </code>
          </pre>
          <pre>
            <code>
              No language indicated, so no syntax highlighting in Markdown Here (varies on Github).
      But let's throw in a &lt;b&gt;tag&lt;/b&gt;.
            </code>
          </pre>
          <a
            name="tables"
          />
          <h2>
            Tables
          </h2>
          <p>
            Tables aren't part of the core Markdown spec, but they are part of GFM and 
            <em>
              Markdown Here
            </em>
             supports them. They are an easy way of adding tables to your email -- a task that would otherwise require copy-pasting from another application.
          </p>
          <pre>
            <code
              className="language-no-highlight"
            >
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
            </code>
          </pre>
          <p>
            Colons can be used to align columns.
          </p>
          <table>
            <thead>
              <tr
                className=""
              >
                <td
                  className=""
                >
                  Tables
                </td>
                <td
                  className=""
                >
                  Are
                </td>
                <td
                  className=""
                >
                  Cool
                </td>
              </tr>
            </thead>
            <tbody>
              <tr
                className=""
              >
                <td
                  className=""
                >
                  col 3 is
                </td>
                <td
                  className=""
                >
                  right-aligned
                </td>
                <td
                  className=""
                >
                  $1600
                </td>
              </tr>
              <tr
                className=""
              >
                <td
                  className=""
                >
                  col 2 is
                </td>
                <td
                  className=""
                >
                  centered
                </td>
                <td
                  className=""
                >
                  $12
                </td>
              </tr>
              <tr
                className=""
              >
                <td
                  className=""
                >
                  zebra stripes
                </td>
                <td
                  className=""
                >
                  are neat
                </td>
                <td
                  className=""
                >
                  $1
                </td>
              </tr>
            </tbody>
          </table>
          <p>
            There must be at least 3 dashes separating each header cell. The outer pipes (|) are optional, and you don't need to make the raw Markdown line up prettily. You can also use inline Markdown.
          </p>
          <table>
            <thead>
              <tr
                className=""
              >
                <td
                  className=""
                >
                  Markdown
                </td>
                <td
                  className=""
                >
                  Less
                </td>
                <td
                  className=""
                >
                  Pretty
                </td>
              </tr>
            </thead>
            <tbody>
              <tr
                className=""
              >
                <td
                  className=""
                >
                  <em>
                    Still
                  </em>
                </td>
                <td
                  className=""
                >
                  <code>
                    renders
                  </code>
                </td>
                <td
                  className=""
                >
                  <strong>
                    nicely
                  </strong>
                </td>
              </tr>
              <tr
                className=""
              >
                <td
                  className=""
                >
                  1
                </td>
                <td
                  className=""
                >
                  2
                </td>
                <td
                  className=""
                >
                  3
                </td>
              </tr>
            </tbody>
          </table>
          <a
            name="blockquotes"
          />
          <h2>
            Blockquotes
          </h2>
          <pre>
            <code
              className="language-no-highlight"
            >
              &gt; Blockquotes are very handy in email to emulate reply text.
      &gt; This line is part of the same quote.

      Quote break.

      &gt; This is a very long line that will still be quoted properly when it wraps. Oh boy let's keep writing to make sure this is long enough to actually wrap for everyone. Oh, you can *put* **Markdown** into a blockquote.
            </code>
          </pre>
          <blockquote>
            <p>
              Blockquotes are very handy in email to emulate reply text.
      This line is part of the same quote.
            </p>
          </blockquote>
          <p>
            Quote break.
          </p>
          <blockquote>
            <p>
              This is a very long line that will still be quoted properly when it wraps. Oh boy let's keep writing to make sure this is long enough to actually wrap for everyone. Oh, you can 
              <em>
                put
              </em>
               
              <strong>
                Markdown
              </strong>
               into a blockquote.
            </p>
          </blockquote>
          <a
            name="html"
          />
          <h2>
            Inline HTML
          </h2>
          <p>
            You can also use raw HTML in your Markdown, and it'll mostly work pretty well.
          </p>
          <pre>
            <code
              className="language-no-highlight"
            >
              &lt;dl&gt;
        &lt;dt&gt;Definition list&lt;/dt&gt;
        &lt;dd&gt;Is something people use sometimes.&lt;/dd&gt;

        &lt;dt&gt;Markdown in HTML&lt;/dt&gt;
        &lt;dd&gt;Does *not* work **very** well. Use HTML &lt;em&gt;tags&lt;/em&gt;.&lt;/dd&gt;
      &lt;/dl&gt;
            </code>
          </pre>
          <dl>
            <dt>
              Definition list
            </dt>
            <dd>
              Is something people use sometimes.
            </dd>
            <dt>
              Markdown in HTML
            </dt>
            <dd>
              Does 
              <em>
                not
              </em>
               work 
              <strong>
                very
              </strong>
               well. Use HTML 
              <em>
                tags
              </em>
              .
            </dd>
          </dl>
          <a
            name="hr"
          />
          <h2>
            Horizontal Rule
          </h2>
          <pre>
            <code>
              Three or more...

      ---

      Hyphens

      ***

      Asterisks

      ___

      Underscores
            </code>
          </pre>
          <p>
            Three or more...
          </p>
          <hr />
          <p>
            Hyphens
          </p>
          <hr />
          <p>
            Asterisks
          </p>
          <hr />
          <p>
            Underscores
          </p>
          <a
            name="lines"
          />
          <h2>
            Line Breaks
          </h2>
          <p>
            My basic recommendation for learning how line breaks work is to experiment and discover -- hit &lt;Enter&gt; once (i.e., insert one newline), then hit it twice (i.e., insert two newlines), see what happens. You'll soon learn to get what you want. "Markdown Toggle" is your friend.
          </p>
          <p>
            Here are some things to try out:
          </p>
          <pre>
            <code>
              Here's a line for us to start with.

      This line is separated from the one above by two newlines, so it will be a *separate paragraph*.

      This line is also a separate paragraph, but...
      This line is only separated by a single newline, so it's a separate line in the *same paragraph*.
            </code>
          </pre>
          <p>
            Here's a line for us to start with.
          </p>
          <p>
            This line is separated from the one above by two newlines, so it will be a 
            <em>
              separate paragraph
            </em>
            .
          </p>
          <p>
            This line is also begins a separate paragraph, but...
      This line is only separated by a single newline, so it's a separate line in the 
            <em>
              same paragraph
            </em>
            .
          </p>
          <p>
            (Technical note: 
            <em>
              Markdown Here
            </em>
             uses GFM line breaks, so there's no need to use MD's two-space line breaks.)
          </p>
          <a
            name="videos"
          />
          <h2>
            YouTube Videos
          </h2>
          <p>
            They can't be added directly but you can add an image with a link to the video like this:
          </p>
          <pre>
            <code
              className="language-no-highlight"
            >
              &lt;a href="http://www.youtube.com/watch?feature=player_embedded&v=YOUTUBE_VIDEO_ID_HERE
      " target="_blank"&gt;&lt;img src="http://img.youtube.com/vi/YOUTUBE_VIDEO_ID_HERE/0.jpg"
      alt="IMAGE ALT TEXT HERE" width="240" height="180" border="10" /&gt;&lt;/a&gt;
            </code>
          </pre>
          <p>
            Or, in pure Markdown, but losing the image sizing and border:
          </p>
          <pre>
            <code
              className="language-no-highlight"
            >
              [![IMAGE ALT TEXT HERE](http://img.youtube.com/vi/YOUTUBE_VIDEO_ID_HERE/0.jpg)](http://www.youtube.com/watch?v=YOUTUBE_VIDEO_ID_HERE)
            </code>
          </pre>
        </React.Fragment>,
      }
    `)
})

test('code block rendering', () => {
    const code = dedent`
`
    expect(
        render(dedent`
      \`\`\`typescript
      const x = 1;
      \`\`\`

      \`\`\`invalid-language
      const y = 2;
      \`\`\`
    `),
    ).toMatchInlineSnapshot(`
      {
        "errors": [],
        "html": "<pre><code class="language-typescript">const x = 1;</code></pre><pre><code class="language-invalid-language">const y = 2;</code></pre>",
        "result": <React.Fragment>
          <pre>
            <code
              className="language-typescript"
            >
              const x = 1;
            </code>
          </pre>
          <pre>
            <code
              className="language-invalid-language"
            >
              const y = 2;
            </code>
          </pre>
        </React.Fragment>,
      }
    `)
})

test('code is not wrapped by p', () => {
    const code = `
---
title: createSearchParams
---

# createSearchParams

[MODES: framework, data, declarative]

## Summary

[Reference Documentation ↗](https://api.reactrouter.com/v7/functions/react_router.createSearchParams.html)

Creates a URLSearchParams object using the given initializer.

This is identical to \`new URLSearchParams(init)\` except it also
supports arrays as values in the object form of the initializer
instead of just strings. This is convenient when you need multiple
values for a given key, but don't want to use an array initializer.

For example, instead of:

\`\`\`tsx
let searchParams = new URLSearchParams([
  ["sort", "name"],
  ["sort", "price"],
]);
\`\`\`

you can do:

\`\`\`
let searchParams = createSearchParams({
  sort: ['name', 'price']
});
\`\`\`

## Signature

\`\`\`tsx
createSearchParams(init): URLSearchParams
\`\`\`

## Params

### init

[modes: framework, data, declarative]

_No documentation_

  `
    const jsx = render(code)
    expect(jsx.result).toMatchInlineSnapshot(`
      <React.Fragment>
        <hr />
        <h2>
          title: createSearchParams
        </h2>
        <h1>
          createSearchParams
        </h1>
        <p>
          [MODES: framework, data, declarative]
        </p>
        <h2>
          Summary
        </h2>
        <p>
          <a
            href="https://api.reactrouter.com/v7/functions/react_router.createSearchParams.html"
            title=""
          >
            Reference Documentation ↗
          </a>
        </p>
        <p>
          Creates a URLSearchParams object using the given initializer.
        </p>
        <p>
          This is identical to 
          <code>
            new URLSearchParams(init)
          </code>
           except it also
      supports arrays as values in the object form of the initializer
      instead of just strings. This is convenient when you need multiple
      values for a given key, but don't want to use an array initializer.
        </p>
        <p>
          For example, instead of:
        </p>
        <pre>
          <code
            className="language-tsx"
          >
            let searchParams = new URLSearchParams([
        ["sort", "name"],
        ["sort", "price"],
      ]);
          </code>
        </pre>
        <p>
          you can do:
        </p>
        <pre>
          <code>
            let searchParams = createSearchParams({
        sort: ['name', 'price']
      });
          </code>
        </pre>
        <h2>
          Signature
        </h2>
        <pre>
          <code
            className="language-tsx"
          >
            createSearchParams(init): URLSearchParams
          </code>
        </pre>
        <h2>
          Params
        </h2>
        <h3>
          init
        </h3>
        <p>
          [modes: framework, data, declarative]
        </p>
        <p>
          <em>
            No documentation
          </em>
        </p>
      </React.Fragment>
    `)
})

test('component props schema validation with zod', () => {
    const HeadingSchema = z.object({
        level: z.number().min(1).max(6),
        title: z.string().optional(),
    })

    const CardsSchema = z.object({
        count: z.number().positive(),
        variant: z.enum(['default', 'outline']).optional(),
    })

    const componentPropsSchema: ComponentPropsSchema = {
        Heading: HeadingSchema,
        Cards: CardsSchema,
    }

    const code = dedent`
        <Heading level={2} title="test">Valid heading</Heading>
        
        <Cards count={3} variant="outline">Valid cards</Cards>
        
        <Heading level={10} title="test">Invalid heading - level too high</Heading>
        
        <Cards count={-1}>Invalid cards - negative count</Cards>
        
        <Cards count="not a number">Invalid cards - wrong type</Cards>
    `

    expect(render(code, componentPropsSchema)).toMatchInlineSnapshot(`
      {
        "errors": [
          {
            "line": 5,
            "message": "Invalid props for component "Heading" at "level": Number must be less than or equal to 6",
            "schemaPath": "level",
          },
          {
            "line": 7,
            "message": "Invalid props for component "Cards" at "count": Number must be greater than 0",
            "schemaPath": "count",
          },
          {
            "line": 9,
            "message": "Invalid props for component "Cards" at "count": Expected number, received string",
            "schemaPath": "count",
          },
        ],
        "html": "<h1>Valid heading</h1><div>Valid cards</div><h1>Invalid heading - level too high</h1><div>Invalid cards - negative count</div><div>Invalid cards - wrong type</div>",
        "result": <React.Fragment>
          <Heading
            level={2}
            title="test"
          >
            Valid heading
          </Heading>
          <Cards
            count={3}
            variant="outline"
          >
            Valid cards
          </Cards>
          <Heading
            level={10}
            title="test"
          >
            Invalid heading - level too high
          </Heading>
          <Cards
            count={-1}
          >
            Invalid cards - negative count
          </Cards>
          <Cards
            count="not a number"
          >
            Invalid cards - wrong type
          </Cards>
        </React.Fragment>,
      }
    `)
})

test('schema validation without errors', () => {
    const HeadingSchema = z.object({
        level: z.number().min(1).max(6),
        title: z.string().optional(),
    })

    const componentPropsSchema: ComponentPropsSchema = {
        Heading: HeadingSchema,
    }

    const code = dedent`
        <Heading level={2} title="test">Valid heading</Heading>
        <Heading level={1}>Another valid heading</Heading>
    `

    expect(render(code, componentPropsSchema)).toMatchInlineSnapshot(`
      {
        "errors": [],
        "html": "<h1>Valid heading</h1><h1>Another valid heading</h1>",
        "result": <React.Fragment>
          <Heading
            level={2}
            title="test"
          >
            Valid heading
          </Heading>
          <Heading
            level={1}
          >
            Another valid heading
          </Heading>
        </React.Fragment>,
      }
    `)
})

test('component without schema should not be validated', () => {
    const HeadingSchema = z.object({
        level: z.number().min(1).max(6),
    })

    const componentPropsSchema: ComponentPropsSchema = {
        Heading: HeadingSchema,
    }

    const code = dedent`
        <Heading level={2}>Valid heading with schema</Heading>
        <Cards invalidProp="anything">Cards without schema - should not be validated</Cards>
    `

    expect(render(code, componentPropsSchema)).toMatchInlineSnapshot(`
      {
        "errors": [],
        "html": "<h1>Valid heading with schema</h1><div>Cards without schema - should not be validated</div>",
        "result": <React.Fragment>
          <Heading
            level={2}
          >
            Valid heading with schema
          </Heading>
          <Cards
            invalidProp="anything"
          >
            Cards without schema - should not be validated
          </Cards>
        </React.Fragment>,
      }
    `)
})

test('validation error includes schema path', () => {
    const ComplexSchema = z.object({
        user: z.object({
            name: z.string(),
            age: z.number().min(0),
        }),
        settings: z.object({
            theme: z.enum(['light', 'dark']),
        }),
    })

    const componentPropsSchema: ComponentPropsSchema = {
        Heading: ComplexSchema,
    }

    const code = dedent`
        <Heading user={{ name: "test", age: -1 }} settings={{ theme: "invalid" }}>Complex validation</Heading>
    `

    expect(render(code, componentPropsSchema)).toMatchInlineSnapshot(`
      {
        "errors": [
          {
            "line": 1,
            "message": "Expressions in jsx props are not supported (user={{ name: "test", age: -1 }})",
          },
          {
            "line": 1,
            "message": "Expressions in jsx props are not supported (settings={{ theme: "invalid" }})",
          },
          {
            "line": 1,
            "message": "Invalid props for component "Heading" at "user": Required",
            "schemaPath": "user",
          },
          {
            "line": 1,
            "message": "Invalid props for component "Heading" at "settings": Required",
            "schemaPath": "settings",
          },
        ],
        "html": "<h1>Complex validation</h1>",
        "result": <React.Fragment>
          <Heading>
            Complex validation
          </Heading>
        </React.Fragment>,
      }
    `)
})
