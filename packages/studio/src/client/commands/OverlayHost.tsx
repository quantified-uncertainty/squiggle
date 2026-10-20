import { FC, useCallback, useLayoutEffect, useRef, useState } from "react";

import { AboutModal } from "../components/AboutModal.js";
import { PickRequestView, QuickOpen } from "../components/QuickPick.js";
import {
  installControlTracker,
  isControlHeld,
  RecentFilesSwitcher,
} from "../components/RecentFilesSwitcher.js";
import { ShortcutSheet } from "../components/ShortcutSheet.js";
import { onQuickPickRequest, type QuickPickRequest } from "../lib/quickPick.js";
import { useWorkspaceContext } from "../lib/workspaceTypes.js";
import { captureFocus } from "./focus.js";
import type { CommandRow } from "./providers/commands.js";
import { runCommand, useCommand } from "./registry.js";

type Overlay =
  | { kind: "quick-open"; initialValue: string; serial: number }
  | { kind: "pick"; request: QuickPickRequest; serial: number }
  | { kind: "switcher"; hold: boolean; serial: number }
  | { kind: "sheet"; serial: number }
  | { kind: "about"; serial: number };

type DistributiveOmit<T, K extends PropertyKey> = T extends unknown
  ? Omit<T, K>
  : never;
type OverlayRequest = DistributiveOmit<Overlay, "serial">;

// Renders the one open overlay (Quick Open and the palette, generic
// showQuickPick requests, the recent-files switcher, the shortcut sheet,
// About) and registers the commands that open them (overlays.ts). Opening
// one replaces any other; closing restores the focus from before the first.
export const OverlayHost: FC = () => {
  const workspace = useWorkspaceContext();
  const [overlay, setOverlay] = useState<Overlay | undefined>();
  const restoreRef = useRef<(() => void) | undefined>(undefined);
  const serialRef = useRef(0);
  const pickRef = useRef<QuickPickRequest | undefined>(undefined);

  useLayoutEffect(() => installControlTracker(), []);

  const open = useCallback((next: OverlayRequest) => {
    restoreRef.current ??= captureFocus();
    // A pending generic pick that gets replaced resolves as dismissed.
    if (pickRef.current && next.kind !== "pick") {
      pickRef.current.resolve(undefined);
      pickRef.current = undefined;
    }
    serialRef.current++;
    setOverlay({ ...next, serial: serialRef.current });
  }, []);

  // Closes the overlay and puts focus back where it was (the palette and
  // menus run their command on the next frame, against that focus).
  const close = useCallback((restore = true) => {
    const restoreFocus = restoreRef.current;
    restoreRef.current = undefined;
    setOverlay(undefined);
    if (restore) restoreFocus?.();
  }, []);

  useLayoutEffect(
    () =>
      onQuickPickRequest((request) => {
        pickRef.current?.resolve(undefined);
        pickRef.current = request;
        open({ kind: "pick", request });
      }),
    [open]
  );

  useCommand("workbench.action.quickOpen", () =>
    open({ kind: "quick-open", initialValue: "" })
  );
  useCommand("workbench.action.showCommands", () =>
    open({ kind: "quick-open", initialValue: ">" })
  );
  useCommand("workbench.action.quickOpenPreviousRecentlyUsedEditor", () =>
    open({ kind: "switcher", hold: isControlHeld() })
  );
  useCommand("workbench.action.openGlobalKeybindings", () =>
    open({ kind: "sheet" })
  );
  useCommand("squiggle.help.about", () => open({ kind: "about" }));

  if (!overlay) return null;

  switch (overlay.kind) {
    case "quick-open": {
      // The file's editor or view gets focus once it renders (openFile).
      const openFile = (path: string) => {
        close();
        workspace.openFile(path, { reason: "quick-open", focus: "main" });
      };
      const runRow = (row: CommandRow) => {
        close();
        runCommand(row.id, row.args, "palette");
      };
      return (
        <QuickOpen
          key={overlay.serial}
          initialValue={overlay.initialValue}
          onOpenFile={openFile}
          onRunCommand={runRow}
          onDismiss={() => close()}
        />
      );
    }
    case "pick": {
      const { request } = overlay;
      return (
        <PickRequestView
          key={overlay.serial}
          request={request}
          onDone={(item) => {
            if (pickRef.current === request) pickRef.current = undefined;
            close();
            request.resolve(item);
          }}
        />
      );
    }
    case "switcher":
      return (
        <RecentFilesSwitcher
          key={overlay.serial}
          hold={overlay.hold}
          onOpen={(path) => {
            close();
            workspace.openFile(path, { reason: "switcher" });
          }}
          onDismiss={() => close()}
        />
      );
    case "sheet":
      return <ShortcutSheet key={overlay.serial} onDismiss={() => close()} />;
    case "about":
      return <AboutModal key={overlay.serial} onDismiss={() => close()} />;
  }
};
