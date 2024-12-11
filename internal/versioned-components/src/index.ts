export { SquigglePlaygroundVersionPicker } from "./SquigglePlaygroundVersionPicker.js";
export { SquiggleVersionShower } from "./SquiggleVersionShower.js";
export {
  type SquigglePackages,
  versionedSquigglePackages,
} from "./versionedSquigglePackages.js";

export {
  checkSquiggleVersion,
  defaultSquiggleVersion,
  type SquiggleVersion,
  squiggleVersions,
} from "./versions.js";

export {
  versionSupportsDropdownMenu,
  versionSupportsExports,
  versionSupportsImportTooltip,
  versionSupportsOnOpenExport,
  versionSupportsSqPathV2,
  versionSupportsSqProjectV2,
  versionSupportsSquiggleChart,
} from "./predicates.js";

export { useAdjustSquiggleVersion } from "./hooks.js";

export type {
  AntiGuardedSquigglePackages,
  GuardedSquigglePackages,
} from "./predicates.js";
