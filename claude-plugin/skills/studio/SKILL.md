---
name: studio
description: Launch Squiggle Studio, a local editor and live playground for the .squiggle files in a directory, and show the user results from it.
argument-hint: "[directory]"
disable-model-invocation: true
---

Launch Squiggle Studio for the directory `$ARGUMENTS` (use the current directory if none was given).

`@quri/squiggle-studio` isn't published to npm yet, so it has to run from a checkout of the Squiggle monorepo (github.com/quantified-uncertainty/squiggle).

## Launch

1. Find the CLI:
   - Inside the Squiggle monorepo (there is a `packages/studio` directory at the repo root): build it once with `npx turbo run build --filter=@quri/squiggle-studio...` (needs `pnpm install` first), then use `node packages/studio/bin/squiggle-studio.js`.
   - Elsewhere, if `squiggle-studio` is on the PATH (e.g. the user linked it from a checkout), use it. `npx -y @quri/squiggle-studio` only works once the package is published.
2. Run `<cli> <directory> --no-open` in the background with the Bash tool's background option, so it keeps running. Studio uses port 4321 and tries the next ports if it's busy; pass `--port <n>` to choose one. Drop `--no-open` if the user wants a browser tab opened for them. Passing a file instead of a directory opens its folder with that file shown.
3. Read the command's output and give the user the local URL it prints (`Squiggle Studio is running at http://127.0.0.1:4321`).
4. If Studio isn't available, say so, and offer alternatives: a https://squiggle-language.com/playground link from the `squiggle` skill's `playground-url.mjs` script, `squiggle playground` (opens the online playground), or the VS Code Squiggle extension.

## Editing files the user has open in Studio

- Studio autosaves the user's edits about 1 s after they stop typing, and at once when its window loses focus. So if an Edit fails with "file modified since read", the user has changed the file: re-read it and redo your edit on top of their version.
- Studio never overwrites a change it hasn't seen. If you write a file while the user has unsaved edits in it, Studio shows them a conflict banner (Reload from disk / Overwrite with my edits) instead of losing either version. If the user hasn't edited the file, your change appears in place, keeping their cursor and scroll.
- Files you create or change appear in the Explorer's **Changed on disk** list and in the status bar. They open by themselves only when the user has turned on **Follow** (status bar, or View ▸ Follow Changes on Disk); otherwise tell the user which file to look at, or give them a link.
- Files that import a file you changed re-run automatically.

## Showing results

Use the CLI rather than the browser for anything you need to read. All three commands work without a running Studio, use Studio's import rules (`./` and `../` imports inside the root, `hub:owner/slug` from Squiggle Hub) and the same seed as the UI, and set the exit code (0 ok, 1 errors in the model, 2 usage or file error, 124 timeout). Run them from the project root, or pass `--root <dir>`, so `../` imports resolve.

- **Numbers:** `<cli> run <file> --json` prints the values (`bindings`, `result`, with mean, p5, p95 and so on for distributions), `errors` (kind, message, location, import chain, hints) and a `studio` block (views, relative values specs, imports). `--only total,costs.labor` keeps it short. Take numbers from this JSON, never from a picture.
- **Relative values:** `<cli> rv <file> --format csv [--variable name]` prints the pair matrix (median ratios; `--metric mean|min|max|uncertainty`), or the full bundle as JSON by default.
- **Pictures:** `<cli> render <file> --json --scale 1` writes a PNG of the Output view and reports errors; read the PNG to check that charts look right. Add `--variable name` for one variable, `--view relative-values --tab list|grid|plot` for the relative values dashboard, `--layout list` for the list layout, or `--url '<link the user copied from Studio>'` to render exactly what they see. It needs `puppeteer-core` (installed with the monorepo as an optional dependency) and a local Chrome or Chromium (`--chrome <path>` to override).
- **Pointing the user at something:** give them a link: `http://127.0.0.1:4321/?file=<path relative to the folder>&view=output|relative-values&tab=grid&variable=<name>` (URL-encode the path). The user can also copy context for you with Run ▸ Copy for Agent ▸ Context, which includes the file, the view, a link and ready-made `run` and `render` commands.

Files with a relative values spec (see the `squiggle` skill's `reference/relative-values.md`) get a **Relative values** view with List, Grid and Plot tabs.
