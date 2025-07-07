## files

always use kebab case for new filenames. never use uppercase letters in filenames

## testing

use vitest. always use inline snapshots for testing. never manually write the inline snapshots yourself, instead use `pnpm test -u`

`toMatchInlineSnapshot` is the preferred way to add tests.

## changesets

after you make a change that is noteworthy, add a changeset. these will be used later on to create a changelog for the package. use `pnpm changeset add --empty` to create a changeset file in `.changeset` folder, then write there the changes you made in a single concise paragraph. never run other changeset commands, like `pnpm changeset version` or `pnpm changeset publish`. Notice that sometimes the cwd is missing `.changeset` folder, in that case check the parents directories.

Only add changesets for packages that are not marked as `private` in their `package.json` and have a `version` in the package.json.

NEVER create the .changeset folder yourself, always use the `pnpm changeset add --empty` command to create it. If the command fails it means you need to go to the upper directory where the `.changeset` folder is located and run the command there.

Changeset files are structured like this:

```md
---
'package-name': patch # can also be `minor` or `major`, never use major
---

markdown describing the changes you made, in present tense, like "add support for X" or "fix bug with Y". Be detailed but concise, and never use bullet points or lists. Always show example code snippets if applicable, and use proper markdown formatting.

```
