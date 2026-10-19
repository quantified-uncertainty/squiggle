# Squiggle Studio

A local, browser-first editor and viewer for `.squiggle` files. Point it at a folder and it shows an Explorer, an editor with live output, a relative values dashboard and a Playground, with menus, a command palette and keyboard shortcuts that follow VS Code. Files you or a coding agent (such as Claude Code) change on disk show up immediately, and Studio autosaves your edits so the agent always reads what you see.

```sh
squiggle-studio [dir-or-file] [--port 4321] [--host 127.0.0.1 [--allow-network]] [--no-open]
squiggle-studio run <file.squiggle> [--json] [--root dir] [--seed s] [-n samples] [--only a,b.c] [--timeout 30s]
squiggle-studio rv <file.squiggle> [--format json|csv] [--variable name] [--metric median|mean|min|max|uncertainty] [--unit id] [--long] [--precision n] [--root dir]
squiggle-studio render <file.squiggle> [--out file.png] [--root dir] [--view output|relative-values] [--tab list|grid|plot] [--variable name] [--layout cards|list] [--url link] [--width 1000] [--scale 1|2] [--json] [--timeout 60s] [--chrome path]
```

`squiggle-studio help <command>` describes every option. A file argument opens its folder with that file shown.

The package isn't published to npm yet. From a checkout of the Squiggle monorepo, build it and run the binary directly:

```sh
npx turbo run build --filter=@quri/squiggle-studio...
node packages/studio/bin/squiggle-studio.js packages/studio/examples
```

There is a desktop app built on the same server in [`packages/studio-electron`](../studio-electron).

## The window

```
┌──────────────────────────────────────────────────────────────────────────────────────────────┐
│ ◆ File Edit View Go Run Help       [⌕ models — Go to file or run a command  ⌘P]        ▣     │
├─────────────────────────┬────────────────────────────────────────────────────────────────────┤
│ MODELS ▾        + ⊞ ⊟ ⟳ │ lib › costs.squiggle ●      [Cards|List] [Output|RV|Playground] ‹› │
│                         ├───────────────────────────────┬────────────────────────────────────┤
│ CHANGED ON DISK 2       │ code pane                     │ the view                           │
│ ● costs.squiggle  lib   │                               │                                    │
│ ▾ lib                   │                               │                                    │
│     costs.squiggle   ●  │                               │                                    │
├─────────────────────────┴───────────────────────────────┴────────────────────────────────────┤
│ ● Live  Follow  ↻ costs.squiggle · ⌥F5  No problems        Ln 12, Col 5  Ran in 17 ms  Saved │
└──────────────────────────────────────────────────────────────────────────────────────────────┘
```

- **Header:** the menubar (File, Edit, View, Go, Run, Help), the command center (opens Quick Open; a search button below 900 px) and the Explorer toggle. View ▸ Menu Bar hides the menubar; the logo then becomes a ☰ menu. In the desktop app the menus are native and the in-app menubar isn't shown.
- **Explorer:** the folder switcher (recent folders and Open Folder…), New File, New Folder, Collapse Folders and Refresh, a pinned **Changed on disk** list, and the file tree (`.squiggle`, `.json`, `.md`; hidden folders and `node_modules`, `dist` and similar are never listed). The tree is keyboard driven: ↑/↓ move and show the file under the cursor after 150 ms, ←/→ collapse and expand, Enter shows the file and moves focus to the editor, F2 renames inline, Esc goes back to the main area. Folders that couldn't be read are named in a footer.
- **Editor area:** the breadcrumb with the full path and a dot for unsaved edits, the view switcher (⌘K 1/2/3), the view's own toolbar (Output's Cards/List, the relative values spec and List/Grid/Plot) and the code pane toggle (⌘\). Views: **Output** (cards or a list, one per visible variable), **Relative values** (for files with a relative values spec, below) and **Playground** (the Squiggle playground with its own editor and settings). `.md` and `.json` files open in a text editor.
- **Status bar:** the connection, Follow, unseen changes on disk, problems, the cursor, the last run and the save state. Every item is a button (click: refresh, toggle Follow, next change, first problem, run, save). View ▸ Status Bar hides it.
- **Overlays:** Quick Open (⌘P: recent files and changes when empty, a fuzzy match over the folder otherwise; `>` switches to commands), the command palette (⇧⌘P or F1), the recent-files switcher (hold ⌃ and press `` ` ``; a quick tap flips to the previous file), the keyboard shortcut sheet (`?` outside editors, or ⌘K ⌘S) and About.
- **Start page** (no file shown): New File, Open Folder, Import from Squiggle Hub, Go to File, the folder's recent files and the main keys.

There are no editor tabs: the files you worked on recently are one keystroke away through Quick Open, the switcher, File ▸ Open Recent and Go ▸ Back / Forward (⌃- / ⌃⇧-), which follow the browser's history.

### Keyboard

Keys follow VS Code where a browser allows it. The sheet (`?`) lists every key for your platform and host; these are the ones to learn first:

| Action                                                       | macOS                           | Windows / Linux                              |
| ------------------------------------------------------------ | ------------------------------- | -------------------------------------------- |
| Go to file / command palette                                 | ⌘P / ⇧⌘P (or F1)                | Ctrl+P / Ctrl+Shift+P (or F1)                |
| Switch to recent file                                        | ⌃\` (desktop app: ⌃Tab)         | Ctrl+\` (desktop app: Ctrl+Tab)              |
| Back / forward                                               | ⌃- / ⌃⇧-                        | Alt+← / Alt+→                                |
| Save / save all                                              | ⌘S / ⌥⌘S                        | Ctrl+S / Ctrl+K S                            |
| New file / close file                                        | ⌥⌘N / ⌃W (desktop app: ⌘N / ⌘W) | Alt+N / Alt+W (desktop app: Ctrl+N / Ctrl+W) |
| Toggle Explorer / code pane                                  | ⌘B / ⌘\                         | Ctrl+B / Ctrl+\                              |
| Show view 1, 2, 3                                            | ⌘K 1, ⌘K 2, ⌘K 3                | Ctrl+K 1, Ctrl+K 2, Ctrl+K 3                 |
| Run now                                                      | ⌘↵                              | Ctrl+Enter                                   |
| Reveal the value under the cursor in Output                  | ⇧⌥V                             | Shift+Alt+V                                  |
| Next changed file                                            | ⌥F5                             | Alt+F5                                       |
| Focus Explorer / code / output                               | ⇧⌘E / ⌘1 / ⌘2                   | Ctrl+Shift+E / Ctrl+1 / Ctrl+2               |
| Next part (the way out of the editor)                        | F6                              | F6                                           |
| Menubar (focuses File; ↓ or ↵ opens it)                      | F10                             | F10, or tap Alt                              |
| Copy relative path (`:line` or `:start-end` from the editor) | ⌘K P                            | Ctrl+K P                                     |

On an Output card, `e` jumps to its code, ↵ zooms and Space collapses. Bare keys never trigger commands, so typing `p`, `?`, `[` or ⌥-characters such as `ß` in the editor or an input is always text.

**Deliberate differences from VS Code:** Enter in the Explorer opens the file (VS Code on macOS renames); there are no editor tabs, so ⌃\` is the recent-files switcher (VS Code's terminal key); ⌘K P copies the relative path; in a browser tab Close File is ⌃W / Alt+W, because the browser keeps ⌘W.

**Keys still to verify by hand.** The e2e harness sends keys to the page through the DevTools protocol, past the browser's own shortcuts, so it tests Studio's dispatcher but not whether a browser lets a key through. Not yet checked in a real window: Chrome, Safari and Firefox capture of ⌘1/⌘2, ⌃\`, F6, F10, ⌃- and Alt+←/→ (Windows and Linux Chrome must not navigate away); tapping Alt on Windows; Firefox's Ctrl+Shift+E and ⌘B / Ctrl+B (its bookmarks sidebar); Alt+N and Alt+W in Windows Chrome and Firefox; in the macOS desktop app, that ⌘S, ⌘B, ⌘P and ⇧⌘P act exactly once, ⌘W closes the shown file, ⌃Tab cycles, the native menu's checkmarks follow the state, Edit ▸ Undo works when clicked with the editor focused, and accelerators work while DevTools has focus. Please report what you find.

### Autosave, conflicts and changes on disk

- **Autosave** writes about 1 s after you stop typing, and at once when the window loses focus, the page is hidden or closed, or you switch files or folders (File ▸ Auto Save, or `files.autoSave`: `afterDelay`, `onFocusChange` or `off`). Invalid `.json` is never autosaved.
- **Nothing is overwritten silently.** Every save says which version of the file it is based on; if the file changed on disk in the meantime (an agent wrote it between two keystrokes), the save is refused and a banner offers **Reload from disk** or **Overwrite with my edits**. If the other program changes the file back, the banner goes away. A file deleted on disk while open shows **Save to recreate** or **Close**.
- **Changes made elsewhere** to a file you haven't edited are applied in place: the cursor, selection, scroll and your undo history stay, and ⌘Z doesn't undo the other program's change. Files that import a changed file re-run.
- **Changed on disk** (the Explorer's pinned list, Go ▸ Changed on Disk and the status bar) lists files other programs changed, newest first; ⌥F5 walks through them. Studio's own writes never appear there.
- **Follow changes** (the status bar item, ⌘K F, `squiggle.followChanges`) shows a file when another program changes it, but never while you are typing or clicking (3 s), with a menu, overlay or input focused, while the shown file has unsaved edits, or when more than three files change within a second; the status bar then says "Agent edited …".
- **Folders:** if another window switches the server to another folder while this one has unsaved edits, a banner offers to switch back or discard; a moved or deleted folder shows "Folder missing" and saves are blocked until it is back. After the server restarts or the laptop wakes, Studio reconnects and re-checks every open file.

### Imports and Squiggle Hub

- Relative imports, `import "./lib/costs.squiggle" as costs`, resolve against the importing file and never leave the open folder.
- `import "hub:owner/slug" as model` is fetched through the local server from Squiggle Hub (cached for a minute).
- File ▸ Import from Squiggle Hub… downloads a Hub model into the folder.

## Relative values

Files with a top-level [relative values](../relative-values/README.md) spec get a **Relative values** view: a dashboard (from `@quri/squiggle-relative-values`) with **List**, **Grid** and **Plot** tabs in the editor header. A spec is a dict like

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

- The variable doesn't need to be exported. With several specs, a picker in the toolbar chooses one.
- The spec and tab are remembered per file. While you type, the dashboard keeps its results and swaps them 600 ms after the last run (or on save); edits to comments and whitespace recompute nothing.
- A spec with a mistake keeps the view and shows what's wrong; failed comparisons show as error cells.
- Clicking a value in the List view opens a sidebar with charts for that pair (a drawer below 900 px).
- Run ▸ Copy for Agent ▸ Relative Values as CSV copies the matrix; `squiggle-studio rv` prints it without a browser.

Examples are in [`examples/relative-values/`](./examples/relative-values).

## For agents

Everything an agent needs works from a shell, with JSON on stdout and exit codes that reflect errors. Numbers come from JSON, not from pixels; PNGs are for checking that something looks right.

| Need                        | Command                                                                                                                                                                                                                                                                                                                                                                                                                                          |
| --------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| A model's values and errors | `squiggle-studio run <file> --json`: squiggle's `RunJson` (`ok`, `result`, `bindings`, `errors` with `kind`, `message`, `location`, `importChain`, `hints`) plus a `studio` block (`root`, `file`, `codeHash`, `environment`, `imports`, `warnings`, `views`, `relativeValues`, `hidden`). Same import rules and seed as the UI. `--only total,costs.labor` keeps the output small. Exit 0 ok, 1 model error, 2 usage or file error, 124 timeout |
| A relative values matrix    | `squiggle-studio rv <file> --format csv [--variable name]`, or the bundle JSON (default; `--unit id` adds the List view)                                                                                                                                                                                                                                                                                                                         |
| A picture of any view       | `squiggle-studio render <file> --json --scale 1 [--view relative-values --tab grid] [--variable x] [--layout list]`; `--url '<link copied from Studio>'` renders exactly that view. `--json` prints `{ok, out, width, height, view, errors, studioErrors, consoleErrors, timeMs}`; exit 1 when the model, spec, view, tab or variable has a problem (the PNG is still written). `--port` picks the temporary server's port                       |
| What the user is looking at | Run ▸ Copy for Agent ▸ Context (the file, view, link, run and render commands and the run's status), or Link to Current View; the address bar always encodes the current view                                                                                                                                                                                                                                                                    |
| Point the user at something | A link: `http://127.0.0.1:4321/?file=models%2Ffruit.squiggle&view=relative-values&tab=grid&variable=fruit`                                                                                                                                                                                                                                                                                                                                       |

`--root` defaults to the current directory when the file is inside it, else the file's folder, so run commands from the project root for `../` imports to resolve. `SQUIGGLE_HUB_URL` points `hub:` imports at another Hub.

Working on files the user has open: Studio autosaves about 1 s after typing stops and on blur, so if an edit fails with "file modified since read", re-read the file (the user's edits are on disk). Studio never overwrites a change it hasn't seen. Files you create or change appear in the Explorer's Changed on disk list, and open by themselves only when the user has turned on Follow (status bar).

Driving Studio itself (QA, scripted checks): elements have stable test ids (`src/shared/testIds.ts`) and ARIA roles, `await window.squiggleStudio.whenIdle()` waits until the page has settled, and `window.squiggleStudio` also offers `commands.list()`, `commands.run(id, args)`, `getState()`, `getRunJson()` (the shown file's last run, the same JSON as `run --json`), `getRvMatrix()` and `flush()`. See [CLAUDE.md](./CLAUDE.md) and [e2e/README.md](./e2e/README.md).

The Squiggle Claude Code plugin (`claude-plugin/` at the repo root) has a `studio` skill that launches Studio and explains these commands.

## Settings and state

Studio keeps everything outside your project, in `~/.squiggle-studio/`:

| File            | What                                                                                                                                                                                                                                                                                                                                                                                    |
| --------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `settings.json` | Your settings, shared by every window and tab (also hand-editable): `files.autoSave` (`afterDelay`, `onFocusChange`, `off`), `files.autoSaveDelay` (ms, 200–60000, default 1000), `explorer.openOnArrow` (default true), `squiggle.followChanges` (default false), `squiggle.autorun` (default true). If the file doesn't parse, Studio uses the defaults, says so, and never writes it |
| `state.json`    | UI state: the layout (Explorer width and visibility, code pane, Output layout) and, per folder, the shown file, recent files, the view per file and the relative values tab and spec. A browser tab and the desktop app on the same folder share it. The 50 most recently used folders are kept                                                                                         |
| `recent.json`   | Recent folders                                                                                                                                                                                                                                                                                                                                                                          |

Settings changed in one window apply in the others right away; layout changes apply when the other window regains focus. With `--allow-network`, the state and settings routes are disabled and each browser keeps its own copy in localStorage.

## Development

```sh
pnpm dev          # tsx + Vite middleware with HMR, serving ./examples
pnpm build        # tsc (server/CLI -> dist/) + vite build (client -> dist/client)
pnpm start        # the built version, serving ./examples
pnpm test         # vitest unit tests (no browser)
pnpm lint         # prettier, then the client and e2e typechecks
pnpm e2e          # headless-Chrome scenarios (see e2e/README.md); --strict also fails on contrast
pnpm e2e:shoot    # screenshots of every scenario's state and a contact sheet in e2e-out/
pnpm e2e:serve    # a fixture server for manual or agent driving
pnpm e2e:golden   # regenerate the run JSON golden files
```

`squiggle-studio --dev` runs the client through Vite instead of `dist/client`.

## Architecture

- `src/server/`: a `node:http` server with no framework. `files.ts` (hashing, atomic queued writes, the tree walk), `watcher.ts` (`fs.watch({ recursive: true })`, debounced, with per-file events for folder renames), `userState.ts` (`state.json`, `settings.json`), `runner.ts` and `linker.ts` (running files in Node with the UI's import rules, for the CLI).
- `src/shared/`: zod schemas and types shared by the server and client (`api.ts`), the command manifest (`commands/`), paths, settings, test ids and the URL's view state.
- `src/client/`: a Vite + React + Tailwind app using `@quri/squiggle-components` and `@quri/ui`. `commands/` holds the command registry, `when` clauses, focus regions and the key dispatcher; `lib/useWorkspace.ts` is the workspace model (working set, history, autosave, sync); `components/` the shell; `views/` the Output, Relative values and Playground views.
- `src/cli/`: the `squiggle-studio` command and its `run`, `rv` and `render` subcommands.

Every command is declared once in the manifest (`src/shared/commands/`): its title, keys per platform and host, `when` clause, precondition and place in the menus. The menubar, palette, shortcut sheet, tooltips and the desktop app's native menu are built from it, and components register handlers with `useCommand`.

### Security model

Studio has no authentication: whoever can talk to the server can read and write files in the open folder. It relies on only being reachable from this machine:

- It binds `127.0.0.1` by default. A non-loopback `--host` (e.g. `0.0.0.0`) is refused unless you also pass `--allow-network` (`allowNetwork: true`), which prints a warning and disables opening other folders (`POST /api/root`, `GET /api/browse`), the recent folders and the state and settings routes, so network clients are confined to the folder you started it with.
- Websites can't use it from your browser: the server rejects foreign `Host` headers (DNS rebinding; in network mode, IP-literal hosts are also accepted) and requires an `x-squiggle-studio: 1` header on API calls, which cross-origin pages can't send without a CORS preflight that is never approved.
- All file paths are canonical POSIX paths relative to the open folder and go through `resolveSafePath`, which rejects absolute paths, `..`, NUL bytes, hidden files and folders (`.env`, `.git/…`, also through symlinks), ignored dirs (`node_modules`, `dist`, …, in any letter case) and symlinks pointing outside the root. Only `.squiggle`, `.json` and `.md` files can be read, written or renamed. Malformed request targets get a 400.

### HTTP API

| Route                                                   | Description                                                                                                                                                                            |
| ------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `GET /api/root`                                         | `{ root, name, allowOpenFolder }`                                                                                                                                                      |
| `POST /api/root` `{ path }`                             | open another folder (an absolute path, or `~/…`)                                                                                                                                       |
| `GET /api/tree`                                         | `{ tree, truncated, skipped }` (at most 5000 files and 2000 folders; `skipped`: folders that couldn't be read)                                                                         |
| `GET /api/file?path=`                                   | `{ path, content, mtimeMs, hash }`                                                                                                                                                     |
| `PUT /api/file` `{ path, content, create?, baseHash? }` | write atomically → `{ path, mtimeMs, hash }`; 409 `disk-changed` with `current: { exists, content?, hash? }` when the file's hash isn't `baseHash`; `create: true` → 409 `file-exists` |
| `POST /api/file/rename` `{ from, to }`                  | rename or move → `{ from, to, hash }`; 409 `file-exists`                                                                                                                               |
| `POST /api/hashes` `{ paths }`                          | the current hash of up to 200 files (`null`: missing)                                                                                                                                  |
| `GET /api/recent`                                       | recent folders (`[]` in network mode)                                                                                                                                                  |
| `GET /api/browse?path=`                                 | subfolders, for the folder picker                                                                                                                                                      |
| `GET /api/hub/source?owner&slug`                        | a Hub model's source                                                                                                                                                                   |
| `POST /api/hub/import` `{ id, path?, overwrite? }`      | import `owner/slug` into the folder → `{ path, hash }`; nothing is written if the request is aborted                                                                                   |
| `GET /api/state?root=`, `PATCH /api/state`              | UI state (`{ global, root }`; PATCH merges per key)                                                                                                                                    |
| `GET /api/settings`, `PUT /api/settings` `{ patch }`    | settings (`{ settings, path, error? }`; 409 `settings-invalid` while the file doesn't parse)                                                                                           |
| `GET /api/events`                                       | SSE: `file-changed { root, path, exists, hash? }`, `tree-changed { root }`, `root-changed { root }`, `root-missing { root }`, `settings-changed`                                       |

Hashes are sha256, hex, the first 32 characters (`""` for files over 5 MB); `<html data-studio-disk-hash>` and `run --json`'s `studio.codeHash` use the same hash. Errors are `{ error, code? }` with a non-2xx status; codes include `root-changed`, `file-exists`, `disk-changed`, `settings-invalid`, `non-canonical-path` (with `canonical`) and `root-missing` (410). The client sends `x-squiggle-studio-root: <encodeURIComponent(root)>` on tree, file and Hub requests; if the server has switched to another folder since, it answers 409 `{ code: "root-changed", root }` instead of touching the new folder. Requests without the header (e.g. `curl`) skip this check.

### Programmatic server (e.g. for Electron)

```ts
import { startStudioServer } from "@quri/squiggle-studio";

const server = await startStudioServer({
  root: "/path/to/folder",
  port: 0, // 0 = random free port; default 4321 (tries the next ports if busy)
  // host, allowNetwork, strictPort, dev, clientDir, recentFile, stateDir,
  // trackRecent, hubUrl, allowOpenFolder
});
server.url; // "http://127.0.0.1:54321"
await server.openFolder("/another/folder"); // clients get a root-changed event
await server.close();
```

The package also exports the command manifest (`STUDIO_COMMANDS`, `STUDIO_MENUS`, `bindingsFor`, `keyForPlatform`, `toElectronAccelerator`, `menuStateSchema`), which the desktop app uses for its native menu.

### Adding views

Views appear in the view switcher next to Output, Relative values and Playground (`src/client/views/RelativeValuesView.tsx` is a built-in example). Register them in `src/client/main.tsx` before rendering:

```tsx
import { registerStudioView } from "./views/index.js";

registerStudioView({
  id: "my-view",
  label: "My view",
  isAvailable: ({ runOutput }) => runOutput?.output.result.ok ?? false,
  render: ({ runOutput }) => <MyView output={runOutput?.output} />,
  renderToolbar: (context) => <MyToolbar />, // optional, in the editor header
});
```

See `src/client/views/types.ts` for `StudioView`, `StudioViewContext` and `StudioRunOutput`. `runOutput` is computed by Studio for the current editor buffer (including unsaved edits).

### URL parameters

`?file=path.squiggle&view=output|relative-values|split&tab=list|grid|plot&variable=name&layout=cards|list&code=0|1` opens a file in a view. Outside embed mode these are the initial state only (`variable` reveals that card once), and from then on the address bar follows what you do, so it can be copied as a link. `&embed=1` hides the chrome and makes the parameters authoritative (`variable` then shows only that variable, or picks the relative values spec); `render` uses it.
