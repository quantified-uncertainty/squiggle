import { FC, useLayoutEffect, useRef } from "react";

import { useToast, XIcon } from "@quri/ui";

import { TID } from "../../shared/testIds.js";
import { host } from "../lib/host.js";
import { useWorkspaceContext } from "../lib/workspaceTypes.js";
import { SquiggleIcon } from "./icons.js";
import { OverlayFrame } from "./OverlayFrame.js";

const platformName = { mac: "macOS", win: "Windows", linux: "Linux" } as const;

// Help ▸ About Squiggle Studio (browser only; Electron has the native About
// panel): versions, server URL, root and host.
export const AboutModal: FC<{ onDismiss: () => void }> = ({ onDismiss }) => {
  const workspace = useWorkspaceContext();
  const toast = useToast();
  const closeRef = useRef<HTMLButtonElement>(null);

  const details: Array<[string, string]> = [
    ["Squiggle Studio", __STUDIO_VERSION__],
    ["squiggle-lang", __SQUIGGLE_LANG_VERSION__],
    ["Server", window.location.origin],
    ["Folder", workspace.rootInfo?.root ?? "—"],
    [
      "Host",
      `${host.kind === "electron" ? "Desktop app" : "Browser"} on ${platformName[host.platform]}`,
    ],
  ];

  useLayoutEffect(() => {
    closeRef.current?.focus();
  }, []);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(
        details.map(([k, v]) => `${k}: ${v}`).join("\n")
      );
      toast("Copied", "confirmation");
    } catch (e) {
      toast(
        `Couldn't copy: ${e instanceof Error ? e.message : String(e)}`,
        "error"
      );
    }
  };

  return (
    <OverlayFrame
      testId={TID.aboutModal}
      label="About Squiggle Studio"
      placement="center"
      dim
      className="w-[min(28rem,100%)]"
      onDismiss={onDismiss}
    >
      <div className="flex items-start gap-3 px-5 pb-3 pt-5">
        <SquiggleIcon size={32} className="shrink-0 text-orange-500" />
        <div className="min-w-0 flex-1">
          <h2 className="text-base font-semibold text-slate-800">
            Squiggle Studio
          </h2>
          <p className="text-sm text-slate-600">
            A local editor and viewer for .squiggle models.
          </p>
        </div>
        <button
          type="button"
          aria-label="Close"
          title="Close (Esc)"
          className="rounded p-1 text-slate-600 hover:bg-slate-100 hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-300"
          onClick={onDismiss}
        >
          <XIcon size={14} />
        </button>
      </div>
      <dl className="grid grid-cols-[max-content_1fr] gap-x-4 gap-y-1 px-5 pb-4 text-sm">
        {details.map(([k, v]) => (
          <div key={k} className="contents">
            <dt className="text-slate-600">{k}</dt>
            <dd
              className="min-w-0 break-all font-mono text-[13px] text-slate-800"
              title={v}
              data-about={k}
            >
              {v}
            </dd>
          </div>
        ))}
      </dl>
      <div className="flex justify-end gap-2 border-t border-slate-200 bg-slate-50 px-5 py-2">
        <button
          type="button"
          className="h-7 rounded border border-slate-300 bg-white px-3 text-xs text-slate-700 hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-300"
          onClick={() => void copy()}
        >
          Copy details
        </button>
        <button
          ref={closeRef}
          type="button"
          className="h-7 rounded bg-slate-800 px-3 text-xs font-medium text-white hover:bg-slate-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-300"
          onClick={onDismiss}
        >
          Done
        </button>
      </div>
    </OverlayFrame>
  );
};
