# Squiggle Studio

A local, browser-first editor and viewer for `.squiggle` files. Point it at a folder, and it shows a file tree, an editor with live output, and a full-window output view. Files changed on disk (for example, by a coding agent like Claude Code) update in the open view automatically.

```sh
squiggle-studio [dir] [--port 4321] [--host 127.0.0.1 [--allow-network]] [--no-open]
squiggle-studio render <file.squiggle> [--out file.png] [--variable name] [--view output|relative-values] [--tab list|grid|plot] [--width 1000] [--chrome path]
```

The package isn't published to npm yet. From a checkout of the Squiggle monorepo, build it and run the binary directly:

```sh
npx turbo run build --filter=@quri/squiggle-studio...
node packages/studio/bin/squiggle-studio.js packages/studio/examples
```

## Features

- File tree (`.squiggle`, `.json`, `.md`; skips `node_modules`, `.git`, dot-folders), open-file tabs, recent files (per folder, in localStorage) and recent folders (`~/.squiggle-studio/recent.json`).
- Per-file view tabs: **Split** (the Squiggle playground: editor + output), **Output** (full-window viewer) and, for relative values models, **Relative values** (see below). More views can be registered (see below).
- Cmd/Ctrl+S saves. Unsaved files are marked with a dot.
- Live reload over Server-Sent Events. If the file changes on disk while you have unsaved edits, a banner offers "Reload from disk" or "Keep my edits". Files that import a changed file are re-run.
- Imports:
  - relative: `import "./lib/costs.squiggle" as costs` (resolved relative to the importing file, never outside the open folder);
  - Squiggle Hub: `import "hub:owner/slug" as model` (fetched through the local server from `https://squigglehub.org/api/get-source`, cached for a minute).
- "Import from Squiggle Hub" (globe icon) downloads a Hub model into the folder as a `.squiggle` file.
- `render` writes a PNG of a file's output (or one variable, zoomed in) so that agents can look at charts. It needs the optional dependency `puppeteer-core` and a local Chrome/Chromium (`--chrome` or `CHROME_PATH` to override).

## Relative values

Files with a top-level [relative values](../relative-values/README.md) spec get a **Relative values** tab: a dashboard (from `@quri/squiggle-relative-values`) with its own **List**, **Grid** and **Plot** tabs. A spec is a dict like

```squiggle
fruit = {
  title: "Fruit", // optional
  items: [{ id: "apple", name: "Apple", clusterId: "common" }, ...], // or plain ids
  clusters: [{ id: "common", name: "Common", color: "#5D8CD3" }], // optional
  recommendedUnit: "apple", // optional
  fn: {|a, b| [dists[a], dists[b]]}, // values of a and b, in a shared unit
}
// or simply
fruit = { values: { apple: 1, banana: 0.5 to 2, mango: 2 to 6 } }
```

- The variable doesn't need to be exported. With several specs, a picker chooses one (or use `?variable=name`).
- The chosen variable and dashboard tab are remembered per file, across live reloads. When the file changes on disk the dashboard re-evaluates, keeping the previous results on screen until the new ones are ready. If the model fails to run, the tab stays and shows the error; an invalid spec shows what's wrong with it.
- Computed pairs are cached per code version, so switching tabs or undoing an edit is instant.
- Clicking a value in the List view opens a sidebar with charts for that pair; it re-runs the model with Studio's linker, so imports work.
- Pairs are evaluated synchronously on the main thread: about 0.2 s for 24 items (576 pairs) and 0.5 s for 38 items. Expect the UI to pause for a few seconds with 100+ items.
- `squiggle-studio render model.squiggle --view relative-values --tab grid` renders the dashboard to a PNG.

Examples are in [`examples/relative-values/`](./examples/relative-values).

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

- `src/server/` — `node:http` server, no framework. Watching uses `fs.watch({ recursive: true })`.
- `src/shared/api.ts` — zod schemas and types shared by server and client.
- `src/client/` — Vite + React + Tailwind app using `@quri/squiggle-components` and `@quri/ui`.
- `src/cli/` — the `squiggle-studio` command and `render`.

### Security model

Studio has no authentication: whoever can talk to the server can read and write files in the open folder. It relies on only being reachable from this machine:

- It binds `127.0.0.1` by default. A non-loopback `--host` (e.g. `0.0.0.0`) is refused unless you also pass `--allow-network` (`allowNetwork: true`), which prints a warning and disables opening other folders (`POST /api/root`, `GET /api/browse`), so network clients are confined to the folder you started it with.
- Websites can't use it from your browser: the server rejects foreign `Host` headers (DNS rebinding; in network mode, IP-literal hosts are also accepted) and requires an `x-squiggle-studio: 1` header on API calls, which cross-origin pages can't send without a CORS preflight that is never approved.
- All file paths are POSIX paths relative to the open folder and go through `resolveSafePath`, which rejects absolute paths, `..`, NUL bytes, hidden files and folders (`.env`, `.git/…`), ignored dirs (`node_modules`, `dist`, …) and symlinks pointing outside the root. Only `.squiggle`, `.json` and `.md` files can be read, written or renamed.

### HTTP API

| Route                            | Description                                              |
| -------------------------------- | -------------------------------------------------------- |
| `GET /api/root`                  | `{ root, name }`                                         |
| `POST /api/root` `{ path }`      | open another folder                                      |
| `GET /api/tree`                  | `{ root, tree: TreeNode[] }`                             |
| `GET /api/file?path=`            | `{ path, content, mtimeMs }`                             |
| `PUT /api/file` `{path,content}` | write (atomic rename); `create: true` → 409 if it exists |
| `POST /api/file/rename`          | `{ from, to }`; rename/move, 409 if `to` exists          |
| `GET /api/recent`                | recent folders                                           |
| `GET /api/browse?path=`          | list subdirectories (folder picker)                      |
| `GET /api/hub/source?owner&slug` | Hub model source                                         |
| `POST /api/hub/import`           | `{ owner, slug, path, overwrite? }`                      |
| `GET /api/events`                | SSE: `file-changed`, `tree-changed`, `root-changed`      |

Errors are `{ error, code? }` with a non-2xx status. The client sends `x-squiggle-studio-root: <encodeURIComponent(root)>` on file reads, writes, renames and Hub imports; if the server has switched to another folder since, it answers 409 `{ code: "root-changed", root }` instead of touching the new folder. Requests without the header (e.g. `curl`) skip this check. A 409 for an existing file has `code: "file-exists"`.

### Programmatic server (e.g. for Electron)

```ts
import { startStudioServer } from "@quri/squiggle-studio";

const server = await startStudioServer({
  root: "/path/to/folder",
  port: 0, // 0 = random free port; default 4321 (tries the next ports if busy)
  // host, allowNetwork, strictPort, dev, clientDir, recentFile, hubUrl, allowOpenFolder
});
server.url; // "http://127.0.0.1:54321"
await server.openFolder("/another/folder"); // clients get a root-changed event
await server.close();
```

There is a desktop wrapper built on this API in [`packages/studio-electron`](../studio-electron).

### Adding views

Views are tabs next to Split/Output (the Relative values view in `src/client/views/RelativeValuesView.tsx` is a built-in example). Register them in `src/client/main.tsx` before rendering:

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

`?file=path.squiggle&view=output&embed=1&variable=name` opens a file, picks a view (`split`, `output` or `relative-values`), hides the chrome and/or zooms into one variable (in the Relative values view: picks the spec). `&tab=list|grid|plot` picks the relative values dashboard tab. `render` uses these.
