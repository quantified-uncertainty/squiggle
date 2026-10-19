// The native application menu (§3.5), built from the same manifest as the
// browser's in-app menubar (STUDIO_MENUS from @quri/squiggle-studio).
//
// - Page-handled ("renderer") items are enabled, checked and filled from the
//   focused window's menu state (pushed by its page through the preload);
//   until that window has reported, they are disabled. A click sends
//   "studio:command" {id, args, viaKey} to that window's page.
// - Main-process items (new window, the folder and file dialogs, recent
//   folders, close window, quit, DevTools, reload, full screen) run here.
// - Edit and zoom items are native roles (they make ⌘C / ⌘V / ⌘Z work in
//   inputs on macOS).
// - Accelerators come from the first Electron binding of each command
//   (toElectronAccelerator; chords get none). On Windows and Linux,
//   page-handled items only display theirs (`registerAccelerator: false`):
//   the page's own key dispatcher handles those keys.

import os from "node:os";
import path from "node:path";

import {
  app,
  BrowserWindow,
  dialog,
  type KeyboardEvent as ElectronKeyboardEvent,
  Menu,
  type MenuItemConstructorOptions,
} from "electron";

import {
  bindingsFor,
  type CommandSpec,
  defaultRecentFile,
  getCommand,
  isAvailableOnHost,
  type KeyBinding,
  loadRecentFolders,
  type MenuNode,
  type MenuState,
  type Platform,
  radioValue,
  STUDIO_MENUS,
  toElectronAccelerator,
} from "@quri/squiggle-studio";

import { type CommandMessage, commandMessage } from "./bridge.js";
import type { OpenTarget } from "./target.js";
import { resolveTarget } from "./target.js";

export type MenuActions = {
  // Opens a target in the focused window (or a new one if none is open).
  open: (target: OpenTarget) => Promise<void>;
  newWindow: () => Promise<void>;
};

// Commands the main process runs (owner "main", or electronOwner "main").
const MAIN_COMMANDS = [
  "workbench.action.newWindow",
  "workbench.action.files.openFolder",
  "workbench.action.files.openFile",
  "workbench.action.closeWindow",
  "workbench.action.quit",
  "workbench.action.toggleDevTools",
  "workbench.action.reloadWindow",
  "workbench.action.toggleFullScreen",
  "squiggle.openRecentFolder",
] as const;
export type MainCommand = (typeof MAIN_COMMANDS)[number];

function isMainCommand(id: string): id is MainCommand {
  return (MAIN_COMMANDS as readonly string[]).includes(id);
}

const DYNAMIC_LIMIT = 8;

export type MenuTemplateInput = {
  platform: NodeJS.Platform;
  isPackaged: boolean;
  appName: string;
  state: MenuState | undefined; // the focused window's; undefined until it reported
  recentFolders: readonly string[]; // absolute, most recent first
  currentRoot: string | undefined; // the focused window's folder
  home: string;
  now: number;
  sendToRenderer: (
    message: CommandMessage,
    win: BrowserWindow | undefined
  ) => void;
  runInMain: (
    id: MainCommand,
    args: { path: string } | undefined,
    win: BrowserWindow | undefined
  ) => void;
};

export function studioPlatform(platform: NodeJS.Platform): Platform {
  if (platform === "darwin") return "mac";
  if (platform === "win32") return "win";
  return "linux";
}

function keyFor(binding: KeyBinding, platform: Platform): string | undefined {
  if (platform === "mac") return binding.mac;
  if (platform === "linux") return binding.linux ?? binding.win;
  return binding.win;
}

// "~/models" for folders in the home directory.
export function displayPath(folder: string, home: string): string {
  if (folder === home) return "~";
  return folder.startsWith(home + path.sep)
    ? "~" + folder.slice(home.length)
    : folder;
}

function formatAgo(timestamp: number, now: number): string {
  const seconds = Math.max(0, Math.round((now - timestamp) / 1000));
  if (seconds < 5) return "just now";
  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.round(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  return `${Math.round(minutes / 60)}h ago`;
}

function browserWindow(win: unknown): BrowserWindow | undefined {
  return win instanceof BrowserWindow ? win : undefined;
}

// Drops leading, trailing and repeated separators (left by host filtering).
function tidy(
  items: MenuItemConstructorOptions[]
): MenuItemConstructorOptions[] {
  const out: MenuItemConstructorOptions[] = [];
  for (const item of items) {
    if (item.type === "separator") {
      if (!out.length || out[out.length - 1].type === "separator") continue;
    }
    out.push(item);
  }
  while (out.length && out[out.length - 1].type === "separator") out.pop();
  return out;
}

export function buildMenuTemplate(
  input: MenuTemplateInput
): MenuItemConstructorOptions[] {
  const platform = studioPlatform(input.platform);
  const mac = platform === "mac";
  const state = input.state;
  // Windows and Linux menus take "&" as a mnemonic marker.
  const text = (label: string) => (mac ? label : label.replace(/&/g, "&&"));
  const registered = new Set<string>();
  const separator: MenuItemConstructorOptions = { type: "separator" };

  const acceleratorOf = (
    spec: CommandSpec
  ): { accelerator: string; displayOnly: boolean } | undefined => {
    if (spec.id === "workbench.action.reloadWindow" && input.isPackaged) {
      return undefined; // ⌘R never reloads the packaged app by accident
    }
    const [binding] = bindingsFor(spec, platform, "electron");
    const key = binding && keyFor(binding, platform);
    const accelerator = key ? toElectronAccelerator(key, platform) : undefined;
    if (!accelerator) return undefined;
    // CodeMirror handles these keys (⌘F, ⌘/, ⇧⌥F): shown, never registered,
    // so the native menu can't take them from the editor or an input.
    const displayOnly =
      spec.owner !== "role" &&
      (binding.display === true || spec.owner === "codemirror");
    return { accelerator, displayOnly };
  };

  // A page-handled item: state from the menu state, click → the page.
  const rendererItem = (
    id: string,
    args: unknown,
    label: string,
    extra: { enabled?: boolean } = {}
  ): MenuItemConstructorOptions => ({
    label: text(label),
    enabled: state?.enabled[id] === true && extra.enabled !== false,
    click: (_item, win, event: ElectronKeyboardEvent) =>
      input.sendToRenderer(
        commandMessage(id, args, event.triggeredByAccelerator),
        browserWindow(win)
      ),
  });

  const commandItem = (
    menuId: string,
    spec: CommandSpec,
    args: unknown,
    title: string | undefined
  ): MenuItemConstructorOptions | undefined => {
    if (!isAvailableOnHost(spec, "electron")) return undefined;
    // On macOS, Quit is in the app menu.
    if (spec.id === "workbench.action.quit" && mac) return undefined;
    const label = title ?? spec.menuTitle ?? spec.title;
    const accelerator = acceleratorOf(spec);
    const itemId = `${menuId}/${spec.id}${args === undefined ? "" : JSON.stringify(args)}`;
    let item: MenuItemConstructorOptions;
    if (spec.owner === "role") {
      item = {
        role: spec.electronRole as MenuItemConstructorOptions["role"],
        label: text(label),
      };
    } else if (isMainCommand(spec.id)) {
      const id = spec.id;
      item = {
        label: text(label),
        click: (_item, win) =>
          input.runInMain(id, undefined, browserWindow(win)),
      };
    } else {
      item = rendererItem(spec.id, args, label);
      if (spec.toggled) {
        item.type = "checkbox";
        item.checked = state?.checked[spec.id] === true;
      } else if (spec.radio) {
        item.type = "radio";
        item.checked =
          state !== undefined &&
          state.radios[spec.radio.group] === radioValue(spec, args);
      }
      // The page dispatches these keys itself.
      if (!mac) item.registerAccelerator = false;
    }
    item.id = itemId;
    if (accelerator) {
      item.accelerator = accelerator.accelerator;
      if (accelerator.displayOnly) item.registerAccelerator = false;
      // A command listed twice (Go to File… in File and Go) registers once.
      if (item.registerAccelerator !== false) {
        if (registered.has(accelerator.accelerator)) {
          item.registerAccelerator = false;
        } else {
          registered.add(accelerator.accelerator);
        }
      }
    }
    return item;
  };

  const recentItems = (): MenuItemConstructorOptions[] => {
    const folders = input.recentFolders
      .filter((p) => p !== input.currentRoot)
      .slice(0, DYNAMIC_LIMIT);
    const files = (state?.recentFiles ?? []).slice(0, DYNAMIC_LIMIT);
    if (!folders.length && !files.length) {
      return [{ label: "No recent items", enabled: false }];
    }
    const out: MenuItemConstructorOptions[] = [];
    if (folders.length) {
      out.push({ label: "Folders", enabled: false });
      for (const folder of folders) {
        out.push({
          label: text(displayPath(folder, input.home)),
          click: (_item, win) =>
            input.runInMain(
              "squiggle.openRecentFolder",
              { path: folder },
              browserWindow(win)
            ),
        });
      }
    }
    if (files.length) {
      out.push({ label: "Files", enabled: false });
      for (const file of files) {
        const dir = path.posix.dirname(file);
        const name = path.posix.basename(file);
        out.push(
          rendererItem(
            "squiggle.openFile",
            { path: file },
            dir === "." ? name : `${name} · ${dir}`
          )
        );
      }
    }
    out.push(separator);
    out.push(
      rendererItem("squiggle.clearRecent", undefined, "Clear Recent Files")
    );
    return out;
  };

  const changedItems = (): MenuItemConstructorOptions[] => {
    const changes = (state?.changedFiles ?? []).slice(0, DYNAMIC_LIMIT);
    if (!changes.length) return [{ label: "No changes yet", enabled: false }];
    return [
      ...changes.map((change) => {
        const dir = path.posix.dirname(change.path);
        const parts = [
          path.posix.basename(change.path),
          ...(dir === "." ? [] : [dir]),
          formatAgo(change.at, input.now),
        ];
        return rendererItem(
          "squiggle.openFile",
          { path: change.path },
          parts.join(" · "),
          {
            enabled: change.exists, // deleted on disk: can't be opened
          }
        );
      }),
      separator,
      rendererItem("squiggle.clearChanges", undefined, "Clear List"),
    ];
  };

  const viewItems = (): MenuItemConstructorOptions[] =>
    (state?.views ?? []).map((view) => ({
      ...rendererItem("squiggle.view.select", { id: view.id }, view.label, {
        enabled: view.available,
      }),
      type: "radio",
      checked: state?.radios["squiggle.view"] === view.id,
    }));

  const nodes = (
    menuId: string,
    list: readonly MenuNode[]
  ): MenuItemConstructorOptions[] =>
    tidy(
      list.flatMap((node): MenuItemConstructorOptions[] => {
        if ("separator" in node) return [separator];
        if ("header" in node)
          return [{ label: text(node.header), enabled: false }];
        if ("dynamic" in node) {
          if (node.dynamic === "recent") return recentItems();
          if (node.dynamic === "changedFiles") return changedItems();
          return viewItems();
        }
        if ("submenu" in node) {
          if (!isAvailableOnHost(node, "electron")) return [];
          const submenu = nodes(`${menuId}/${node.submenu}`, node.items);
          return submenu.length
            ? [
                {
                  id: `${menuId}/${node.submenu}`,
                  label: text(node.title),
                  submenu,
                },
              ]
            : [];
        }
        const spec = getCommand(node.command);
        if (!spec)
          throw new Error(`Menu item for an unknown command: ${node.command}`);
        const item = commandItem(menuId, spec, node.args, node.title);
        return item ? [item] : [];
      })
    );

  const template: MenuItemConstructorOptions[] = [];
  if (mac) {
    template.push({
      label: input.appName,
      submenu: [
        { role: "about" },
        separator,
        { role: "services" },
        separator,
        { role: "hide" },
        { role: "hideOthers" },
        { role: "unhide" },
        separator,
        { role: "quit" },
      ],
    });
  }
  for (const menu of STUDIO_MENUS) {
    if (menu.id === "help") template.push({ role: "windowMenu" });
    const label = mac
      ? menu.title
      : menu.title.replace(new RegExp(`(${menu.mnemonic})`, "i"), "&$1");
    template.push({
      id: menu.id,
      label,
      ...(menu.id === "help" && mac ? { role: "help" as const } : {}),
      submenu: nodes(menu.id, menu.items),
    });
  }
  return template;
}

// ── Building and installing the menu ────────────────────────────────────────

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

export type MenuWindow = {
  win: BrowserWindow;
  menuState?: MenuState;
  server: { getRoot(): string };
};

export type MenuContext = {
  actions: MenuActions;
  // The focused Studio window: the menu shows its state and folder.
  focused: () => MenuWindow | undefined;
  // The Studio window of a BrowserWindow (for page-handled clicks).
  find: (win: BrowserWindow | undefined) => MenuWindow | undefined;
  send: (target: MenuWindow, message: CommandMessage) => void;
};

async function runMainCommand(
  context: MenuContext,
  id: MainCommand,
  args: { path: string } | undefined,
  win: BrowserWindow | undefined,
  rebuild: () => void
): Promise<void> {
  const { actions } = context;
  switch (id) {
    case "workbench.action.newWindow":
      return actions.newWindow();
    case "workbench.action.files.openFolder":
    case "workbench.action.files.openFile": {
      const kind =
        id === "workbench.action.files.openFolder" ? "folder" : "file";
      const picked = await pickPath(win, kind);
      const target = picked ? resolveTarget(picked) : undefined;
      if (target) await actions.open(target);
      return rebuild();
    }
    case "squiggle.openRecentFolder": {
      if (!args) return;
      const target = resolveTarget(args.path);
      if (!target) {
        dialog.showErrorBox(
          "Folder not found",
          `${args.path} no longer exists.`
        );
        return;
      }
      await actions.open(target);
      return rebuild();
    }
    case "workbench.action.closeWindow":
      win?.close();
      return;
    case "workbench.action.quit":
      app.quit();
      return;
    case "workbench.action.toggleDevTools":
      win?.webContents.toggleDevTools();
      return;
    case "workbench.action.reloadWindow":
      win?.webContents.reload();
      return;
    case "workbench.action.toggleFullScreen":
      win?.setFullScreen(!win.isFullScreen());
      return;
  }
}

// Rebuilds are deferred while a menu is open (rebuilding under an open menu
// closes it on some platforms), and run when it closes.
let openSubmenus = 0;
let pendingRebuild: (() => void) | undefined;

function trackOpen(menu: Menu) {
  menu.on("menu-will-show", () => {
    openSubmenus++;
  });
  menu.on("menu-will-close", () => {
    openSubmenus = Math.max(0, openSubmenus - 1);
    if (openSubmenus === 0 && pendingRebuild) {
      const rebuild = pendingRebuild;
      pendingRebuild = undefined;
      // After the click handler that closed the menu.
      setTimeout(rebuild, 0);
    }
  });
  for (const item of menu.items) if (item.submenu) trackOpen(item.submenu);
}

export function isMenuOpen(): boolean {
  return openSubmenus > 0;
}

// Builds the application menu for the focused window (its menu state and
// folder) and installs it.
export async function buildMenu(context: MenuContext): Promise<void> {
  const rebuild = () => void requestMenuRebuild(context);
  const focused = context.focused();
  const recent = await loadRecentFolders(defaultRecentFile());
  const template = buildMenuTemplate({
    platform: process.platform,
    isPackaged: app.isPackaged,
    appName: app.name,
    state: focused?.menuState,
    recentFolders: recent.map((r) => r.path),
    currentRoot: focused?.server.getRoot(),
    home: os.homedir(),
    now: Date.now(),
    sendToRenderer: (message, win) => {
      const target = context.find(win) ?? focused;
      if (target) context.send(target, message);
    },
    runInMain: (id, args, win) =>
      void runMainCommand(context, id, args, win ?? focused?.win, rebuild),
  });
  const menu = Menu.buildFromTemplate(template);
  openSubmenus = 0;
  trackOpen(menu);
  Menu.setApplicationMenu(menu);

  if (process.platform === "darwin") {
    app.dock?.setMenu(
      Menu.buildFromTemplate([
        { label: "New Window", click: () => void context.actions.newWindow() },
      ])
    );
  }
}

// Rebuilds now, or when the open menu closes.
export async function requestMenuRebuild(context: MenuContext): Promise<void> {
  if (isMenuOpen()) {
    pendingRebuild = () => void buildMenu(context);
    return;
  }
  await buildMenu(context);
}
