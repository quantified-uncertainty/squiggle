import { FC, useEffect, useRef } from "react";

import { findRelativeValuesExports } from "@quri/squiggle-relative-values/core";
import { useToast } from "@quri/ui";

import type { ViewState } from "../../shared/viewState.js";
import {
  agentContext,
  problemsText,
  renderCommand,
  runCommand,
  viewLink,
} from "../lib/agentContext.js";
import { registerAgentProvider } from "../lib/agentHooks.js";
import { getViewState } from "../lib/navigation.js";
import { runJsonOf } from "../lib/runJson.js";
import { getActiveRun, useActiveRun } from "../lib/stores/activeRun.js";
import { isDirty, useWorkspaceContext } from "../lib/workspaceTypes.js";
import { getStudioViews } from "../views/index.js";
import { useCommand } from "./registry.js";

// Run ▸ Copy for Agent (spec §3.4, §6.5) and the getRunJson provider of
// window.squiggleStudio. Everything is read when a command runs, from the
// workspace, the address bar's view state and the active-run store.

// Copies `text`. navigator.clipboard needs a secure origin and a focused
// document; otherwise a hidden textarea and execCommand("copy") (inside the
// command's user activation) do it.
async function copyToClipboard(text: string): Promise<void> {
  if (navigator.clipboard && window.isSecureContext) {
    try {
      await navigator.clipboard.writeText(text);
      return;
    } catch {
      // E.g. the document isn't focused; try the fallback.
    }
  }
  const previous =
    document.activeElement instanceof HTMLElement
      ? document.activeElement
      : null;
  const area = document.createElement("textarea");
  area.value = text;
  area.setAttribute("readonly", "");
  area.className = "fixed left-0 top-0 opacity-0";
  document.body.append(area);
  area.select();
  const copied = document.execCommand("copy");
  area.remove();
  previous?.focus({ preventScroll: true });
  if (!copied) throw new Error("Couldn't copy to the clipboard");
}

export const AgentCommands: FC = () => {
  const workspace = useWorkspaceContext();
  const toast = useToast();
  const workspaceRef = useRef(workspace);
  workspaceRef.current = workspace;
  // Re-render when the run changes, so `enabled` below stays current.
  const run = useActiveRun();

  useEffect(
    () =>
      registerAgentProvider("getRunJson", () =>
        runJsonOf(getActiveRun(), workspaceRef.current.activePath)
      ),
    []
  );

  const root = workspace.rootInfo?.root;
  const activePath = workspace.activePath;
  const hasFile = root !== undefined && activePath !== null;

  // The shown file's view as the address bar has it.
  const shownState = (): ViewState & { file: string } => {
    const file = workspaceRef.current.activePath;
    if (!file) throw new Error("No file is shown");
    return { ...getViewState(), file };
  };
  const rootOrThrow = (): string => {
    const r = workspaceRef.current.rootInfo?.root;
    if (!r) throw new Error("The folder isn't loaded yet");
    return r;
  };
  const shownRun = () => {
    const current = getActiveRun();
    return current && current.path === workspaceRef.current.activePath
      ? current
      : undefined;
  };
  const link = (state: ViewState) =>
    viewLink(window.location.origin, window.location.pathname, state);
  const copy = async (text: string, message: string) => {
    await copyToClipboard(text);
    toast(message, "confirmation");
  };

  useCommand(
    "squiggle.agent.copyContext",
    () => {
      const state = shownState();
      const current = shownRun();
      // The spec the relative values view shows: ?variable=, else the first.
      let rvSpec: { name: string; itemCount?: number } | undefined;
      if (state.view === "relative-values" && current?.output) {
        const specs = findRelativeValuesExports(current.output);
        const shown = specs.find((s) => s.name === state.variable) ?? specs[0];
        if (shown) {
          rvSpec = {
            name: shown.name,
            itemCount: shown.spec.ok
              ? shown.spec.value.definition.items.length
              : undefined,
          };
        }
      } else if (state.view === "relative-values" && state.variable) {
        rvSpec = { name: state.variable };
      }
      const file = workspaceRef.current.files[state.file];
      return copy(
        agentContext({
          root: rootOrThrow(),
          state,
          viewLabel: getStudioViews().find((v) => v.id === state.view)?.label,
          rvSpec,
          link: link(state),
          run: current,
          dirty: file ? isDirty(file) : false,
        }),
        "Copied context for your agent"
      );
    },
    { enabled: hasFile }
  );

  useCommand(
    "squiggle.copyViewLink",
    () => copy(link(shownState()), "Copied a link to this view"),
    { enabled: hasFile }
  );

  useCommand(
    "squiggle.agent.copyRunCommand",
    () =>
      copy(
        runCommand(rootOrThrow(), shownState().file),
        "Copied the run command"
      ),
    { enabled: hasFile }
  );

  useCommand(
    "squiggle.agent.copyRenderCommand",
    () =>
      copy(
        renderCommand(rootOrThrow(), shownState()),
        "Copied the render command"
      ),
    { enabled: hasFile }
  );

  const shownErrors = run && run.path === activePath ? run.errors.length : 0;
  useCommand(
    "squiggle.agent.copyProblems",
    () => {
      const current = shownRun();
      if (!current?.errors.length) throw new Error("No problems to copy");
      const count = current.errors.length;
      return copy(
        problemsText(current),
        `Copied ${count} problem${count === 1 ? "" : "s"}`
      );
    },
    { enabled: shownErrors > 0 }
  );

  const hasOutput = run?.output !== undefined && run.path === activePath;
  useCommand(
    "squiggle.output.copyJson",
    () => {
      const json = runJsonOf(getActiveRun(), workspaceRef.current.activePath);
      if (!json) throw new Error("The file hasn't finished running yet");
      return copy(JSON.stringify(json, null, 2), "Copied the output as JSON");
    },
    { enabled: hasOutput }
  );

  return null;
};
