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

- **Native menus from Studio's command manifest.** The application menu is built from the same `STUDIO_MENUS` trees as the browser's in-app menubar (`packages/studio/src/shared/commands/menus.ts`), so File, Edit, View, Go, Run and Help have the same items, titles and shortcuts in both. The in-app menubar is hidden in the desktop app (`?menubar=1` shows it, for screenshots). macOS also gets the app menu (About, Services, Hide, Quit) and Window menu; Windows and Linux get File ▸ Exit and `&` mnemonics.
- **Menu state from the page.** Items the page handles (Save, the view switcher, Explorer, Follow Changes, …) are enabled, checked and filled in (Open Recent's files, Go ▸ Changed on Disk, the views) from the focused window's state, which its page pushes through the preload (debounced 150 ms). Until a window has reported, those items are disabled. Choosing one sends the command to that window's page; a key shortcut that reached the native menu runs only where the command's key binding applies (F2 in the code editor doesn't rename).
- **Main-process items**: New Window (⇧⌘N / Ctrl+Shift+N), Open Folder… (⌘O / Ctrl+O), Open File… (no shortcut; opens the containing folder and shows the file via `?file=`), recent folders under File ▸ Open Recent (from `~/.squiggle-studio/recent.json`, shared with the CLI), Close Window (⇧⌘W / Ctrl+Shift+W), Toggle Developer Tools, Full Screen, zoom, and Help ▸ Reload Window (⌘R / Ctrl+Shift+R in development builds only). ⌘W / Ctrl+W closes the shown file, not the window.
- Keyboard shortcuts: on macOS, Chromium offers key equivalents to the page first, so a key acts once; Studio's registry also drops a menu call that arrives within 100 ms of the same key. On Windows and Linux, page-handled items only display their shortcut (`registerAccelerator: false`) and the page handles the key. Keys CodeMirror handles (⌘F, ⌘/, ⇧⌥F) are never registered natively.
- Window bounds are remembered (`<userData>/window-state.json`).
- Unsaved edits trigger a "Discard changes?" prompt when closing or switching. Before opening another folder or file in a window, the main process asks the page (`window.squiggleStudio.hasUnsavedChanges()`), so "Cancel" leaves the current folder open; if the page can't answer, the page's `beforeunload` prompt is the fallback.

## Security

- `contextIsolation: true`, `nodeIntegration: false`, `sandbox: true`, `webviewTag: false`.
- A small sandboxed preload (`src/preload.cts` → `dist/preload.cjs`, CommonJS, requires only `electron`) exposes `window.studioHost` with two functions, `onCommand(cb)` and `setMenuState(state)`, plus `kind` and `platform`. The page still has no Node access. The main process accepts menu state only from a frame on that window's own server origin and only in the shared zod schema (`menuStateSchema`), and sends the page only manifest command ids it handles (`src/bridge.ts`).
- Navigation is limited to the window's own server origin; other links open in the default browser (`http(s):`/`mailto:` only), and `window.open` is always denied.
- All requests except to our local servers (and `data:`/`blob:`) are cancelled, and pages get a strict Content-Security-Policy (`connect-src 'self'`). Squiggle Hub imports go through the local server, as in the browser version.
- All permission requests (camera, notifications, …) are denied.

## Tests

`pnpm test` runs vitest with the `electron` module mocked (no Electron binary needed): `test/menu.test.ts` builds the menu template for macOS, Windows and Linux from the manifest (snapshots; every menu node maps to an item; no two commands share an accelerator; chords get none; main-process items keep registered accelerators; Electron's own bindings are the ones shown) and `test/bridge.test.ts` checks the menu-state validator and the command messages. `pnpm lint` also type-checks the tests.

## Not done

Packaging (electron-builder), code signing and an app icon. File associations for `.squiggle` only work once the app is packaged with a matching `Info.plist`.
