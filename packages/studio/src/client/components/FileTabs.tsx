import { clsx } from "clsx";
import { FC } from "react";

import { XIcon } from "@quri/ui";

import { basename } from "../lib/paths.js";
import { isDirty, type Workspace } from "../lib/useWorkspace.js";

// The tab bar. Its right side is a slot (`toolbarRef`) that the active file's
// workspace fills with the view switcher and save state, via a portal.
export const FileTabs: FC<{
  workspace: Workspace;
  toolbarRef: (el: HTMLDivElement | null) => void;
}> = ({ workspace, toolbarRef }) => {
  const { order, files, activePath } = workspace;
  if (!order.length) return null;

  return (
    <div className="flex h-10 shrink-0 border-b border-slate-200 bg-slate-50">
      <div className="flex min-w-0 flex-1 overflow-x-auto overflow-y-hidden">
        {order.map((path) => {
          const file = files[path];
          const active = path === activePath;
          const dirty = file ? isDirty(file) : false;
          return (
            <div
              key={path}
              title={path}
              className={clsx(
                "group flex shrink-0 items-center gap-1 border-r border-slate-200 pl-3 pr-1.5 text-sm",
                active
                  ? "-mb-px border-b border-b-white bg-white text-slate-900"
                  : "text-slate-500 hover:bg-slate-100 hover:text-slate-800"
              )}
            >
              <button
                type="button"
                className="h-full"
                onClick={() => workspace.setActivePath(path)}
              >
                {basename(path)}
              </button>
              <button
                type="button"
                aria-label={`Close ${path}`}
                className="grid h-5 w-5 place-items-center rounded hover:bg-slate-200"
                onClick={() => workspace.closeFile(path)}
              >
                {dirty ? (
                  <span className="h-2 w-2 rounded-full bg-slate-500 group-hover:hidden" />
                ) : null}
                <XIcon
                  size={10}
                  className={clsx(
                    "text-slate-500",
                    dirty
                      ? "hidden group-hover:block"
                      : !active && "invisible group-hover:visible"
                  )}
                />
              </button>
            </div>
          );
        })}
      </div>
      <div
        ref={toolbarRef}
        className="flex shrink-0 items-center gap-3 border-l border-slate-200 bg-white px-3"
      />
    </div>
  );
};
