# Squiggle Studio (desktop)

A thin [Electron](https://www.electronjs.org/) wrapper around [Squiggle Studio](../studio). Each window starts its own in-process Studio server (`startStudioServer`) on a random port bound to `127.0.0.1` and shows it in a sandboxed `BrowserWindow`.

## Running

```sh
pnpm install
cd packages/studio-electron
pnpm dev                       # builds @quri/squiggle-studio if needed, compiles, opens ../studio/examples
pnpm build && pnpm start       # opens the most recent folder (or asks for one)
pnpm build:studio              # rebuild the Studio server + client after changing packages/studio

./bin/squiggle-studio-electron.js ./my-models           # open a folder
./bin/squiggle-studio-electron.js ./my-models/main.squiggle  # open a file (its folder + the file)
```

The Electron binary is downloaded on first launch (Electron 44 has no postinstall script). Launching again while the app is running opens the given paths as new windows in the running instance. On macOS, folders and `.squiggle` files can be opened via `open-file` (dock / Finder).

Set `SQUIGGLE_STUDIO_DEBUG=1` to log server URLs, page loads, renderer console messages and blocked requests in a packaged build (always on in development).

## Features

- **File → Open Folder…** (Cmd/Ctrl+O), **Open File…** (Cmd/Ctrl+Shift+O; opens the containing folder and selects the file via the client's `?file=` parameter), **Open Recent** (from `~/.squiggle-studio/recent.json`, shared with the CLI), **New Window** (Cmd/Ctrl+Shift+N).
- Standard Edit / View / Window menus; links to the docs and Squiggle Hub under Help.
- Window bounds are remembered (`<userData>/window-state.json`).
- Unsaved edits trigger a "Discard changes?" prompt when closing or switching. Before opening another folder or file in a window, the main process asks the page (`window.squiggleStudio.hasUnsavedChanges()`), so "Cancel" leaves the current folder open; if the page can't answer, the page's `beforeunload` prompt is the fallback.

## Security

- `contextIsolation: true`, `nodeIntegration: false`, `sandbox: true`, `webviewTag: false`, no preload script.
- Navigation is limited to the window's own server origin; other links open in the default browser (`http(s):`/`mailto:` only), and `window.open` is always denied.
- All requests except to our local servers (and `data:`/`blob:`) are cancelled, and pages get a strict Content-Security-Policy (`connect-src 'self'`). Squiggle Hub imports go through the local server, as in the browser version.
- All permission requests (camera, notifications, …) are denied.

## Not done

Packaging (electron-builder), code signing and an app icon. File associations for `.squiggle` only work once the app is packaged with a matching `Info.plist`.
