import { FC } from "react";

import { basename, dirname } from "../../shared/paths.js";
import { TID } from "../../shared/testIds.js";
import { useWorkspaceContext } from "../lib/workspaceTypes.js";
import { SquiggleIcon } from "./icons.js";

// Shown when no file is shown (§3.6). WP0 stub (owned by WP2): the former
// EmptyState of App.tsx, reading the workspace from context.
export const StartPage: FC = () => {
  const workspace = useWorkspaceContext();
  const recent = workspace.mru.slice(0, 8);

  return (
    <div
      data-testid={TID.startPage}
      className="grid h-full place-items-center overflow-auto bg-slate-50"
    >
      <div className="w-full max-w-md px-6 py-8">
        <div className="text-center">
          <SquiggleIcon size={40} className="mx-auto text-orange-500" />
          <h2 className="mt-3 text-base font-semibold text-slate-700">
            {workspace.rootInfo?.name ?? "Squiggle Studio"}
          </h2>
          <p className="mt-1 text-sm text-slate-600">
            Pick a <code>.squiggle</code> file in the Explorer. Changes made on
            disk, for example by a coding agent, show up here automatically.
          </p>
        </div>
        {recent.length > 0 && (
          <div className="mt-6 overflow-hidden rounded-lg border border-slate-200 bg-white">
            <div className="border-b border-slate-100 px-4 py-2 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
              Recent files
            </div>
            <ul>
              {recent.map((p) => (
                <li key={p}>
                  <button
                    type="button"
                    title={p}
                    className="flex w-full items-baseline gap-2 px-4 py-2 text-left text-sm text-slate-700 hover:bg-slate-50"
                    onClick={() => workspace.openFile(p, { reason: "start" })}
                  >
                    <SquiggleIcon
                      size={14}
                      className="shrink-0 self-center text-orange-500"
                    />
                    <span className="truncate font-medium">{basename(p)}</span>
                    {dirname(p) && (
                      <span className="truncate text-xs text-slate-500">
                        {dirname(p)}
                      </span>
                    )}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}
        <p className="mt-6 text-center text-xs text-slate-500">
          Tip: turn on <span className="font-medium">Follow</span> in the status
          bar to show files as your agent edits them.
        </p>
      </div>
    </div>
  );
};
