# Squiggle Studio

A local, browser-first editor and viewer for `.squiggle` files. Point it at a folder, and it shows a file tree, an editor with live output, and a full-window output view. Files changed on disk (for example, by a coding agent like Claude Code) update in the open view automatically.

```sh
squiggle-studio [dir] [--port 4321] [--host 127.0.0.1] [--no-open]
squiggle-studio render <file.squiggle> [--out file.png] [--variable name] [--width 1000] [--chrome path]
```

## Features

- File tree (`.squiggle`, `.json`, `.md`; skips `node_modules`, `.git`, dot-folders), open-file tabs, recent files (per folder, in localStorage) and recent folders (`~/.squiggle-studio/recent.json`).
- Per-file view tabs: **Split** (the Squiggle playground: editor + output) and **Output** (full-window viewer). More views can be registered (see below).
- Cmd/Ctrl+S saves. Unsaved files are marked with a dot.
- Live reload over Server-Sent Events. If the file changes on disk while you have unsaved edits, a banner offers "Reload from disk" or "Keep my edits". Files that import a changed file are re-run.
- Imports:
  - relative: `import "./lib/costs.squiggle" as costs` (resolved relative to the importing file, never outside the open folder);
  - Squiggle Hub: `import "hub:owner/slug" as model` (fetched through the local server from `https://squigglehub.org/api/get-source`, cached for a minute).
- "Import from Squiggle Hub" (globe icon) downloads a Hub model into the folder as a `.squiggle` file.
- `render` writes a PNG of a file's output (or one variable, zoomed in) so that agents can look at charts. It needs the optional dependency `puppeteer-core` and a local Chrome/Chromium (`--chrome` or `CHROME_PATH` to override).

## Development

```sh
pnpm dev     # tsx + Vite middleware with HMR, serving ./examples
pnpm build   # tsc (server/CLI -> dist/) + vite build (client -> dist/client)
pnpm start   # built version, serving ./examples
pnpm test    # vitest: path safety + file API + SSE
pnpm typecheck:client
```

`squiggle-studio --dev` runs the client through Vite instead of `dist/client`.

## Architecture

- `src/server/` — `node:http` server, no framework. All API paths are POSIX paths relative to the open folder and go through `resolveSafePath` (rejects absolute paths, `..`, NUL bytes, ignored dirs and symlinks pointing outside the root). The server binds `127.0.0.1` by default, rejects foreign `Host` headers (DNS rebinding) and requires an `x-squiggle-studio: 1` header on API calls (blocks cross-site form posts). Watching uses `fs.watch({ recursive: true })`.
- `src/shared/api.ts` — zod schemas and types shared by server and client.
- `src/client/` — Vite + React + Tailwind app using `@quri/squiggle-components` and `@quri/ui`.
- `src/cli/` — the `squiggle-studio` command and `render`.

### HTTP API

| Route                            | Description                                         |
| -------------------------------- | --------------------------------------------------- |
| `GET /api/root`                  | `{ root, name }`                                    |
| `POST /api/root` `{ path }`      | open another folder                                 |
| `GET /api/tree`                  | `{ root, tree: TreeNode[] }`                        |
| `GET /api/file?path=`            | `{ path, content, mtimeMs }`                        |
| `PUT /api/file` `{path,content}` | write (atomic rename)                               |
| `GET /api/recent`                | recent folders                                      |
| `GET /api/browse?path=`          | list subdirectories (folder picker)                 |
| `GET /api/hub/source?owner&slug` | Hub model source                                    |
| `POST /api/hub/import`           | `{ owner, slug, path, overwrite? }`                 |
| `GET /api/events`                | SSE: `file-changed`, `tree-changed`, `root-changed` |

### Programmatic server (e.g. for Electron)

```ts
import { startStudioServer } from "@quri/squiggle-studio";

const server = await startStudioServer({
  root: "/path/to/folder",
  port: 0, // 0 = random free port; default 4321 (tries the next ports if busy)
  // host, strictPort, dev, clientDir, recentFile, hubUrl, allowOpenFolder
});
server.url; // "http://127.0.0.1:54321"
await server.openFolder("/another/folder"); // clients get a root-changed event
await server.close();
```

### Adding views

Views are tabs next to Split/Output. Register them in `src/client/main.tsx` before rendering:

```tsx
import { registerStudioView } from "./views/index.js";

registerStudioView({
  id: "my-view",
  label: "My view",
  isAvailable: ({ runOutput }) => runOutput?.output.result.ok ?? false,
  render: ({ runOutput }) => <MyView output={runOutput?.output} />,
});
```

See `src/client/views/types.ts` for `StudioView`, `StudioViewContext` and `StudioRunOutput`. `runOutput` is computed by Studio for the current editor buffer (including unsaved edits).

### URL parameters

`?file=path.squiggle&view=output&embed=1&variable=name` opens a file, picks a view, hides the chrome and/or zooms into one variable. `render` uses these.
