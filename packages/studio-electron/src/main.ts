import { app, BrowserWindow, dialog, session } from "electron";
import { z } from "zod";

import { defaultRecentFile, loadRecentFolders } from "@quri/squiggle-studio";

import { log } from "./log.js";
import { buildMenu, type MenuActions } from "./menu.js";
import { type OpenTarget, resolveTarget, targetsFromArgv } from "./target.js";
import {
  allowedOrigins,
  createStudioWindow,
  findStudioWindow,
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
    await focused.open(target);
    focused.win.focus();
  },
  async newWindow() {
    const target = await defaultTarget();
    if (target) await openInNewWindow(target);
  },
};

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
const argvTargets = targetsFromArgv(process.argv, app.isPackaged);

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

  // Folders opened from the in-app picker update recent.json; keep the
  // Open Recent menu in sync.
  app.on("browser-window-focus", () => void buildMenu(actions));

  app.on("activate", () => {
    if (ready && studioWindows().length === 0) void actions.newWindow();
  });

  app.on("will-quit", () => log("quitting"));

  void app.whenReady().then(async () => {
    hardenSession();
    await buildMenu(actions);
    ready = true;

    const targets = [...pendingTargets, ...argvTargets];
    if (targets.length === 0) {
      const target = await defaultTarget();
      if (target) targets.push(target);
    }
    for (const target of targets) await openInNewWindow(target);
    // Recent folders changed by opening windows.
    await buildMenu(actions);

    if (studioWindows().length === 0 && process.platform !== "darwin") {
      app.quit();
    }
  });
}
