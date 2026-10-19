import { app, BrowserWindow, dialog, ipcMain, session } from "electron";
import { z } from "zod";

import { defaultRecentFile, loadRecentFolders } from "@quri/squiggle-studio";

import {
  MENU_STATE_CHANNEL,
  sendCommand,
  validateMenuState,
} from "./bridge.js";
import { log } from "./log.js";
import {
  type MenuActions,
  type MenuContext,
  requestMenuRebuild,
} from "./menu.js";
import { type OpenTarget, resolveTarget, targetsFromArgv } from "./target.js";
import {
  allowedOrigins,
  createStudioWindow,
  findStudioWindow,
  findStudioWindowByContents,
  studioWindows,
} from "./windows.js";

// Paths received via macOS `open-file` before the app was ready.
const pendingTargets: OpenTarget[] = [];
let ready = false;

async function openInNewWindow(target: OpenTarget): Promise<void> {
  try {
    await createStudioWindow(target);
  } catch (e) {
    dialog.showErrorBox(
      "Could not open folder",
      e instanceof Error ? e.message : String(e)
    );
  }
}

async function pickFolder(): Promise<OpenTarget | undefined> {
  const result = await dialog.showOpenDialog({
    title: "Open Folder",
    properties: ["openDirectory", "createDirectory"],
  });
  const picked = result.canceled ? undefined : result.filePaths[0];
  return picked ? resolveTarget(picked) : undefined;
}

// The folder of the focused window, else the most recent folder that still
// exists, else ask.
async function defaultTarget(): Promise<OpenTarget | undefined> {
  const focused = findStudioWindow(BrowserWindow.getFocusedWindow());
  if (focused) return { folder: focused.server.getRoot() };
  for (const recent of await loadRecentFolders(defaultRecentFile())) {
    const target = resolveTarget(recent.path);
    if (target && !target.file) return target;
  }
  return pickFolder();
}

const actions: MenuActions = {
  async open(target) {
    const focused =
      findStudioWindow(BrowserWindow.getFocusedWindow()) ?? studioWindows()[0];
    if (!focused) return openInNewWindow(target);
    try {
      await focused.open(target);
    } catch (e) {
      dialog.showErrorBox(
        "Could not open folder",
        e instanceof Error ? e.message : String(e)
      );
    }
    focused.win.focus();
  },
  async newWindow() {
    const target = await defaultTarget();
    if (target) await openInNewWindow(target);
  },
};

// The application menu shows the focused window's state (§3.5).
const menuContext: MenuContext = {
  actions,
  focused: () => findStudioWindow(BrowserWindow.getFocusedWindow()),
  find: (win) => findStudioWindow(win),
  send: (target, message) => {
    if (target.win.isDestroyed()) return;
    sendCommand(target.win.webContents, message);
  },
};
const rebuildMenu = () => void requestMenuRebuild(menuContext);

// Menu state pushed by a page through the preload: accepted only from the
// window's own server origin and in the shared schema.
function listenForMenuState() {
  ipcMain.on(MENU_STATE_CHANNEL, (event, payload: unknown) => {
    const studioWindow = findStudioWindowByContents(event.sender);
    if (!studioWindow) return;
    const result = validateMenuState(
      event.senderFrame?.url,
      studioWindow.origin,
      payload
    );
    if (!result.ok) {
      log(`ignored menu state: ${result.reason}`);
      return;
    }
    studioWindow.menuState = result.state;
    if (BrowserWindow.getFocusedWindow() === studioWindow.win) rebuildMenu();
  });
}

function hardenSession() {
  const ses = session.defaultSession;
  // No camera, notifications, geolocation, etc.
  ses.setPermissionRequestHandler((_wc, _permission, callback) =>
    callback(false)
  );
  ses.setPermissionCheckHandler(() => false);
  // No remote content: only our local servers (plus inline/devtools URLs).
  ses.webRequest.onBeforeRequest((details, callback) => {
    const url = new URL(details.url);
    const allowed =
      ["data:", "blob:", "devtools:"].includes(url.protocol) ||
      allowedOrigins().has(url.origin);
    if (!allowed) log(`blocked request to ${details.url}`);
    callback({ cancel: !allowed });
  });
  // Content-Security-Policy for pages served by our servers.
  ses.webRequest.onHeadersReceived((details, callback) => {
    if (!allowedOrigins().has(new URL(details.url).origin)) {
      callback({});
      return;
    }
    callback({
      responseHeaders: {
        ...details.responseHeaders,
        "Content-Security-Policy": [CONTENT_SECURITY_POLICY],
      },
    });
  });
}

const CONTENT_SECURITY_POLICY = [
  "default-src 'self'",
  "script-src 'self' 'wasm-unsafe-eval'",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob:",
  "font-src 'self' data:",
  "connect-src 'self'",
  "worker-src 'self' blob:",
  "object-src 'none'",
  "base-uri 'none'",
  "form-action 'none'",
  "frame-ancestors 'none'",
].join("; ");

// Folders/files passed on this process's command line.
const argvTargets = targetsFromArgv(process.argv, app.isPackaged, {
  appPath: app.getAppPath(),
});

// Sent from a second launch to the running instance. (Its raw argv is not
// reliable: Chromium inserts its own switches.)
const instanceDataSchema = z.object({
  targets: z.array(
    z.object({ folder: z.string(), file: z.string().optional() })
  ),
});

// One instance owns all windows; later launches forward their paths to it.
if (!app.requestSingleInstanceLock({ targets: argvTargets })) {
  app.quit();
} else {
  app.on("second-instance", (_event, _argv, _cwd, additionalData) => {
    const parsed = instanceDataSchema.safeParse(additionalData);
    const targets = parsed.success ? parsed.data.targets : [];
    if (targets.length === 0) {
      const existing = studioWindows()[0];
      if (existing) existing.win.focus();
      else void actions.newWindow();
    }
    for (const target of targets) void openInNewWindow(target);
  });

  // macOS: files/folders dropped on the dock icon or opened via Finder.
  app.on("open-file", (event, filePath) => {
    event.preventDefault();
    const target = resolveTarget(filePath);
    if (!target) return;
    if (ready) void openInNewWindow(target);
    else pendingTargets.push(target);
  });

  app.on("window-all-closed", () => {
    if (process.platform !== "darwin") app.quit();
  });

  // The menu follows the focused window's state; folders opened from the
  // in-app picker also update recent.json (Open Recent).
  app.on("browser-window-focus", rebuildMenu);
  // With no window left, page-handled items go back to disabled.
  app.on("browser-window-created", (_event, win) => {
    win.on("closed", rebuildMenu);
  });

  app.on("activate", () => {
    if (ready && studioWindows().length === 0) void actions.newWindow();
  });

  app.on("will-quit", () => log("quitting"));

  void app.whenReady().then(async () => {
    hardenSession();
    listenForMenuState();
    app.setAboutPanelOptions({
      applicationName: "Squiggle Studio",
      applicationVersion: app.getVersion(),
    });
    await requestMenuRebuild(menuContext);
    ready = true;

    const targets = [...pendingTargets, ...argvTargets];
    if (targets.length === 0) {
      const target = await defaultTarget();
      if (target) targets.push(target);
    }
    for (const target of targets) await openInNewWindow(target);
    // Recent folders changed by opening windows.
    await requestMenuRebuild(menuContext);

    if (studioWindows().length === 0 && process.platform !== "darwin") {
      app.quit();
    }
  });
}
