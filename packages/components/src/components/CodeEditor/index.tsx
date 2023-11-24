import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useState,
} from "react";

import { EditorState } from "@codemirror/state";
import { EditorView, keymap } from "@codemirror/view";

import { SqError, SqProject, SqValuePath } from "@quri/squiggle-lang";

import {
  compViewNodeListener,
  formatSquiggle,
  getCodeEditorExtensions,
  scrollTo,
  setErrors,
  setLineWrapping,
  setOnChange,
  setOnSubmit,
  setProject,
  setShowGutter,
  setWidthHeight,
} from "./getCodeEditorExtensions.js";

interface CodeEditorProps {
  defaultValue: string;
  onChange: (value: string) => void;
  onSubmit?: () => void;
  onViewValuePath?: (path: SqValuePath) => void;
  width?: number;
  height?: number | string;
  showGutter?: boolean;
  lineWrapping?: boolean;
  errors?: SqError[];
  sourceId?: string;
  project: SqProject;
}

export type CodeEditorHandle = {
  format(): void;
  scrollTo(position: number): void;
  viewCurrentPosition(): void;
};

export const CodeEditor = forwardRef<CodeEditorHandle, CodeEditorProps>(
  function CodeEditor(
    {
      defaultValue,
      onChange,
      onSubmit,
      onViewValuePath,
      width,
      height,
      showGutter = false,
      errors = [],
      sourceId,
      project,
      lineWrapping = true,
    },
    ref
  ) {
    const [view, setView] = useState<EditorView>();

    useEffect(() => {
      if (typeof window === "undefined") {
        return; // no SSR
      }
      const extensions = getCodeEditorExtensions({ lineWrapping });

      const state = EditorState.create({
        doc: defaultValue,
        extensions,
      });
      setView(new EditorView({ state }));
      return () => {
        view?.destroy();
      };
      // we initialize the view only once; no need for deps
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const viewCurrentPosition = useCallback(() => {
      if (!onViewValuePath || !view || !sourceId) {
        return;
      }
      const offset = view.state.selection.main.to;
      if (offset === undefined) {
        return;
      }
      const valuePathResult = project.findValuePathByOffset(sourceId, offset);
      if (valuePathResult.ok) {
        onViewValuePath(valuePathResult.value);
      }
    }, [onViewValuePath, project, sourceId, view]);

    useImperativeHandle(ref, () => ({
      format: () => {
        if (!view) return;
        formatSquiggle(view);
      },
      scrollTo: (position) => {
        if (!view) return;
        scrollTo(view, position);
      },
      viewCurrentPosition,
    }));

    useEffect(() => {
      if (!view) return;
      setShowGutter(view, showGutter);
    }, [showGutter, view]);

    useEffect(() => {
      if (!view) return;
      setProject(view, project);
    }, [project, view]);

    useEffect(() => {
      if (!view) return;
      setOnChange(view, onChange);
    }, [onChange, view]);

    useEffect(() => {
      if (!view) return;
      setWidthHeight(view, { width, height });
    }, [width, height, view]);

    useEffect(() => {
      if (!view) return;
      setLineWrapping(view, lineWrapping);
    }, [lineWrapping, view]);

    useEffect(() => {
      if (!view) return;
      setOnSubmit(view, onSubmit);
    }, [onSubmit, view]);

    useEffect(() => {
      if (!view) return;
      view.dispatch({
        effects: compViewNodeListener.reconfigure(
          keymap.of([
            {
              key: "Alt-Shift-v",
              run: () => {
                viewCurrentPosition();
                return true;
              },
            },
          ])
        ),
      });
    }, [view, viewCurrentPosition]);

    useEffect(() => {
      if (!view) return;
      setErrors(view, errors);
    }, [errors, view]);

    const setViewDom = useCallback(
      (element: HTMLDivElement | null) => {
        if (!view) return;
        // TODO: the editor breaks on hot reloading in storybook, investigate
        element?.replaceChildren(view.dom);
      },
      [view]
    );

    return <div style={{ fontSize: "13px" }} ref={setViewDom}></div>;
  }
);
