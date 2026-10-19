import { app, BrowserWindow, dialog, shell } from "electron";

import { startStudioServer, type StudioServer } from "@quri/squiggle-studio";

import { log } from "./log.js";
import type { OpenTarget } from "./target.js";
import { initialBounds, saveWindowState } from "./windowState.js";

// One Studio server per window: each window has its own open folder, and
// closing the window shuts its server down.
export type StudioWindow = {
  win: BrowserWindow;
  server: StudioServer;
  open: (target: OpenTarget) => Promise<void>;
};

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
    async open(next) {
      if (next.folder !== server.getRoot()) {
        await server.openFolder(next.folder);
        app.addRecentDocument(next.folder);
      }
      // Reloading with ?file= selects the file. If there are unsaved edits,
      // the page's beforeunload handler triggers the prompt below.
      await win.loadURL(appUrl(server, next.file));
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
  await win.loadURL(appUrl(server, target.file));
  return studioWindow;
}
