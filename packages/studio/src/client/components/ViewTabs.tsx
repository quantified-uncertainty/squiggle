import { clsx } from "clsx";
import { FC } from "react";

import type { StudioView } from "../views/types.js";

export const ViewTabs: FC<{
  views: readonly StudioView[];
  activeId: string;
  onSelect: (id: string) => void;
}> = ({ views, activeId, onSelect }) => (
  <div className="flex rounded-md bg-slate-100 p-0.5" role="tablist">
    {views.map((view) => (
      <button
        key={view.id}
        type="button"
        role="tab"
        aria-selected={view.id === activeId}
        className={clsx(
          "rounded px-2.5 py-0.5 text-xs font-medium",
          view.id === activeId
            ? "bg-white text-slate-900 shadow-sm ring-1 ring-black/5"
            : "text-slate-500 hover:text-slate-800"
        )}
        onClick={() => onSelect(view.id)}
      >
        {view.label}
      </button>
    ))}
  </div>
);
