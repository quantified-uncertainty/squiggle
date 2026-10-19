---
name: studio
description: Launch Squiggle Studio, a local editor and live playground for the .squiggle files in a directory.
argument-hint: "[directory]"
disable-model-invocation: true
---

Launch Squiggle Studio for the directory `$ARGUMENTS` (use the current directory if none was given).

1. Run `npx -y @quri/squiggle-studio <directory>` in the background with the Bash tool's background option, so it keeps running. Inside the Squiggle monorepo, prefer the workspace package (`packages/studio`) if it exists. Add `--port <n>` if the default port (4321) is taken.
2. Read the command's output and give the user the local URL it prints. Studio reloads models when files change on disk, so you can keep editing `.squiggle` files and the user sees the updates live.
3. If `@quri/squiggle-studio` can't be found, say so, and offer alternatives: `squiggle playground` (from `@quri/squiggle-lang`), the VS Code Squiggle extension, or a https://squiggle-language.com/playground link from the `squiggle` skill's `playground-url.mjs` script.
