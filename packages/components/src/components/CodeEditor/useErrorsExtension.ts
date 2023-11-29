import { setDiagnostics } from "@codemirror/lint";
import { Extension } from "@codemirror/state";
import { EditorView } from "@codemirror/view";
import { useEffect } from "react";
import { SqCompileError, SqError, SqRuntimeError } from "@quri/squiggle-lang";

export function useErrorsExtension(
  view: EditorView | undefined,
  errors: SqError[] | undefined = []
) {
  useEffect(() => {
    if (!view) return;
    const docLength = view.state.doc.length;

    view.dispatch(
      setDiagnostics(
        view.state,
        errors
          .map((err) => {
            if (
              !(err instanceof SqCompileError || err instanceof SqRuntimeError)
            ) {
              return undefined;
            }
            const location = err.location();
            if (!location) {
              return undefined;
            }
            return {
              location,
              err,
            };
          })
          .filter((err): err is NonNullable<typeof err> => {
            return Boolean(
              err && err.location && err.location.end.offset < docLength
            );
          })
          .map((err) => ({
            from: err.location.start.offset,
            to: err.location.end.offset,
            severity: "error",
            message: err.err.toString(),
          }))
      )
    );
  }, [view, errors]);

  // fake extension
  return [] as Extension;
}
