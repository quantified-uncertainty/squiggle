---
name: studio
description: Launch Squiggle Studio, a local editor and live playground for the .squiggle files in a directory.
argument-hint: "[directory]"
disable-model-invocation: true
---

Launch Squiggle Studio for the directory `$ARGUMENTS` (use the current directory if none was given).

`@quri/squiggle-studio` isn't published to npm yet, so it has to run from a checkout of the Squiggle monorepo (github.com/quantified-uncertainty/squiggle).

1. Find the CLI:
   - Inside the Squiggle monorepo (there is a `packages/studio` directory at the repo root): build it once with `npx turbo run build --filter=@quri/squiggle-studio...` (needs `pnpm install` first), then use `node packages/studio/bin/squiggle-studio.js`.
   - Elsewhere, if `squiggle-studio` is on the PATH (e.g. the user linked it from a checkout), use it. `npx -y @quri/squiggle-studio` only works once the package is published.
2. Run `<cli> <directory> --no-open` in the background with the Bash tool's background option, so it keeps running. Studio uses port 4321 and tries the next ports if it's busy; pass `--port <n>` to choose one. Drop `--no-open` if the user wants a browser tab opened for them.
3. Read the command's output and give the user the local URL it prints (`Squiggle Studio is running at http://127.0.0.1:4321`). Add `?file=<path relative to the directory>` to open a specific file. Studio reloads models when files change on disk, so you can keep editing `.squiggle` files and the user sees the updates live.
4. Files with a relative values spec (see the `squiggle` skill's `reference/relative-values.md`) get a **Relative values** tab with List, Grid, and Plot views.
5. To check visuals yourself, `<cli> render <file> [--out x.png] [--variable name]` writes a PNG of the output; add `--view relative-values [--tab list|grid|plot]` for the relative values dashboard. It needs `puppeteer-core` (installed with the monorepo as an optional dependency) and a local Chrome or Chromium (`--chrome <path>` to override). It serves the file's own directory, so imports from parent directories don't resolve in renders.
6. If Studio isn't available, say so, and offer alternatives: a https://squiggle-language.com/playground link from the `squiggle` skill's `playground-url.mjs` script, `squiggle playground` (opens the online playground), or the VS Code Squiggle extension.
