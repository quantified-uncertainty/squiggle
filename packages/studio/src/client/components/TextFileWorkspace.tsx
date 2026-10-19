import {
  FC,
  ReactNode,
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
} from "react";

import { TID } from "../../shared/testIds.js";
import { useContextKeys } from "../commands/context.js";
import { focusRegion, useFocuser } from "../commands/focus.js";
import { useCommand } from "../commands/registry.js";
import { publishCursor } from "../lib/stores/cursor.js";
import type { OpenFile, Workspace } from "../lib/workspaceTypes.js";
import { EditorHeader } from "./EditorHeader.js";

type Props = {
  file: OpenFile;
  workspace: Workspace;
  banner?: ReactNode;
  embed: boolean;
};

type TextView = {
  selectionStart: number;
  selectionEnd: number;
  scrollTop: number;
  focused: boolean;
};

function cursorOf(text: string, offset: number) {
  const before = text.slice(0, offset);
  const line = before.split("\n").length;
  const column = offset - (before.lastIndexOf("\n") + 1) + 1;
  return { line, column };
}

// The plain-text editor for .json and .md files. FileWorkspace keys it by path
// and the textarea by `${path}:${editorEpoch}:${externalRevision}`, so
// switching between two text files never shows the previous file's text, and
// saving never writes it into the wrong file (#1). When new content arrives
// from disk the textarea remounts and gets its selection, scroll and focus
// back.
export const TextFileWorkspace: FC<Props> = ({
  file,
  workspace,
  banner,
  embed,
}) => {
  const ref = useRef<HTMLTextAreaElement>(null);
  const viewRef = useRef<TextView | undefined>(undefined);
  const textKey = `${file.path}:${file.editorEpoch}:${file.externalRevision}`;

  const remember = () => {
    const el = ref.current;
    if (!el) return;
    viewRef.current = {
      selectionStart: el.selectionStart,
      selectionEnd: el.selectionEnd,
      scrollTop: el.scrollTop,
      focused: document.activeElement === el,
    };
  };

  const report = useCallback(() => {
    const el = ref.current;
    if (!el) return;
    const { line, column } = cursorOf(el.value, el.selectionEnd);
    publishCursor({
      path: file.path,
      line,
      column,
      selected: Math.abs(el.selectionEnd - el.selectionStart),
    });
  }, [file.path]);

  // After a remount for new content: the old selection (clamped), scroll and
  // focus.
  useLayoutEffect(() => {
    const el = ref.current;
    const saved = viewRef.current;
    if (!el || !saved) return;
    const max = el.value.length;
    el.setSelectionRange(
      Math.min(saved.selectionStart, max),
      Math.min(saved.selectionEnd, max)
    );
    el.scrollTop = saved.scrollTop;
    if (saved.focused) el.focus();
  }, [textKey]);

  useEffect(() => {
    report();
    return () => publishCursor(undefined);
  }, [report]);

  useContextKeys({
    "squiggle.views": NO_VIEWS,
    "squiggle.viewCount": 0,
    "squiggle.codePaneVisible": false,
    "squiggle.viewHasOwnEditor": false,
  });

  useFocuser(
    "editor",
    useCallback(() => {
      if (!ref.current) return false;
      ref.current.focus();
      return true;
    }, [])
  );
  useCommand("workbench.action.focusFirstEditorGroup", () => {
    void focusRegion("editor");
  });

  const textarea = (
    <textarea
      ref={ref}
      key={textKey}
      data-testid={TID.textEditor}
      aria-label={`Contents of ${file.path}`}
      className="min-h-0 flex-1 resize-none border-0 p-4 font-mono text-sm text-slate-800 focus:ring-0"
      spellCheck={false}
      readOnly={embed}
      defaultValue={file.buffer}
      onChange={(e) => {
        workspace.setBuffer(file.path, e.target.value);
        remember();
        report();
      }}
      onSelect={() => {
        remember();
        report();
      }}
      onScroll={remember}
      onFocus={remember}
      onBlur={remember}
    />
  );

  return (
    <div className="flex h-full min-h-0 flex-col">
      {!embed && <EditorHeader file={file} />}
      {banner}
      <div
        className="flex min-h-0 flex-1 flex-col"
        data-studio-region="editor"
        // A text file is ready once shown (render and agents wait for it).
        data-studio-ready="1"
      >
        {textarea}
      </div>
    </div>
  );
};

const NO_VIEWS: readonly [] = [];
