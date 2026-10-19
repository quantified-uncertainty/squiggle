import { FC, Fragment, ReactNode } from "react";

import { TID } from "../../shared/testIds.js";
import { runCommand } from "../commands/registry.js";
import type { OpenFile } from "../lib/workspaceTypes.js";
import { isDirty } from "../lib/workspaceTypes.js";
import type { StudioView } from "../views/types.js";
import { CodeToggle } from "./CodePane.js";
import { ViewTabs } from "./ViewTabs.js";

type Props = {
  file: OpenFile;
  // The view switcher; omitted for .json / .md files.
  views?: {
    available: readonly StudioView[];
    activeId: string;
    onSelect: (id: string) => void;
  };
  toolbar?: ReactNode; // the active view's renderToolbar
  codePane?: { open: boolean; onToggle: () => void }; // omitted: no toggle
};

// The 36 px header above the shown file (§3.6): breadcrumb of the
// root-relative path, dirty dot, the view's toolbar, the view switcher and
// the code-pane toggle. WP0 stub (owned by WP5): the existing ViewTabs and
// CodeToggle; WP5 replaces them with ViewSwitcher and a CommandButton.
export const EditorHeader: FC<Props> = ({ file, views, toolbar, codePane }) => {
  const segments = file.path.split("/");
  return (
    <div
      data-testid={TID.editorHeader}
      className="flex h-9 shrink-0 items-center gap-2 border-b border-slate-200 bg-white px-3"
    >
      <nav
        aria-label="Path"
        data-testid={TID.breadcrumb}
        title={file.path}
        className="flex min-w-0 items-center gap-1 text-[13px] text-slate-600"
      >
        {segments.map((segment, i) => (
          <Fragment key={i}>
            {i > 0 && (
              <span aria-hidden className="text-slate-500">
                ›
              </span>
            )}
            <button
              type="button"
              className={
                i === segments.length - 1
                  ? "truncate font-medium text-slate-900"
                  : "truncate hover:text-slate-900"
              }
              onClick={() =>
                runCommand(
                  "workbench.files.action.showActiveFileInExplorer",
                  undefined,
                  "button"
                )
              }
            >
              {segment}
            </button>
          </Fragment>
        ))}
      </nav>
      {isDirty(file) && (
        <span
          aria-label="Unsaved changes"
          className="h-2 w-2 shrink-0 rounded-full bg-slate-500"
        />
      )}
      <div className="flex-1" />
      {toolbar && (
        <div
          data-testid={TID.viewToolbar}
          className="flex shrink-0 items-center gap-2"
        >
          {toolbar}
        </div>
      )}
      {views && views.available.length > 0 && (
        <div data-testid={TID.viewSwitcher}>
          <ViewTabs
            views={views.available}
            activeId={views.activeId}
            onSelect={views.onSelect}
          />
        </div>
      )}
      {codePane && (
        <div data-testid={TID.codeToggle}>
          <CodeToggle open={codePane.open} onToggle={codePane.onToggle} />
        </div>
      )}
    </div>
  );
};
