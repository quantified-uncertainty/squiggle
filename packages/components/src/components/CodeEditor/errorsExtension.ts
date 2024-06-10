import { linter } from "@codemirror/lint";

import { SqCompileError, SqRuntimeError } from "@quri/squiggle-lang";

import { errorsField } from "./fields.js";

export function errorsExtension() {
  return [
    linter(
      (view) => {
        const errors = view.state.field(errorsField.field) ?? [];
        const docLength = view.state.doc.length;

        return errors
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
          }));
      },
      {
        delay: 0,
      }
    ),
    errorsField.field,
  ];
}
