import { clsx } from "clsx";
import { FC } from "react";

import { XIcon } from "@quri/ui";

import { basename } from "../lib/paths.js";
import { isDirty, type Workspace } from "../lib/useWorkspace.js";

export const FileTabs: FC<{ workspace: Workspace }> = ({ workspace }) => {
  const { order, files, activePath } = workspace;
  if (!order.length) return null;

  return (
    <div className="flex shrink-0 overflow-x-auto border-b border-slate-200 bg-slate-50">
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
              className="py-2"
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
  );
};
