import { linter } from "@codemirror/lint";
import { Extension } from "@codemirror/state";

import { SqCompileError, SqRuntimeError } from "@quri/squiggle-lang";

import { errorsFacet, reactPropsEffect } from "./fields.js";

export function errorsExtension(): Extension {
  return [
    linter(
      (view) => {
        const errors = view.state.facet(errorsFacet.facet) ?? [];
        const docLength = view.state.doc.length;

        const diagnostics = errors
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
              err && err.location && err.location.end.offset <= docLength
            );
          })
          .map((err) => ({
            from: err.location.start.offset,
            to: err.location.end.offset,
            severity: "error" as const,
            message: err.err.toString(),
          }));
        return diagnostics;
      },
      {
        delay: 0,
        needsRefresh: ({ transactions }) => {
          // When the new react props arrive (including `errors` field), it's applied in `useEffect` and then becomes available through facet.
          for (const tr of transactions) {
            for (const e of tr.effects) if (e.is(reactPropsEffect)) return true;
          }
          return false;
        },
      }
    ),
    errorsFacet.extension,
  ];
}
