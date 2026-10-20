import path from "node:path";

import { app, BrowserWindow, dialog, shell, type WebContents } from "electron";

import {
  type MenuState,
  startStudioServer,
  type StudioServer,
} from "@quri/squiggle-studio";

import { runInPage } from "./bridge.js";
import { log } from "./log.js";
import type { OpenTarget } from "./target.js";
import { initialBounds, saveWindowState } from "./windowState.js";

// One Studio server per window: each window has its own open folder, and
// closing the window shuts its server down.
export type StudioWindow = {
  win: BrowserWindow;
  server: StudioServer;
  origin: string; // the server's origin: the only one this window loads
  // The native menu's state, as the page last reported it (bridge.ts).
  menuState?: MenuState;
  open: (target: OpenTarget) => Promise<void>;
};

// The sandboxed preload that exposes `window.studioHost` (preload.cts).
const PRELOAD = path.join(import.meta.dirname, "preload.cjs");

const windows = new Set<StudioWindow>();

// Origins of all running Studio servers; the only origins windows may load.
export function allowedOrigins(): Set<string> {
  return new Set([...windows].map((w) => new URL(w.server.url).origin));
}

export function studioWindows(): StudioWindow[] {
  return [...windows];
}

export function findStudioWindow(
  win: BrowserWindow | null | undefined
): StudioWindow | undefined {
  return win ? [...windows].find((w) => w.win === win) : undefined;
}

export function findStudioWindowByContents(
  contents: WebContents
): StudioWindow | undefined {
  return [...windows].find((w) => w.win.webContents === contents);
}

function isExternalUrl(url: string): boolean {
  const protocol = new URL(url).protocol;
  return (
    protocol === "https:" || protocol === "http:" || protocol === "mailto:"
  );
}

function openExternally(url: string) {
  if (isExternalUrl(url)) void shell.openExternal(url);
}

function appUrl(server: StudioServer, file: string | undefined): string {
  const url = new URL(server.url);
  if (file) url.searchParams.set("file", file);
  return url.toString();
}

// loadURL rejects with ERR_ABORTED when the navigation is cancelled, e.g. by
// "Cancel" in the unsaved-changes prompt below, or superseded by another one.
function isAbortError(e: unknown): boolean {
  return e instanceof Error && "code" in e && e.code === "ERR_ABORTED";
}

async function loadUrl(win: BrowserWindow, url: string): Promise<void> {
  try {
    await win.loadURL(url);
  } catch (e) {
    if (!isAbortError(e)) throw e;
    log(`navigation to ${url} aborted`);
  }
}

// The client exposes `window.squiggleStudio.hasUnsavedChanges()`. If the
// page can't answer (not loaded, older client), assume nothing is unsaved;
// the beforeunload prompt is still there as a fallback.
async function hasUnsavedChanges(contents: WebContents): Promise<boolean> {
  try {
    const dirty = await runInPage(
      contents,
      "window.squiggleStudio?.hasUnsavedChanges?.() ?? false"
    );
    return dirty === true;
  } catch (e) {
    log(`couldn't check for unsaved changes: ${String(e)}`);
    return false;
  }
}

export async function createStudioWindow(
  target: OpenTarget
): Promise<StudioWindow> {
  const server = await startStudioServer({
    root: target.folder,
    host: "127.0.0.1",
    port: 0,
    strictPort: true,
  });
  const origin = new URL(server.url).origin;
  log(`server for ${server.getRoot()} listening at ${server.url}`);

  const bounds = initialBounds(windows.size);
  const win = new BrowserWindow({
    x: bounds.x,
    y: bounds.y,
    width: bounds.width,
    height: bounds.height,
    minWidth: 480,
    minHeight: 360,
    title: "Squiggle Studio",
    show: false,
    webPreferences: {
      preload: PRELOAD,
      contextIsolation: true,
      nodeIntegration: false,
      nodeIntegrationInWorker: false,
      sandbox: true,
      webSecurity: true,
      allowRunningInsecureContent: false,
      webviewTag: false,
      spellcheck: false,
    },
  });
  if (bounds.maximized) win.maximize();

  const studioWindow: StudioWindow = {
    win,
    server,
    origin,
    async open(next) {
      // Ask before switching: once the server's root changes, unsaved buffers
      // would belong to the wrong folder, so "Cancel" in the beforeunload
      // prompt (triggered by the reload below) would come too late.
      const switching = next.folder !== server.getRoot();
      if (await hasUnsavedChanges(win.webContents)) {
        const { response } = await dialog.showMessageBox(win, {
          type: "question",
          buttons: ["Discard changes", "Cancel"],
          defaultId: 1,
          cancelId: 1,
          message: "You have unsaved changes.",
          detail: `Discard them and open ${switching ? next.folder : (next.file ?? "the folder again")}?`,
        });
        if (response !== 0) return;
        // So that the reload doesn't prompt again.
        await runInPage(
          win.webContents,
          "window.squiggleStudio?.discardChanges?.()"
        ).catch((e: unknown) => log(`discardChanges failed: ${String(e)}`));
      }
      if (switching) {
        await server.openFolder(next.folder);
        app.addRecentDocument(next.folder);
      }
      // Reloading with ?file= selects the file.
      await loadUrl(win, appUrl(server, next.file));
    },
  };
  windows.add(studioWindow);

  const contents = win.webContents;

  // Navigation stays on this window's server; everything else goes to the
  // default browser.
  contents.on("will-navigate", (event, url) => {
    if (new URL(url).origin !== origin) {
      event.preventDefault();
      openExternally(url);
    }
  });
  contents.on("will-redirect", (event, url) => {
    if (new URL(url).origin !== origin) event.preventDefault();
  });
  contents.setWindowOpenHandler(({ url }) => {
    openExternally(url);
    return { action: "deny" };
  });
  contents.on("will-attach-webview", (event) => event.preventDefault());

  // The client warns about unsaved edits via beforeunload; Electron ignores
  // that silently unless we ask.
  contents.on("will-prevent-unload", (event) => {
    const choice = dialog.showMessageBoxSync(win, {
      type: "question",
      buttons: ["Discard changes", "Cancel"],
      defaultId: 1,
      cancelId: 1,
      message: "You have unsaved changes.",
      detail: "Discard them and continue?",
    });
    if (choice === 0) event.preventDefault();
  });

  contents.on("did-finish-load", () => log(`loaded ${contents.getURL()}`));
  contents.on("did-fail-load", (_event, code, description, url) => {
    log(`failed to load ${url}: ${description} (${code})`);
  });
  contents.on("console-message", (details) => {
    log(`[renderer ${details.level}] ${details.message}`);
  });
  contents.on("render-process-gone", (_event, details) => {
    log(`renderer gone: ${details.reason}`);
  });
  if (process.platform === "darwin") {
    // Proxy icon in the title bar for the open folder.
    contents.on("page-title-updated", () => {
      win.setRepresentedFilename(server.getRoot());
    });
  }

  win.once("ready-to-show", () => win.show());
  win.on("close", () => saveWindowState(win));
  win.on("closed", () => {
    windows.delete(studioWindow);
    void server.close();
  });

  app.addRecentDocument(server.getRoot());
  await loadUrl(win, appUrl(server, target.file));
  return studioWindow;
}
