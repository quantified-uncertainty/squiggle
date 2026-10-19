export {
  type StudioServer,
  type StudioServerOptions,
  startStudioServer,
} from "./server.js";
export { PathError, resolveSafePath } from "./paths.js";
export { defaultRecentFile, loadRecentFolders } from "./recent.js";
export type { RecentFolder, StudioEvent, TreeNode } from "../shared/api.js";

// The command manifest, for the Electron native menu (§3.5).
export {
  bindingsFor,
  type CommandSpec,
  formatKey,
  getCommand,
  type Host,
  isAvailableOnHost,
  type KeyBinding,
  type MenuNode,
  type MenuSpec,
  type MenuState,
  menuStateSchema,
  type Platform,
  radioValue,
  STUDIO_COMMANDS,
  STUDIO_MENUS,
  toElectronAccelerator,
} from "../shared/commands/index.js";
