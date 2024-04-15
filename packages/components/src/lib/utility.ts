import {
  Env,
  result,
  SqError,
  SqProject,
  SqValue,
  SqValuePath,
} from "@quri/squiggle-lang";

import { SqOutputResult } from "../../../squiggle-lang/src/public/types.js";
import { Simulation } from "./hooks/useSimulator.js";

export function flattenResult<a, b>(x: result<a, b>[]): result<a[], b> {
  if (x.length === 0) {
    return { ok: true, value: [] };
  } else {
    if (!x[0].ok) {
      return x[0];
    }
    const rest = flattenResult(x.splice(1));
    if (!rest.ok) {
      return rest;
    }
    return { ok: true, value: [x[0].value].concat(rest.value) };
  }
}

export function resultBind<a, b, c>(
  x: result<a, b>,
  fn: (y: a) => result<c, b>
): result<c, b> {
  if (x.ok) {
    return fn(x.value);
  } else {
    return x;
  }
}

export function all(arr: boolean[]): boolean {
  return arr.reduce((x, y) => x && y, true);
}

export function some(arr: boolean[]): boolean {
  return arr.reduce((x, y) => x || y, false);
}

export function simulationErrors(simulation?: Simulation): SqError[] {
  if (!simulation) {
    return [];
  } else if (simulation.output.ok) {
    return [];
  } else {
    return [simulation.output.value];
  }
}

export function unwrapOrFailure<a, b>(x: result<a, b>): a {
  if (x.ok) {
    return x.value;
  } else {
    throw Error("FAILURE TO UNWRAP");
  }
}

export function isMac() {
  // Browser-only. Defaults to `false` when `window` is not available.

  // TODO - support https://developer.mozilla.org/en-US/docs/Web/API/NavigatorUAData/platform
  // when it will become available in modern browsers.
  // Note: MacIntel is valid even for ARM macs.
  return (
    typeof window !== "undefined" && window.navigator.platform === "MacIntel"
  );
}

export function modKey() {
  // Matches Codemirror; https://codemirror.net/docs/ref/#view.KeyBinding
  return isMac() ? "Cmd" : "Ctrl";
}

export function altKey() {
  return isMac() ? "Option" : "Alt";
}

//This is important to make sure that canvas elements properly stretch
export const canvasClasses = "w-full";

// Function by supersan on Stack Overflow.
// https://stackoverflow.com/questions/5560248/programmatically-lighten-or-darken-a-hex-color-or-rgb-and-blend-colors
// Takes in a string like "#333999"
export function adjustColorBrightness(color: string, amount: number) {
  return (
    "#" +
    color
      .replace(/^#/, "")
      .replace(/../g, (color) =>
        (
          "0" +
          Math.min(255, Math.max(0, parseInt(color, 16) + amount)).toString(16)
        ).substr(-2)
      )
  );
}

// Ensures that the SqValue has a "context" parameter, which would otherwise be optional.
export type SqValueWithContext = SqValue & Required<Pick<SqValue, "context">>;

export function valueHasContext(value: SqValue): value is SqValueWithContext {
  return !!value.context;
}

export type ViewerTab =
  | "Imports"
  | "Exports"
  | "Variables"
  | "Result"
  | "AST"
  | { tag: "CustomVisibleRootPath"; visibleRootPath: SqValuePath };

export const isCustomVisibleRootPath = (
  tab: ViewerTab
): tab is { tag: "CustomVisibleRootPath"; visibleRootPath: SqValuePath } =>
  typeof tab === "object" && tab.tag === "CustomVisibleRootPath";

export function defaultViewerTab(
  outputResult: SqOutputResult | undefined
): ViewerTab {
  if (!outputResult?.ok) {
    return "Variables";
  }

  return outputResult.value.result.tag !== "Void" ? "Result" : "Variables";
}

export function viewerTabToVisibleRootPath(
  viewerTab: ViewerTab
): SqValuePath | undefined {
  return isCustomVisibleRootPath(viewerTab)
    ? viewerTab.visibleRootPath
    : undefined;
}

export function viewerTabToValue(
  viewerTab: ViewerTab,
  output: SqOutputResult
): SqValue | undefined {
  if (!output.ok) {
    return;
  }
  const sqOutput = output.value;
  switch (viewerTab) {
    case "Result":
      return sqOutput.result;
    case "Variables":
      return sqOutput.bindings.asValue();
    case "Imports":
      return sqOutput.imports.asValue();
    case "Exports":
      return sqOutput.exports.asValue();
    case "AST":
      return undefined;
    default:
      if (isCustomVisibleRootPath(viewerTab)) {
        return viewerTab.visibleRootPath.root === "result" //Practically speaking, this should only be bindings.
          ? output.value.result
          : output.value.bindings.asValue();
      }
  }
}

const selectableViewerTabs = [
  "Imports",
  "Variables",
  "Exports",
  "Result",
  "AST",
] as const;

export type SelectableViewerTab = (typeof selectableViewerTabs)[number];

export function viewerTabsToShow(
  outputResult: SqOutputResult
): SelectableViewerTab[] {
  if (!outputResult.ok) return ["Variables", "AST"]; // Default tabs if outputResult is not OK

  const tabs: SelectableViewerTab[] = []; // Always show AST
  const { bindings, imports, exports, result } = outputResult.value;

  if (imports.size()) tabs.push("Imports");
  if (bindings.size()) tabs.push("Variables");
  if (exports.size()) tabs.push("Exports");
  if (result.tag !== "Void") tabs.push("Result");
  tabs.push("AST");

  return tabs;
}

//These two are being phased out, in favor of RunSetup
// Props needed for a standalone execution.
export type StandaloneExecutionProps = {
  project?: undefined;
  environment?: Env;
  continues?: undefined;
};

// Props needed when executing inside a project.
export type ProjectExecutionProps = {
  /** The project that this execution is part of */
  project: SqProject;
  environment?: undefined;
  /** What other squiggle sources from the project to continue. Default [] */
  continues?: string[];
};
