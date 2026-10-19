import os from "node:os";
import path from "node:path";

import {
  app,
  type BaseWindow,
  BrowserWindow,
  dialog,
  Menu,
  type MenuItemConstructorOptions,
  shell,
} from "electron";

import {
  defaultRecentFile,
  loadRecentFolders,
  type RecentFolder,
} from "@quri/squiggle-studio";

import type { OpenTarget } from "./target.js";
import { resolveTarget } from "./target.js";

export type MenuActions = {
  // Opens a target in the focused window (or a new one if none is open).
  open: (target: OpenTarget) => Promise<void>;
  newWindow: () => Promise<void>;
};

function displayPath(folder: string): string {
  const home = os.homedir();
  return folder.startsWith(home + path.sep)
    ? "~" + folder.slice(home.length)
    : folder;
}

function browserWindow(win: BaseWindow | undefined): BrowserWindow | undefined {
  return win instanceof BrowserWindow ? win : undefined;
}

async function pickPath(
  win: BrowserWindow | undefined,
  kind: "folder" | "file"
): Promise<string | undefined> {
  const options: Electron.OpenDialogOptions =
    kind === "folder"
      ? {
          title: "Open Folder",
          properties: ["openDirectory", "createDirectory"],
        }
      : {
          title: "Open File",
          properties: ["openFile"],
          filters: [
            { name: "Squiggle", extensions: ["squiggle"] },
            { name: "All Files", extensions: ["*"] },
          ],
        };
  const result = win
    ? await dialog.showOpenDialog(win, options)
    : await dialog.showOpenDialog(options);
  return result.canceled ? undefined : result.filePaths[0];
}

function recentItems(
  recent: RecentFolder[],
  actions: MenuActions,
  rebuild: () => Promise<void>
): MenuItemConstructorOptions[] {
  if (recent.length === 0) {
    return [{ label: "No Recent Folders", enabled: false }];
  }
  return [
    ...recent.map(
      (folder): MenuItemConstructorOptions => ({
        label: displayPath(folder.path),
        click: () => {
          const target = resolveTarget(folder.path);
          if (!target) {
            dialog.showErrorBox(
              "Folder not found",
              `${folder.path} no longer exists.`
            );
            return;
          }
          void actions.open(target).then(rebuild);
        },
      })
    ),
    { type: "separator" },
    { label: "Refresh List", click: () => void rebuild() },
  ];
}

export async function buildMenu(actions: MenuActions): Promise<void> {
  const rebuild = () => buildMenu(actions);
  const recent = await loadRecentFolders(defaultRecentFile());
  const isMac = process.platform === "darwin";

  const openPicked = async (
    win: BaseWindow | undefined,
    kind: "folder" | "file"
  ) => {
    const picked = await pickPath(browserWindow(win), kind);
    if (!picked) return;
    const target = resolveTarget(picked);
    if (target) await actions.open(target);
    await rebuild();
  };

  const template: MenuItemConstructorOptions[] = [
    ...(isMac ? [{ role: "appMenu" } as MenuItemConstructorOptions] : []),
    {
      label: "File",
      submenu: [
        {
          label: "New Window",
          accelerator: "CmdOrCtrl+Shift+N",
          click: () => void actions.newWindow(),
        },
        { type: "separator" },
        {
          label: "Open Folder…",
          accelerator: "CmdOrCtrl+O",
          click: (_item, win) => void openPicked(win, "folder"),
        },
        {
          label: "Open File…",
          accelerator: "CmdOrCtrl+Shift+O",
          click: (_item, win) => void openPicked(win, "file"),
        },
        {
          label: "Open Recent",
          submenu: recentItems(recent, actions, rebuild),
        },
        { type: "separator" },
        isMac ? { role: "close" } : { role: "quit" },
      ],
    },
    { role: "editMenu" },
    {
      label: "View",
      submenu: [
        { role: "reload" },
        { role: "forceReload" },
        { role: "toggleDevTools" },
        { type: "separator" },
        { role: "resetZoom" },
        { role: "zoomIn" },
        { role: "zoomOut" },
        { type: "separator" },
        { role: "togglefullscreen" },
      ],
    },
    { role: "windowMenu" },
    {
      role: "help",
      submenu: [
        {
          label: "Squiggle Documentation",
          click: () => void shell.openExternal("https://squiggle-language.com"),
        },
        {
          label: "Squiggle Hub",
          click: () => void shell.openExternal("https://squigglehub.org"),
        },
      ],
    },
  ];

  Menu.setApplicationMenu(Menu.buildFromTemplate(template));

  if (isMac) {
    app.dock?.setMenu(
      Menu.buildFromTemplate([
        { label: "New Window", click: () => void actions.newWindow() },
      ])
    );
  }
}
