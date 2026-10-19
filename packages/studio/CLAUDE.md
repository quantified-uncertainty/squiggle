# Squiggle Studio: notes for coding agents

Studio is a local editor and viewer for `.squiggle` files: a Node server (`src/server/`), a React client (`src/client/`), code shared by both (`src/shared/`) and the `squiggle-studio` CLI (`src/cli/`). The user-facing docs are in [README.md](./README.md); the e2e harness is described in [e2e/README.md](./e2e/README.md).

## Build and test

Use `npx -y pnpm@10` if the global `pnpm` is older than 10.

```sh
npx turbo run build --filter=@quri/squiggle-studio...   # workspace dependencies, then Studio
pnpm dev                  # tsx + Vite with HMR, serving ./examples
pnpm test                 # vitest unit tests (no Chrome)
pnpm lint                 # prettier, then the client and e2e typechecks
npx tsc -b                # the server and CLI
pnpm e2e                  # headless Chrome: every scenario plus the global invariants
pnpm e2e --strict         # contrast below 4.5:1 fails too (what CI and integration run)
pnpm e2e --only explorer  # a tag, id or id prefix
```

The `e2e*` scripts run `vite build` first and use the system Chrome (`CHROME_PATH` overrides). Set `STUDIO_E2E_PORTS=5300-5319` to keep the servers in a port range when several agents share a machine. Run any Studio server you start by hand with an isolated `HOME` (for example `HOME=$PWD/.qa-home`), so it never touches the user's `~/.squiggle-studio`.

## Looking at the UI

- `pnpm e2e:shoot [--only <tag|id>] [--viewport 1024x768] [--label name] [--strict]` puts every scenario in its state and writes `e2e-out/<label>/`. Read `contact-sheet.png` first (24 shots per page; longer runs add `contact-sheet-2.png`, …), then the single shots in `shots/`, and check `manifest.json` for `pageErrors`, `studioErrors`, `contrast` and `unnamedButtons`.
- `pnpm e2e:serve [--fixtures rv] [--dev]` starts a fixture server and prints `{url, root, stateDir, hub}`. Drive it with headless Chrome (puppeteer-core), select elements by test id (`src/shared/testIds.ts`) or ARIA role, and wait with `await window.squiggleStudio.whenIdle()`. Load pages with `waitUntil: "load"`, never `networkidle`: the live-reload event stream never goes idle.
- `window.squiggleStudio` (`src/client/lib/agentHooks.ts`) also has `commands.list()`, `commands.run(id, args)`, `getState()`, `getRunJson()`, `getRvMatrix()` and `flush()`. `<html>` carries `data-studio-active-file`, `-view`, `-run`, `-disk-hash`, `-dirty` and `-idle`.

## Seeing model outputs

No server or browser is needed for numbers:

- `squiggle-studio run <file> --json` prints squiggle's `RunJson` plus a `studio` block (root, codeHash, imports, views, relative values specs). It uses the UI's import rules (`./`, `../` inside the root, `hub:owner/slug`) and seed, so the numbers match what the user sees. Exit codes: 0 ok, 1 model error, 2 usage error, 124 timeout.
- `squiggle-studio rv <file> [--format csv] [--variable name]` prints the relative values pair matrix.
- `squiggle-studio render <file> [--view relative-values --tab grid] [--variable x] --json --scale 1` writes a PNG and reports errors; `--url '<Studio link>'` renders exactly that view.

From this checkout the CLI is `node packages/studio/bin/squiggle-studio.js` (after a build) or `npx tsx src/cli/index.ts`.

## Rules

- A new surface ships with an e2e scenario; a bug fix ships with a scenario or unit test that failed before it.
- Scenarios live in `e2e/scenarios/<area>.ts` (auto-discovered) and select by test id or role, never by visible text. New fixtures go in `e2e/fixtures/<area>/`; `__golden__/` is regenerated with `pnpm e2e:golden`.
- Determinism: wait with `h.whenIdle()`, never with sleeps; `?test=1` (set by the harness) turns off animations and starts the command log; keep screenshots free of times that change between runs (mark such text `data-volatile`).
- Commands are declared once in the manifest (`src/shared/commands/`), with their keys, `when` clauses, preconditions and menu placement; components register handlers with `useCommand`. Menus, the palette, the shortcut sheet, tooltips and the Electron native menu are all built from it. Keys are checked by `test/manifest.test.ts` (no clashes with CodeMirror or browser-reserved keys).
- Shell components read the workspace through `useWorkspaceContext()` (`src/client/lib/workspaceTypes.ts`); the model is `WorkspaceModel` in `src/client/lib/useWorkspace.ts`. The disk is the source of truth: saves send `baseHash`, and a file changed on disk while the buffer is dirty becomes a conflict, never a silent overwrite.
- UI state and settings go through `src/client/lib/studioState.ts` (server-backed, `~/.squiggle-studio/state.json` and `settings.json`), never straight to localStorage; never write a root's state before it has loaded.
- Text has a contrast of at least 4.5:1 (slate-500 or darker on white, slate-600 on slate-100); every button has an accessible name.
