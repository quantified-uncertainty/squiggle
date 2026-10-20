import { FC, Fragment, ReactNode } from "react";

import { CodeBracketIcon } from "@quri/ui";

import { TID } from "../../shared/testIds.js";
import { runCommand } from "../commands/registry.js";
import type { OpenFile } from "../lib/workspaceTypes.js";
import { isDirty } from "../lib/workspaceTypes.js";
import { CommandButton } from "./CommandButton.js";
import { type ViewEntry, ViewSwitcher } from "./ViewSwitcher.js";

type Props = {
  file: OpenFile;
  // The view switcher; omitted for .json / .md files.
  views?: {
    entries: readonly ViewEntry[]; // every view, in switcher order
    activeId: string | undefined;
    panelId: string;
  };
  toolbar?: ReactNode; // the active view's renderToolbar
  // The code-pane toggle; omitted for .json / .md files. `ownEditor` names
  // the view that has its own editor (the Playground), which disables it.
  codePane?: { visible: boolean; ownEditor?: string };
};

// The 36 px header above the shown file (§3.6): the root-relative path as a
// breadcrumb (always visible, so the shown file is always named: #32, #55),
// a dirty dot, the active view's toolbar, the view switcher and the code-pane
// toggle. When the controls and 8rem of path don't fit on one line (a narrow
// window with the relative values toolbar), the controls wrap to a second
// line instead of widening the page.
export const EditorHeader: FC<Props> = ({ file, views, toolbar, codePane }) => {
  const segments = file.path.split("/");
  return (
    <div
      data-testid={TID.editorHeader}
      className="flex min-h-9 shrink-0 flex-wrap items-center gap-x-2 gap-y-1 border-b border-slate-200 bg-white px-3 py-1"
    >
      <div className="flex min-w-0 flex-1 basis-32 items-center gap-2">
        <nav
          aria-label="Path"
          data-testid={TID.breadcrumb}
          title={file.path}
          className="flex min-w-0 items-center gap-1 text-[13px] text-slate-600"
        >
          {segments.map((segment, i) => {
            const last = i === segments.length - 1;
            return (
              <Fragment key={i}>
                {i > 0 && (
                  <span aria-hidden className="shrink-0 text-slate-500">
                    ›
                  </span>
                )}
                <button
                  type="button"
                  title={`${segments.slice(0, i + 1).join("/")} — reveal in Explorer`}
                  aria-current={last ? "page" : undefined}
                  // Folders shrink before the file name does.
                  className={
                    last
                      ? "min-w-[4rem] truncate font-medium text-slate-900"
                      : "min-w-0 max-w-[12rem] shrink-[2] truncate hover:text-slate-900"
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
            );
          })}
        </nav>
        {isDirty(file) && (
          <span
            role="img"
            aria-label="Unsaved changes"
            title="Unsaved changes"
            className="h-2 w-2 shrink-0 rounded-full bg-slate-500"
          />
        )}
      </div>
      <div className="ml-auto flex min-w-0 flex-wrap items-center justify-end gap-x-2 gap-y-1">
        {toolbar && (
          <div
            data-testid={TID.viewToolbar}
            className="flex shrink-0 items-center gap-2"
          >
            {toolbar}
          </div>
        )}
        {views && (
          <ViewSwitcher
            views={views.entries}
            activeId={views.activeId}
            panelId={views.panelId}
          />
        )}
        {codePane && (
          <CommandButton
            command="squiggle.toggleCodePane"
            testId={TID.codeToggle}
            icon={<CodeBracketIcon size={16} />}
            pressed={codePane.ownEditor ? undefined : codePane.visible}
            label={
              codePane.ownEditor
                ? `${codePane.ownEditor} has its own editor`
                : codePane.visible
                  ? "Hide code"
                  : "Show code"
            }
            className="shrink-0"
          />
        )}
      </div>
    </div>
  );
};
